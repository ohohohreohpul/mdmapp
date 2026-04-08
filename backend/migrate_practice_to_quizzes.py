"""
migrate_practice_to_quizzes.py

Reads every practice_module from Supabase, transforms its embedded questions
from the import schema (prompt / answer / content.options) to the format the
Next.js Duolingo renderer expects (question / options / correct_answer), then
writes one quiz row per module into the `quizzes` table.

After running this:
  • The /api/practice/module/:id endpoint finds questions in the quizzes table
    (the preferred path) and serves them directly to the renderer.
  • The embedded questions in practice_modules are left untouched as a backup.

Usage:
    python3 migrate_practice_to_quizzes.py [--dry-run]

Environment variables (loaded from .env):
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
"""

import json
import sys
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

DRY_RUN = "--dry-run" in sys.argv


# ── Question transformer ──────────────────────────────────────────────────────

def transform_question(q: dict) -> dict:
    """
    Convert one embedded question to Next.js renderer format.

    Input (embedded / import schema):
        prompt          → question text
        answer          → correct option ID  (e.g. "a")
        content.options → [{id, label, content}, ...]
        content.cards   → [...] for micro-lesson
        etc.

    Output (renderer schema):
        question        → question text (copied from prompt)
        options         → [str, ...]  flat label list for MC
        correct_answer  → str matching the correct option label
        micro_lesson    → {cards: [...]}  for micro-lesson type
        concept_reveal  → {...}           for concept-reveal type
        scenario_nodes  → [...]           for scenario type
        type            → unchanged (keeps "multiple-choice" with hyphen)
    """
    q_type  = (q.get("type") or q.get("question_type") or "multiple-choice").strip()
    content = q.get("content") or {}
    out     = dict(q)
    out["type"] = q_type

    # ── question text ────────────────────────────────────────────────────────
    if not out.get("question"):
        out["question"] = out.get("prompt") or ""

    # ── self-contained: micro-lesson ─────────────────────────────────────────
    if q_type == "micro-lesson":
        if not out.get("micro_lesson"):
            out["micro_lesson"] = {"cards": content.get("cards") or []}
        return out

    # ── self-contained: concept-reveal ───────────────────────────────────────
    if q_type == "concept-reveal":
        if not out.get("concept_reveal"):
            out["concept_reveal"] = content.get("conceptReveal") or {}
        return out

    # ── scenario ─────────────────────────────────────────────────────────────
    if q_type == "scenario":
        if not out.get("scenario_nodes"):
            out["scenario_nodes"] = content.get("scenarioNodes") or []
        # correct_answer = choice id for the renderer's answer check
        if not out.get("correct_answer") and out.get("answer"):
            out["correct_answer"] = str(out["answer"])
        return out

    # ── fill-blank ───────────────────────────────────────────────────────────
    if q_type == "fill-blank":
        if not out.get("correct_answer"):
            blanks = (content.get("visual") or {}).get("config", {}).get("blanks", [])
            if blanks:
                id_to_label: dict = {}
                for blank in blanks:
                    for opt in blank.get("options", []):
                        id_to_label[opt["id"]] = opt.get("label") or opt["id"]
                raw = str(out.get("answer") or "").split(",")[0].strip()
                out["correct_answer"] = id_to_label.get(raw, raw)
            elif out.get("answer"):
                out["correct_answer"] = str(out["answer"])
        return out

    # ── drag-arrange ─────────────────────────────────────────────────────────
    # Not rendered specially in Next.js → fall through to MC with no options
    if q_type == "drag-arrange":
        return out

    # ── options-based: multiple-choice / comparison / chart-* ────────────────
    content_opts = content.get("options") or []
    if content_opts:
        # Each option: {id, label, content}.  The renderer shows the 'content'
        # field (the actual answer sentence); fall back to 'label' if absent.
        out["options"] = [
            (o.get("content") or o.get("label") or str(o.get("id", "")))
            for o in content_opts if isinstance(o, dict)
        ]
        raw_answer = str(out.get("answer") or "")
        id_to_text  = {
            o["id"]: (o.get("content") or o.get("label") or o["id"])
            for o in content_opts if isinstance(o, dict) and "id" in o
        }
        out["correct_answer"] = id_to_text.get(raw_answer, raw_answer)

    return out


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    url  = os.environ.get("SUPABASE_URL")
    key  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.")
        sys.exit(1)

    sb = create_client(url, key)

    # Fetch all practice modules (including their embedded questions)
    print("Fetching practice modules …")
    res = sb.table("practice_modules") \
            .select("id, course_id, module_key, module_order, title, questions") \
            .execute()
    modules = res.data or []
    print(f"  Found {len(modules)} modules.\n")

    total_inserted   = 0
    total_questions  = 0
    skipped_modules  = 0

    for mod in modules:
        module_id  = mod["id"]
        course_id  = mod["course_id"]
        module_key = mod.get("module_key") or module_id
        title      = mod.get("title") or module_key
        embedded   = mod.get("questions") or []

        if not embedded:
            print(f"  ⚠  {title}: no embedded questions — skipping.")
            skipped_modules += 1
            continue

        # Transform every question
        transformed = [transform_question(dict(q)) for q in embedded]
        total_questions += len(transformed)

        print(f"  → {title}  ({len(transformed)} questions)")

        if DRY_RUN:
            # Show a sample
            sample = transformed[0] if transformed else {}
            print(f"     sample: type={sample.get('type')}  "
                  f"question={str(sample.get('question',''))[:60]}…")
            continue

        # Upsert into quizzes table.
        # quiz_type = module_key so the backend can filter per-module.
        existing = sb.table("quizzes") \
                     .select("id") \
                     .eq("course_id", course_id) \
                     .eq("quiz_type", module_key) \
                     .execute()

        if existing.data:
            quiz_id = existing.data[0]["id"]
            sb.table("quizzes") \
              .update({"questions": transformed, "title": title}) \
              .eq("id", quiz_id) \
              .execute()
            print(f"     updated quiz {quiz_id}")
        else:
            sb.table("quizzes").insert({
                "course_id": course_id,
                "quiz_type": module_key,
                "title":     title,
                "questions": transformed,
            }).execute()
            print(f"     inserted new quiz row")

        total_inserted += 1

    print()
    if DRY_RUN:
        print(f"DRY RUN complete — {len(modules)} modules, {total_questions} questions would be written.")
    else:
        print(f"✅  Done — {total_inserted} quizzes written, "
              f"{total_questions} questions, {skipped_modules} modules skipped.")


if __name__ == "__main__":
    main()

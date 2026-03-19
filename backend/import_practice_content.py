"""
Import practice content (Duolingo-style questions) into Supabase.

Usage:
  python3 import_practice_content.py <path-to-json> [course_id]

If course_id is omitted the script will auto-match by title.
"""
import json
import sys
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def main():
    json_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not json_path:
        print("Usage: python3 import_practice_content.py <path-to-json> [course_id]")
        sys.exit(1)

    forced_course_id = sys.argv[2] if len(sys.argv) > 2 else None

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    course_title = data.get("courseTitle", "")
    json_course_id = data.get("courseId", "")
    print(f"JSON course: '{course_title}' (key: {json_course_id})")

    # ── Resolve course UUID ───────────────────────────────────────────────────
    if forced_course_id:
        course_id = forced_course_id
        r = sb.table("courses").select("id,title").eq("id", course_id).single().execute()
        print(f"Using provided course: {r.data['title']}")
    else:
        # Try exact title match first, then fuzzy
        keywords = [w for w in course_title.replace("&", "").split() if len(w) > 3]
        r = sb.table("courses").select("id,title").ilike("title", f"%{'%'.join(keywords[:3])}%").execute()
        if not r.data:
            print("ERROR: Could not find matching course. Available courses:")
            all_courses = sb.table("courses").select("id,title").limit(20).execute()
            for c in all_courses.data:
                print(f"  {c['id']}  {c['title']}")
            print("\nRe-run with explicit course_id as second argument.")
            sys.exit(1)

        if len(r.data) > 1:
            print("Multiple matches found:")
            for i, c in enumerate(r.data):
                print(f"  [{i}] {c['id']}  {c['title']}")
            choice = int(input("Pick index: "))
            course = r.data[choice]
        else:
            course = r.data[0]

        course_id = course["id"]
        print(f"Matched course: {course['title']} → {course_id}")

    # ── Wipe old modules for this course ────────────────────────────────────
    deleted = sb.table("practice_modules").delete().eq("course_id", course_id).execute()
    print(f"Cleared old practice modules for course.")

    # ── Insert modules ────────────────────────────────────────────────────────
    for module in data["modules"]:
        questions = []
        for batch in module.get("batches", []):
            questions.extend(batch.get("lessons", []))

        row = {
            "course_id": course_id,
            "module_key": module["moduleId"],
            "module_order": module["moduleOrder"],
            "title": module["moduleTitle"],
            "questions": questions,
            "question_count": len(questions),
            "mastery_threshold": data.get("config", {}).get("masteryThreshold", 70),
        }
        sb.table("practice_modules").insert(row).execute()
        print(f"  ✓ {module['moduleTitle']}  ({len(questions)} questions)")

    total = sum(
        sum(len(b.get("lessons", [])) for b in m.get("batches", []))
        for m in data["modules"]
    )
    print(f"\n✅ Done — {len(data['modules'])} modules, {total} questions imported.")


if __name__ == "__main__":
    main()

"""
prepare_lesson_json.py
─────────────────────
Transforms the raw UX lesson JSON files (which lack module-level metadata)
into the format expected by import_practice_content.py.

Usage:
  python3 prepare_lesson_json.py

Outputs:
  ux-research-ready.json
  ux-ideation-ready.json

Then import with:
  python3 import_practice_content.py ux-research-ready.json
  python3 import_practice_content.py ux-ideation-ready.json
"""

import json
import os

DOWNLOADS = os.path.expanduser("~/Downloads")

# ── Module metadata ──────────────────────────────────────────────────────────

RESEARCH_MODULES = {
    "ux-res-1": {
        "moduleTitle": "User Interviews",
        "moduleOrder": 1,
        "description": "เทคนิคการทำ User Interview, Open-ended Questions, และการสังเคราะห์ข้อมูลเชิงคุณภาพ",
    },
    "ux-res-2": {
        "moduleTitle": "Surveys & Quantitative Data",
        "moduleOrder": 2,
        "description": "การออกแบบ Survey, Likert Scale, การวิเคราะห์ข้อมูลเชิงปริมาณ และ Mixed Methods",
    },
    "ux-res-3": {
        "moduleTitle": "Personas & Empathy Maps",
        "moduleOrder": 3,
        "description": "การสร้าง User Persona, Empathy Map, และการนำข้อมูลจาก Research มาสร้างตัวแทนผู้ใช้",
    },
    "ux-res-4": {
        "moduleTitle": "User Journey Mapping",
        "moduleOrder": 4,
        "description": "การทำ User Journey Map, Touchpoints, Pain Points, และ Moments of Delight",
    },
    "ux-res-5": {
        "moduleTitle": "Problem Statements & HMW",
        "moduleOrder": 5,
        "description": "การเขียน Problem Statement, Point-of-View Statement, และ How Might We Questions",
    },
}

IDEATION_MODULES = {
    "ux-idea-1": {
        "moduleTitle": "Brainstorming Techniques",
        "moduleOrder": 1,
        "description": "Crazy 8s, Mind Mapping, SCAMPER และเทคนิคการระดมสมองสำหรับ UX/UI Design",
    },
    "ux-idea-2": {
        "moduleTitle": "Information Architecture",
        "moduleOrder": 2,
        "description": "Card Sorting, Site Maps, User Flows, Navigation Patterns และโครงสร้างข้อมูล",
    },
    "ux-idea-3": {
        "moduleTitle": "Low-Fi Wireframing",
        "moduleOrder": 3,
        "description": "หลักการ Wireframing, Lo-fi vs Hi-fi, เครื่องมือ Digital Wireframe, และ Layout Basics",
    },
    "ux-idea-4": {
        "moduleTitle": "Wireframe Components",
        "moduleOrder": 4,
        "description": "UI Components, Buttons, Cards, Forms, Navigation Bars และ Design Patterns ใน Wireframes",
    },
    "ux-idea-5": {
        "moduleTitle": "Responsive Wireframing",
        "moduleOrder": 5,
        "description": "Mobile-First Design, Breakpoints, Responsive Layouts และการปรับ Wireframe สำหรับทุก Device",
    },
}

COURSE_META = {
    "ux-research-2026-03-19.json": {
        "courseTitle": "Empathize with User Research & Define User Need",
        "courseId": "ux-research",
        "module_map": RESEARCH_MODULES,
        "output": "ux-research-ready.json",
    },
    "ux-ideation-2026-03-19.json": {
        "courseTitle": "Ideation & Creation of Wireframes",
        "courseId": "ux-ideation",
        "module_map": IDEATION_MODULES,
        "output": "ux-ideation-ready.json",
    },
}


def transform(input_filename: str) -> None:
    meta = COURSE_META[input_filename]
    input_path = os.path.join(DOWNLOADS, input_filename)
    output_path = os.path.join(DOWNLOADS, meta["output"])

    print(f"\n📂  Reading  {input_path}")
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    module_map = meta["module_map"]
    enriched_modules = []

    for raw_module in data["modules"]:
        # Detect which module this is from the first lesson
        first_lesson = raw_module["batches"][0]["lessons"][0]
        mod_id = first_lesson["moduleId"]

        if mod_id not in module_map:
            print(f"  ⚠️  Unknown moduleId '{mod_id}' — skipping")
            continue

        info = module_map[mod_id]
        enriched = {
            "moduleId": mod_id,
            "moduleOrder": info["moduleOrder"],
            "moduleTitle": info["moduleTitle"],
            "description": info["description"],
            **raw_module,          # keeps "batches" and any other existing keys
        }
        enriched_modules.append(enriched)
        total_lessons = sum(len(b["lessons"]) for b in raw_module["batches"])
        print(f"  ✅  {mod_id}  →  \"{info['moduleTitle']}\"  ({total_lessons} questions)")

    output_data = {
        "courseTitle": meta["courseTitle"],
        "courseId": meta["courseId"],
        "path": data.get("path", "ux-ui"),
        "config": data["config"],
        "modules": enriched_modules,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    total_q = sum(
        len(b["lessons"])
        for m in enriched_modules
        for b in m["batches"]
    )
    print(f"  💾  Written → {output_path}")
    print(f"  📊  {len(enriched_modules)} modules, {total_q} questions total")


if __name__ == "__main__":
    for filename in COURSE_META:
        transform(filename)

    print("\n✨  Done!")
    print()
    print("Next steps:")
    print("  1. Make sure the courses exist in Supabase first.")
    print("     Course titles must match exactly (or pass UUID as 2nd arg).")
    print()
    print("  2. Import:")
    print(f"     python3 import_practice_content.py ~/Downloads/ux-research-ready.json")
    print(f"     python3 import_practice_content.py ~/Downloads/ux-ideation-ready.json")

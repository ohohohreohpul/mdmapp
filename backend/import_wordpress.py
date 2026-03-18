"""
Mydemy WordPress → Supabase Import Script
==========================================
Imports users, courses, lessons, topics, quizzes, and progress
from a WordPress/LearnDash JSON export into Supabase (PostgreSQL).

Usage:
    cd backend
    python3 import_wordpress.py [--file /path/to/wordpress-export.json]

Requirements:
    pip install supabase phpserialize python-dotenv
"""

import json
import os
import sys
import time
import argparse
from datetime import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

try:
    import phpserialize
except ImportError:
    print("❌  Missing: pip install phpserialize")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    print("❌  Missing: pip install supabase")
    sys.exit(1)


# ── Supabase client ──────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# WordPress ID → Supabase UUID mapping
wp_to_uuid: Dict[str, Dict[int, str]] = {
    "users": {},
    "courses": {},
    "modules": {},
    "lessons": {},
    "topics": {},
    "quizzes": {},
}

BATCH_SIZE = 200  # rows per upsert call


# ── Helpers ──────────────────────────────────────────────────

def safe_int(value) -> Optional[int]:
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def parse_php(data_str: str) -> Any:
    """Parse a PHP serialized string into a Python object."""
    if not data_str or not isinstance(data_str, str):
        return {}
    try:
        return phpserialize.loads(data_str.encode(), decode_strings=True)
    except Exception:
        return {}


def detect_career_path(title: str) -> str:
    t = title.lower()
    if any(k in t for k in ("ux", "ui", "design", "ดีไซน์", "ออกแบบ")):
        return "UX Design"
    if any(k in t for k in ("data", "analytics", "sql", "excel", "ข้อมูล")):
        return "Data Analysis"
    if any(k in t for k in ("marketing", "ads", "social", "seo", "โฆษณา", "การตลาด")):
        return "Digital Marketing"
    if any(k in t for k in ("project", "management", "agile", "scrum", "โปรเจกต์")):
        return "Project Management"
    if any(k in t for k in ("python", "code", "programming", "โปรแกรม", "เขียนโค้ด")):
        return "Programming"
    return "General"


def batch_insert(table: str, rows: List[dict], label: str = "") -> List[dict]:
    """Insert rows in batches; return all inserted rows."""
    inserted = []
    for i in range(0, len(rows), BATCH_SIZE):
        chunk = rows[i: i + BATCH_SIZE]
        try:
            res = sb.table(table).insert(chunk).execute()
            inserted.extend(res.data or [])
        except Exception as e:
            print(f"   ⚠️  Batch {i//BATCH_SIZE+1} error ({label}): {e}")
        time.sleep(0.05)  # gentle rate limiting
    return inserted


# ── Clear ────────────────────────────────────────────────────

def clear_existing_data():
    print("\n🗑️  Clearing existing data...")
    # FK order matters — children first
    for tbl in ["user_progress", "quiz_submissions", "learning_sessions",
                 "knowledge_levels", "generated_quizzes", "learning_materials",
                 "quizzes", "lessons", "modules", "courses", "users"]:
        try:
            # delete all rows — Supabase requires a filter; use neq on a constant column
            sb.table(tbl).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception as e:
            print(f"   ⚠️  Could not clear {tbl}: {e}")
    print("   ✅ Done")


# ── Users ────────────────────────────────────────────────────

def import_users(users_data: List[dict]) -> int:
    print(f"\n👤 Importing {len(users_data):,} users...")
    rows = []
    for u in users_data:
        wp_id = safe_int(u.get("user_id"))
        if wp_id is None:
            continue
        meta = u.get("meta") or {}
        rows.append({
            "wp_id": wp_id,
            "username": u.get("username", f"user_{wp_id}"),
            "email": u.get("email", f"user_{wp_id}@import.local"),
            "display_name": u.get("display_name", ""),
            "first_name": meta.get("first_name", ""),
            "last_name": meta.get("last_name", ""),
            "password_hash": u.get("password_hash", ""),
            "must_reset_password": True,   # WP migrants must reset
            "migrated_from_wp": True,
            "certificates": [],
        })

    inserted = batch_insert("users", rows, "users")
    for row in inserted:
        wp_id = row.get("wp_id")
        if wp_id is not None:
            wp_to_uuid["users"][wp_id] = row["id"]

    print(f"   ✅ Imported {len(inserted):,} users")
    return len(inserted)


# ── Courses ──────────────────────────────────────────────────

def import_courses(courses_data: List[dict]) -> int:
    print(f"\n📚 Importing {len(courses_data):,} courses...")
    imported = 0
    # Insert one by one so we can reliably map wp_id → supabase uuid
    for c in courses_data:
        wp_id = safe_int(c.get("course_id"))
        if wp_id is None:
            continue
        try:
            res = sb.table("courses").insert({
                "title": c.get("title", ""),
                "description": c.get("description", "") or c.get("short_description", ""),
                "career_path": detect_career_path(c.get("title", "")),
                "is_published": c.get("status") == "publish",
                "has_final_exam": False,
                "total_lessons": 0,
                "prerequisites": [],
            }).execute()
            if res.data:
                wp_to_uuid["courses"][wp_id] = res.data[0]["id"]
                imported += 1
        except Exception as e:
            print(f"   ⚠️  Course {wp_id} error: {e}")
        time.sleep(0.02)

    print(f"   ✅ Imported {imported:,} courses")
    return imported


# ── Lessons + Modules ────────────────────────────────────────

def import_lessons(lessons_data: List[dict], courses_data: List[dict]) -> int:
    print(f"\n📖 Importing {len(lessons_data):,} lessons...")

    # Build lesson_id → (course_id, order) from each course's ld_course_steps.
    # The _sfwd-lessons meta is unreliable in this export (always shows course=0).
    lesson_to_course_wp: Dict[int, int] = {}
    lesson_order_in_course: Dict[int, int] = {}
    for course in courses_data:
        c_wp_id = safe_int(course.get("course_id"))
        if c_wp_id is None:
            continue
        steps = parse_php(course.get("meta", {}).get("ld_course_steps", ""))
        if not isinstance(steps, dict):
            continue
        h = steps.get("steps", {}).get("h", {})
        lessons_dict = h.get("sfwd-lessons", {})
        for idx, lesson_wp_id in enumerate(lessons_dict.keys()):
            l_id = safe_int(lesson_wp_id)
            if l_id is not None:
                lesson_to_course_wp[l_id] = c_wp_id
                lesson_order_in_course[l_id] = idx + 1

    # Build a lookup dict for quick access to lesson records
    lesson_by_wp_id = {safe_int(l.get("lesson_id")): l for l in lessons_data}

    # Group lessons by WP course ID using the reliable mapping
    by_course: Dict[int, List[dict]] = {}
    orphans = 0
    for lesson in lessons_data:
        wp_lesson_id = safe_int(lesson.get("lesson_id"))
        course_wp_id = lesson_to_course_wp.get(wp_lesson_id) if wp_lesson_id else None
        if course_wp_id and course_wp_id in wp_to_uuid["courses"]:
            by_course.setdefault(course_wp_id, []).append(lesson)
        else:
            orphans += 1

    if orphans:
        print(f"   ⚠️  {orphans} lessons had no matching course — skipped")

    total_lessons = 0
    for wp_course_id, lessons in by_course.items():
        course_uuid = wp_to_uuid["courses"][wp_course_id]

        # Create one module per course
        mod_res = sb.table("modules").insert({
            "course_id": course_uuid,
            "title": "บทเรียนทั้งหมด",
            "description": "",
            "order_index": 1,
            "unlock_after_days": 0,
        }).execute()
        if not mod_res.data:
            continue
        module_uuid = mod_res.data[0]["id"]
        wp_to_uuid["modules"][wp_course_id] = module_uuid

        # Sort by the order derived from ld_course_steps
        lessons.sort(key=lambda x: lesson_order_in_course.get(safe_int(x.get("lesson_id")), 9999))

        lesson_rows = []
        lesson_wp_ids = []
        for lesson in lessons:
            wp_lesson_id = safe_int(lesson.get("lesson_id"))
            if wp_lesson_id is None:
                continue
            meta = lesson.get("meta") or {}
            video_url = meta.get("lesson_video_url", "") or meta.get("_lesson_video", "")
            order_idx = lesson_order_in_course.get(wp_lesson_id, len(lesson_rows) + 1)
            lesson_rows.append({
                "module_id": module_uuid,
                "title": lesson.get("title", ""),
                "description": lesson.get("excerpt", "") or "",
                "order_index": order_idx,
                "content_type": "video" if video_url else "article",
                "article_content": lesson.get("content", ""),
                "video_url": video_url if video_url else None,
                "duration_minutes": 0,
                "has_quiz": False,
            })
            lesson_wp_ids.append(wp_lesson_id)

        inserted = batch_insert("lessons", lesson_rows, f"lessons for course {wp_course_id}")
        for i, row in enumerate(inserted):
            if i < len(lesson_wp_ids):
                wp_to_uuid["lessons"][lesson_wp_ids[i]] = row["id"]
        total_lessons += len(inserted)

        # Update course total_lessons
        sb.table("courses").update({"total_lessons": len(inserted)}).eq("id", course_uuid).execute()

    print(f"   ✅ Imported {total_lessons:,} lessons across {len(by_course)} courses")
    return total_lessons


# ── User Progress ────────────────────────────────────────────

def import_user_progress(progress_data: List[dict]) -> int:
    print(f"\n📈 Importing {len(progress_data):,} progress records...")

    # Aggregate by user_id
    by_user: Dict[int, List[dict]] = {}
    for rec in progress_data:
        uid = safe_int(rec.get("user_id"))
        if uid:
            by_user.setdefault(uid, []).append(rec)

    rows = []
    for wp_user_id, records in by_user.items():
        user_uuid = wp_to_uuid["users"].get(wp_user_id)
        if not user_uuid:
            continue

        # Parse all course-progress records for this user
        course_progress: Dict[str, List[str]] = {}  # course_uuid → [lesson_uuids]

        for rec in records:
            if rec.get("meta_key") != "_sfwd-course_progress":
                continue
            parsed = parse_php(rec.get("meta_value", ""))
            if not isinstance(parsed, dict):
                continue

            for wp_course_id_raw, cp in parsed.items():
                wp_course_id = safe_int(wp_course_id_raw)
                course_uuid = wp_to_uuid["courses"].get(wp_course_id)
                if not course_uuid or not isinstance(cp, dict):
                    continue

                completed: List[str] = []
                for wp_lesson_id_raw, status in (cp.get("lessons") or {}).items():
                    if status == 1:
                        lesson_uuid = wp_to_uuid["lessons"].get(safe_int(wp_lesson_id_raw))
                        if lesson_uuid:
                            completed.append(lesson_uuid)

                course_progress[course_uuid] = completed

        for course_uuid, completed_lessons in course_progress.items():
            rows.append({
                "user_id": user_uuid,
                "course_id": course_uuid,
                "completed_lessons": completed_lessons,
                "quiz_scores": {},
            })

    # Upsert in batches
    updated = 0
    for i in range(0, len(rows), BATCH_SIZE):
        chunk = rows[i: i + BATCH_SIZE]
        try:
            sb.table("user_progress").upsert(
                chunk, on_conflict="user_id,course_id"
            ).execute()
            updated += len(chunk)
        except Exception as e:
            print(f"   ⚠️  Progress batch {i//BATCH_SIZE+1} error: {e}")
        time.sleep(0.05)

    print(f"   ✅ Imported progress for {updated:,} user-course pairs")
    return updated


# ── Main ─────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Import WordPress export into Supabase")
    parser.add_argument(
        "--file", default="../wordpress-export.json",
        help="Path to wordpress-export.json (default: ../wordpress-export.json)"
    )
    parser.add_argument(
        "--skip-clear", action="store_true",
        help="Skip clearing existing data"
    )
    parser.add_argument(
        "--users-only", action="store_true",
        help="Import only users (useful for re-imports)"
    )
    args = parser.parse_args()

    # Resolve path relative to this script
    export_path = os.path.join(os.path.dirname(__file__), args.file)
    if not os.path.exists(export_path):
        export_path = args.file  # try as-is
    if not os.path.exists(export_path):
        print(f"❌  Export file not found: {args.file}")
        sys.exit(1)

    print("=" * 60)
    print("🚀  Mydemy WordPress → Supabase Import")
    print("=" * 60)
    print(f"📂  Loading: {export_path}")

    with open(export_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"\n📊  Export summary:")
    for key in ("users", "courses", "lessons", "topics", "quizzes", "user_progress", "quiz_results"):
        print(f"     {key}: {len(data.get(key, [])):,}")

    if not args.skip_clear:
        clear_existing_data()

    import_users(data.get("users", []))

    if not args.users_only:
        import_courses(data.get("courses", []))
        import_lessons(data.get("lessons", []), data.get("courses", []))
        import_user_progress(data.get("user_progress", []))

    print("\n" + "=" * 60)
    print("✅  Import Complete!")
    print("=" * 60)

    # Final counts
    print("\n📊  Supabase row counts:")
    for tbl in ("users", "courses", "modules", "lessons", "user_progress"):
        try:
            res = sb.table(tbl).select("id", count="exact").execute()
            print(f"     {tbl}: {res.count:,}")
        except Exception as e:
            print(f"     {tbl}: error — {e}")


if __name__ == "__main__":
    main()

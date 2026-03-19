"""
Award all course completions and certificates to a user by email.

Usage:
  python3 award_all_certificates.py <email>

Example:
  python3 award_all_certificates.py jiranan@mydemy.co
"""
import sys
import os
import string
import secrets
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def gen_cert_code(prefix="MDY"):
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(chars) for _ in range(6))
    now = datetime.utcnow()
    return f"{prefix}-{now.year}{now.month:02d}-{suffix}"

def main():
    email = sys.argv[1] if len(sys.argv) > 1 else None
    if not email:
        print("Usage: python3 award_all_certificates.py <email>")
        sys.exit(1)

    sb = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    # ── 1. Find user ──────────────────────────────────────────
    res = sb.table("users").select("id,username,display_name,email").eq("email", email).maybe_single().execute()
    if not res.data:
        print(f"❌ No user found with email: {email}")
        sys.exit(1)

    user = res.data
    user_id = user["id"]
    display_name = user.get("display_name") or user.get("username") or "ผู้เรียน"
    print(f"✅ Found user: {display_name} ({user_id})")

    # ── 2. Get all published courses ─────────────────────────
    courses_res = sb.table("courses").select("id,title,career_path,total_lessons").eq("is_published", True).execute()
    courses = courses_res.data or []
    print(f"📚 Found {len(courses)} published courses")

    now = datetime.utcnow()

    # ── 3. For each course: mark progress + issue cert ────────
    for course in courses:
        cid = course["id"]
        title = course["title"]
        total = course.get("total_lessons", 0)

        # Get all lesson IDs for this course (through modules)
        lesson_ids = []
        mods_res = sb.table("modules").select("id").eq("course_id", cid).execute()
        for mod in (mods_res.data or []):
            lessons_res = sb.table("lessons").select("id").eq("module_id", mod["id"]).execute()
            lesson_ids += [l["id"] for l in (lessons_res.data or [])]

        # Upsert user_progress with all lessons completed
        existing_res = sb.table("user_progress") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("course_id", cid) \
            .limit(1) \
            .execute()
        existing_prog = (existing_res.data or [])[0] if existing_res.data else None

        if existing_prog:
            sb.table("user_progress").update({"completed_lessons": lesson_ids}).eq("user_id", user_id).eq("course_id", cid).execute()
        else:
            sb.table("user_progress").insert({
                "user_id": user_id,
                "course_id": cid,
                "completed_lessons": lesson_ids,
                "quiz_scores": {},
            }).execute()
        print(f"   📖 Progress set for: {title} ({len(lesson_ids)} lessons)")

        # Issue course certificate (idempotent)
        cert_check = sb.table("certificates") \
            .select("id,verification_code") \
            .eq("user_id", user_id) \
            .eq("course_id", cid) \
            .limit(1) \
            .execute()
        cert_existing = (cert_check.data or [])[0] if cert_check.data else None

        if cert_existing:
            print(f"   🎓 Cert already exists: {cert_existing['verification_code']}")
        else:
            code = gen_cert_code("MDY")
            sb.table("certificates").insert({
                "user_id": user_id,
                "cert_type": "course",
                "course_id": cid,
                "career_path": course.get("career_path"),
                "course_title": title,
                "user_display_name": display_name,
                "issue_month": now.month,
                "issue_year": now.year,
                "verification_code": code,
            }).execute()
            print(f"   🎓 Course cert issued: {code}  →  {title}")

    # ── 4. Also update the legacy users.certificates array ───
    course_ids = [c["id"] for c in courses]
    sb.table("users").update({"certificates": course_ids}).eq("id", user_id).execute()
    print("✅ Updated users.certificates array")

    # ── 5. Issue career certificates ─────────────────────────
    # Group courses by career_path
    career_map: dict[str, list] = {}
    for c in courses:
        cp = c.get("career_path")
        if cp:
            career_map.setdefault(cp, []).append(c["title"])

    for career_path, course_titles in career_map.items():
        career_check = sb.table("certificates") \
            .select("id,verification_code") \
            .eq("user_id", user_id) \
            .eq("career_path", career_path) \
            .eq("cert_type", "career") \
            .limit(1) \
            .execute()
        career_cert_existing = (career_check.data or [])[0] if career_check.data else None

        if career_cert_existing:
            print(f"   🏆 Career cert already exists for: {career_path}  ({career_cert_existing['verification_code']})")
        else:
            code = gen_cert_code("MDY")
            sb.table("certificates").insert({
                "user_id": user_id,
                "cert_type": "career",
                "career_path": career_path,
                "career_courses": course_titles,
                "course_title": career_path,
                "user_display_name": display_name,
                "issue_month": now.month,
                "issue_year": now.year,
                "verification_code": code,
            }).execute()
            print(f"   🏆 Career cert issued:  {code}  →  {career_path}")

    print("\n🎉 Done! All courses completed and certificates issued.")

if __name__ == "__main__":
    main()

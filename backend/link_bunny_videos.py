#!/usr/bin/env python3
"""
link_bunny_videos.py — Maps Bunny.net CSV exports to courses/lessons in the backend.

Usage:
  # Preview what will happen (no changes made):
  python3 link_bunny_videos.py --dry-run

  # Apply to production backend:
  python3 link_bunny_videos.py --api-url https://mdmapp-production.up.railway.app

  # Apply to local backend:
  python3 link_bunny_videos.py --api-url http://localhost:8001

CSV paths (edit if needed):
  UX library  → UX_CSV below
  Data library → DATA_CSV below
"""

import argparse
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import requests

# ── CSV file paths (edit as needed) ──────────────────────────────────────────
UX_CSV   = "/Users/jirananpanlanatiyarak/Downloads/bunny/bunny_library_export_ux.csv"
DATA_CSV = "/Users/jirananpanlanatiyarak/Downloads/bunny/bunny_library_export.csv"

# ── Data library collection → target course title ────────────────────────────
# Key   = collection name in CSV
# Value = (course_title, career_path, module_title_override_or_None)
COLLECTION_MAP: Dict[str, tuple] = {
    "Data Foundations":
        ("Introduction of Data Analytics",      "Data Analysis",        None),
    "Intro Python with Logo":
        ("Introduction to Python",              "Data Analysis",        None),
    # "Intro Python" is a subset duplicate of "Intro Python with Logo" — SKIP
    "Python 1":
        ("วิเคราะห์ข้อมูลด้วย Python Part 1",  "Data Analysis",        None),
    "Data Python 2":
        ("วิเคราะห์ข้อมูลด้วย Python Part 2",  "Data Analysis",        None),
    "Creating Your Own Data Visualization":
        ("Data Analysis and Visualization Capstone", "Data Analysis",   None),
    "Data Visualization":
        ("Introduction to Data Storytelling",   "Data Analysis",        None),
    "PM123":
        ("The Complete Series of Project Management (1-3)", "Project Management", None),
    "Project Manager 004":
        ("Project Leadership in the Digital Age (Part 4)",  "Project Management", None),
    "LD":
        ("Learning Design for Adult Learner",   "Learning Designer",    None),
    "DEI":
        ("DEI",                                 "General",              None),
}

# Collections to skip (duplicates / raw recordings)
SKIP_COLLECTIONS = {"Intro Python", "No Collection"}


# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class VideoRow:
    name: str
    library_id: str
    collection_id: str
    collection_name: str
    player_url: str
    remark: str = ""

    @property
    def video_id(self) -> str:
        return self.player_url.rstrip("/").split("/")[-1]

    @property
    def embed_url(self) -> str:
        return self.player_url.replace(
            "https://player.mediadelivery.net/play/",
            "https://iframe.mediadelivery.net/embed/",
        )

    @property
    def lesson_title(self) -> str:
        t = self.name.replace(".mp4", "").replace("_", " ").strip()
        return t


def read_csv(path: str) -> List[VideoRow]:
    rows: List[VideoRow] = []
    with open(path, "r", encoding="utf-8-sig") as f:
        lines = f.readlines()
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        parts = line.split(";")
        if len(parts) < 5:
            continue
        rows.append(VideoRow(
            name=parts[0].strip(),
            library_id=parts[1].strip(),
            collection_id=parts[2].strip(),
            collection_name=parts[3].strip(),
            player_url=parts[4].strip(),
            remark=parts[5].strip() if len(parts) > 5 else "",
        ))
    return rows


def sort_by_name(videos: List[VideoRow]) -> List[VideoRow]:
    def key(v: VideoRow):
        nums = re.findall(r"\d+", v.name)
        return [int(n) for n in nums] if nums else [0]
    return sorted(videos, key=key)


# ── API helpers ───────────────────────────────────────────────────────────────

def api_get(url: str):
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return r.json()

def api_post(url: str, data: dict, dry_run: bool):
    if dry_run:
        return {"_id": f"__dry_run__"}
    r = requests.post(url, json=data, timeout=15)
    r.raise_for_status()
    return r.json()

def api_put(url: str, data: dict, dry_run: bool):
    if dry_run:
        return {}
    r = requests.put(url, json=data, timeout=15)
    r.raise_for_status()
    return r.json()

def get_all_courses(api: str) -> List[dict]:
    return api_get(f"{api}/api/courses")

def get_modules(api: str, course_id: str) -> List[dict]:
    return api_get(f"{api}/api/modules/course/{course_id}")

def get_lessons(api: str, module_id: str) -> List[dict]:
    return api_get(f"{api}/api/lessons/module/{module_id}")

def find_course(courses: List[dict], title: str) -> Optional[dict]:
    title_l = title.lower()
    for c in courses:
        if c.get("title", "").lower() == title_l:
            return c
    for c in courses:
        ct = c.get("title", "").lower()
        if title_l in ct or ct in title_l:
            return c
    return None

def ensure_course(api: str, courses: List[dict], title: str, career_path: str, dry_run: bool):
    existing = find_course(courses, title)
    if existing:
        cid = existing.get("_id") or existing.get("id")
        print(f"    ✓ Found course: '{existing['title']}' ({cid})")
        return cid, False  # (id, was_created)
    print(f"    + Creating course: '{title}' [{career_path}]")
    result = api_post(f"{api}/api/courses", {
        "title": title,
        "description": "",
        "career_path": career_path,
        "thumbnail": "",
        "prerequisites": "",
    }, dry_run)
    cid = result.get("_id") or result.get("id") or "__dry_run__"
    return cid, True

def ensure_module(api: str, course_id: str, modules: List[dict], title: str, order: int, dry_run: bool):
    title_l = title.lower()
    for m in modules:
        if m.get("title", "").lower() == title_l:
            mid = m.get("_id") or m.get("id")
            print(f"      ✓ Found module: '{m['title']}' ({mid})")
            return mid, False
    print(f"      + Creating module: '{title}' (order {order})")
    result = api_post(f"{api}/api/modules", {
        "course_id": course_id,
        "title": title,
        "description": "",
        "order": order,
    }, dry_run)
    mid = result.get("_id") or result.get("id") or "__dry_run__"
    return mid, True

def add_video_lesson(api: str, module_id: str, title: str, order: int,
                     embed_url: str, video_id: str, dry_run: bool):
    print(f"        {'[DRY]' if dry_run else '     '} Lesson {order:>2}: {title}")
    api_post(f"{api}/api/lessons", {
        "module_id": module_id,
        "title": title,
        "description": "",
        "order": order,
        "content_type": "video",
        "video_url": embed_url,
        "video_id": video_id,
        "duration_minutes": 0,
    }, dry_run)


# ── UX library processing ─────────────────────────────────────────────────────

def process_ux(api: str, rows: List[VideoRow], courses: List[dict], dry_run: bool):
    print("\n" + "═" * 60)
    print("  UX LIBRARY  (library 109506 → Introduction to UX&UI Designs)")
    print("═" * 60)

    # Group by chapter: prefer rows with a real collection (C2-C8),
    # fall back to remark for C1 (which has no collection).
    chapters: Dict[str, List[VideoRow]] = defaultdict(list)
    seen_guids: set = set()

    ux_rows = [r for r in rows if r.library_id == "109506"]

    # First pass: rows with a proper collection name (C2..C8)
    for r in ux_rows:
        if r.collection_name not in ("", "No Collection") and r.video_id not in seen_guids:
            chapters[r.collection_name].append(r)
            seen_guids.add(r.video_id)

    # Second pass: "No Collection" rows whose remark identifies a chapter (e.g., "C1")
    for r in ux_rows:
        if r.collection_name in ("", "No Collection") and r.remark and r.video_id not in seen_guids:
            chapters[r.remark].append(r)
            seen_guids.add(r.video_id)

    if not chapters:
        print("  ⚠  No UX videos found. Check CSV path.")
        return

    # Identify the UX course
    ux_course = None
    for title_candidate in [
        "Introduction to UX&UI Designs",
        "Introduction to UX",
        "UX Design",
    ]:
        ux_course = find_course(courses, title_candidate)
        if ux_course:
            break

    if not ux_course:
        print("  ⚠  Could not find UX Design course.")
        print("     Expected title: 'Introduction to UX&UI Designs'")
        print("     Courses found:")
        for c in courses[:10]:
            print(f"       - {c.get('title')}")
        return

    course_id = ux_course.get("_id") or ux_course.get("id")
    print(f"\n  Course: '{ux_course['title']}' ({course_id})")

    existing_modules = get_modules(api, course_id) if not course_id.startswith("__") else []

    for chapter_name in sorted(chapters.keys()):
        videos = sort_by_name(chapters[chapter_name])
        num = re.search(r"\d+", chapter_name)
        order = int(num.group()) if num else 99
        module_title = f"Chapter {order} — Video Lessons"

        print(f"\n  [{chapter_name}] → {module_title} ({len(videos)} videos)")

        if not dry_run and not course_id.startswith("__"):
            mod_id, _ = ensure_module(api, course_id, existing_modules, module_title, order, dry_run)
        else:
            print(f"      [DRY] Would create/find module: '{module_title}'")
            mod_id = "__dry_run__"

        for i, v in enumerate(videos, 1):
            add_video_lesson(api, mod_id, v.lesson_title, i, v.embed_url, v.video_id, dry_run)


# ── Data library processing ───────────────────────────────────────────────────

def process_data(api: str, rows: List[VideoRow], courses: List[dict], dry_run: bool):
    print("\n" + "═" * 60)
    print("  DATA LIBRARY  (library 128809 → various courses)")
    print("═" * 60)

    data_rows = [r for r in rows if r.library_id == "128809"]

    # Group by collection
    by_coll: Dict[str, List[VideoRow]] = defaultdict(list)
    for r in data_rows:
        by_coll[r.collection_name].append(r)

    for coll_name, videos in sorted(by_coll.items()):
        if coll_name in SKIP_COLLECTIONS:
            print(f"\n  [{coll_name}] — SKIPPED ({len(videos)} videos)")
            continue

        mapping = COLLECTION_MAP.get(coll_name)
        if not mapping:
            print(f"\n  [{coll_name}] — NO MAPPING DEFINED, skipping")
            continue

        course_title, career_path, mod_override = mapping
        videos = sort_by_name(videos)
        mod_title = mod_override or coll_name

        print(f"\n  [{coll_name}] ({len(videos)} videos) → '{course_title}'")

        course_id, created = ensure_course(api, courses, course_title, career_path, dry_run)

        if created and not dry_run:
            # Reload courses list so next ensure_course can find this new one
            courses[:] = get_all_courses(api)

        if not dry_run and not str(course_id).startswith("__"):
            existing_mods = get_modules(api, course_id)
        else:
            existing_mods = []

        mod_id, _ = ensure_module(api, course_id, existing_mods, mod_title, 1, dry_run)

        for i, v in enumerate(videos, 1):
            add_video_lesson(api, mod_id, v.lesson_title, i, v.embed_url, v.video_id, dry_run)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Link Bunny.net videos to backend courses.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print plan without making any API calls (safe preview)")
    parser.add_argument("--api-url", default="http://localhost:8001",
                        help="Backend API base URL")
    parser.add_argument("--ux-only",  action="store_true", help="Only process UX library")
    parser.add_argument("--data-only", action="store_true", help="Only process Data library")
    args = parser.parse_args()

    api = args.api_url.rstrip("/")
    print(f"API:     {api}")
    print(f"DRY RUN: {args.dry_run}")
    if args.dry_run:
        print("         (no changes will be made — remove --dry-run to apply)\n")

    # Load CSVs
    try:
        ux_rows   = read_csv(UX_CSV)
        data_rows = read_csv(DATA_CSV)
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    print(f"Loaded  {len(ux_rows):>3} UX videos  from {UX_CSV}")
    print(f"Loaded  {len(data_rows):>3} Data videos from {DATA_CSV}")

    # Fetch existing courses
    try:
        courses = get_all_courses(api)
    except Exception as e:
        print(f"\nERROR fetching courses from {api}: {e}")
        if not args.dry_run:
            sys.exit(1)
        courses = []

    print(f"Found   {len(courses):>3} existing courses on backend\n")

    if not args.data_only:
        process_ux(api, ux_rows, courses, args.dry_run)

    if not args.ux_only:
        process_data(api, data_rows, courses, args.dry_run)

    print("\n" + "═" * 60)
    print(f"  {'DRY RUN COMPLETE — no changes made' if args.dry_run else 'IMPORT COMPLETE'}")
    print("═" * 60)


if __name__ == "__main__":
    main()

"""
Gamification Service — XP, Levels, Streaks, Badges
Now powered by Supabase (PostgreSQL) instead of MongoDB.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List

from supabase import AsyncClient

# ── XP Configuration ─────────────────────────────────────────
XP_PER_LESSON = 10
XP_PER_QUIZ_CORRECT = 5
XP_PER_COURSE_COMPLETE = 100
XP_PER_PERFECT_QUIZ = 25

# ── Level thresholds ──────────────────────────────────────────
LEVEL_THRESHOLDS = [
    0,      # Level 1
    100,    # Level 2
    250,    # Level 3
    500,    # Level 4
    1000,   # Level 5
    2000,   # Level 6
    3500,   # Level 7
    5500,   # Level 8
    8000,   # Level 9
    12000,  # Level 10
    18000,  # Level 11
    26000,  # Level 12
    36000,  # Level 13
    50000,  # Level 14
    70000,  # Level 15
]

# ── Badges ────────────────────────────────────────────────────
BADGES = {
    "first_lesson": {"id": "first_lesson", "name": "ก้าวแรก", "description": "เรียนบทเรียนแรกสำเร็จ", "icon": "🎯"},
    "streak_3":     {"id": "streak_3",     "name": "ไฟไม่มอด", "description": "เรียนต่อเนื่อง 3 วัน",  "icon": "🔥"},
    "streak_7":     {"id": "streak_7",     "name": "นักสู้",    "description": "เรียนต่อเนื่อง 7 วัน",  "icon": "💪"},
    "streak_30":    {"id": "streak_30",    "name": "ไม่หยุดพัฒนา", "description": "เรียนต่อเนื่อง 30 วัน", "icon": "👑"},
    "perfect_quiz": {"id": "perfect_quiz", "name": "เพอร์เฟค!", "description": "ทำแบบทดสอบได้ 100%",   "icon": "⭐"},
    "first_course": {"id": "first_course", "name": "จบคอร์สแรก", "description": "เรียนจบคอร์สแรก",     "icon": "🎓"},
    "xp_1000":      {"id": "xp_1000",      "name": "พันแต้ม",   "description": "สะสม 1,000 XP",        "icon": "🌟"},
    "level_5":      {"id": "level_5",      "name": "ระดับ 5",   "description": "ถึงระดับ 5",            "icon": "🏆"},
    "level_10":     {"id": "level_10",     "name": "ระดับ 10",  "description": "ถึงระดับ 10",           "icon": "💎"},
}


def calculate_level(xp: int) -> int:
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if xp < threshold:
            return i
    return len(LEVEL_THRESHOLDS)


def get_level_progress(xp: int) -> Dict[str, Any]:
    level = calculate_level(xp)
    if level >= len(LEVEL_THRESHOLDS):
        return {"level": level, "current_xp": xp, "xp_for_next": None, "xp_in_level": 0, "progress_percent": 100}

    current_threshold = LEVEL_THRESHOLDS[level - 1] if level > 0 else 0
    next_threshold = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else xp
    xp_in_level = xp - current_threshold
    xp_needed = next_threshold - current_threshold
    progress = (xp_in_level / xp_needed * 100) if xp_needed > 0 else 100

    return {
        "level": level,
        "current_xp": xp,
        "xp_for_next": next_threshold,
        "xp_in_level": xp_in_level,
        "xp_needed": xp_needed,
        "progress_percent": round(progress, 1),
    }


async def get_or_create_user_stats(supabase: AsyncClient, user_id: str) -> Dict[str, Any]:
    # Use limit(1) instead of maybe_single() — the async client returns None (not an
    # object with .data) from maybe_single() when no row exists, causing AttributeError.
    res = await supabase.table("user_stats").select("*").eq("user_id", user_id).limit(1).execute()
    if res and res.data and len(res.data) > 0:
        return res.data[0]

    # Create default stats row
    new_stats = {
        "user_id": user_id,
        "xp_total": 0,
        "daily_goal": 30,
        "current_streak": 0,
        "longest_streak": 0,
        "last_activity_date": None,
        "badges": [],
        "daily_xp": {},
        "lessons_completed": 0,
        "quizzes_passed": 0,
        "courses_completed": 0,
    }
    ins = await supabase.table("user_stats").insert(new_stats).execute()
    return ins.data[0] if ins.data else new_stats


async def add_xp(
    supabase: AsyncClient,
    user_id: str,
    xp_amount: int,
    reason: str = "lesson",
) -> Dict[str, Any]:
    stats = await get_or_create_user_stats(supabase, user_id)

    today = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    # ── XP ───────────────────────────────────────────────────
    new_xp = (stats.get("xp_total") or 0) + xp_amount
    daily_xp: Dict[str, int] = dict(stats.get("daily_xp") or {})
    daily_xp[today] = daily_xp.get(today, 0) + xp_amount

    # ── Streak ───────────────────────────────────────────────
    last_activity = stats.get("last_activity_date")
    current_streak = stats.get("current_streak") or 0
    longest_streak = stats.get("longest_streak") or 0

    if last_activity:
        last_str = last_activity if isinstance(last_activity, str) else str(last_activity)[:10]
        if last_str == today:
            pass  # same day — streak unchanged
        elif last_str == yesterday:
            current_streak += 1  # consecutive day
        else:
            current_streak = 1   # broken
    else:
        current_streak = 1

    longest_streak = max(longest_streak, current_streak)

    # ── Badges ───────────────────────────────────────────────
    existing_badges: List[Dict] = list(stats.get("badges") or [])
    existing_ids = {b["id"] for b in existing_badges}
    new_badges = []

    if reason == "lesson" and "first_lesson" not in existing_ids:
        new_badges.append(BADGES["first_lesson"])
    if current_streak >= 3 and "streak_3" not in existing_ids:
        new_badges.append(BADGES["streak_3"])
    if current_streak >= 7 and "streak_7" not in existing_ids:
        new_badges.append(BADGES["streak_7"])
    if current_streak >= 30 and "streak_30" not in existing_ids:
        new_badges.append(BADGES["streak_30"])
    if new_xp >= 1000 and "xp_1000" not in existing_ids:
        new_badges.append(BADGES["xp_1000"])

    new_level = calculate_level(new_xp)
    if new_level >= 5 and "level_5" not in existing_ids:
        new_badges.append(BADGES["level_5"])
    if new_level >= 10 and "level_10" not in existing_ids:
        new_badges.append(BADGES["level_10"])

    for b in new_badges:
        existing_badges.append({"id": b["id"], "earned_at": datetime.utcnow().isoformat()})

    # ── Counter increments ───────────────────────────────────
    update = {
        "xp_total": new_xp,
        "daily_xp": daily_xp,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_activity_date": today,
        "badges": existing_badges,
    }
    if reason == "lesson":
        update["lessons_completed"] = (stats.get("lessons_completed") or 0) + 1
    elif reason == "quiz":
        update["quizzes_passed"] = (stats.get("quizzes_passed") or 0) + 1
    elif reason == "course":
        update["courses_completed"] = (stats.get("courses_completed") or 0) + 1

    await supabase.table("user_stats").update(update).eq("user_id", user_id).execute()

    return {
        "xp_added": xp_amount,
        "new_total_xp": new_xp,
        "level_info": get_level_progress(new_xp),
        "streak": current_streak,
        "new_badges": new_badges,
        "daily_xp_today": daily_xp[today],
        "daily_goal": stats.get("daily_goal", 30),
        "daily_goal_met": daily_xp[today] >= stats.get("daily_goal", 30),
    }


async def get_user_dashboard(supabase: AsyncClient, user_id: str) -> Dict[str, Any]:
    stats = await get_or_create_user_stats(supabase, user_id)

    today = datetime.utcnow().strftime("%Y-%m-%d")
    daily_xp: Dict[str, int] = dict(stats.get("daily_xp") or {})
    today_xp = daily_xp.get(today, 0)
    daily_goal = stats.get("daily_goal", 30)

    # Last 7 days activity
    week_activity = []
    for i in range(6, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        week_activity.append({
            "date": date,
            "xp": daily_xp.get(date, 0),
            "goal_met": daily_xp.get(date, 0) >= daily_goal,
        })

    # Enrich badge objects with full metadata
    user_badges = []
    for b in (stats.get("badges") or []):
        if b["id"] in BADGES:
            info = dict(BADGES[b["id"]])
            info["earned_at"] = b.get("earned_at")
            user_badges.append(info)

    return {
        "xp_total": stats.get("xp_total", 0),
        "level_info": get_level_progress(stats.get("xp_total", 0)),
        "current_streak": stats.get("current_streak", 0),
        "longest_streak": stats.get("longest_streak", 0),
        "daily_goal": daily_goal,
        "today_xp": today_xp,
        "daily_progress_percent": min(100, round(today_xp / daily_goal * 100)) if daily_goal > 0 else 0,
        "week_activity": week_activity,
        "badges": user_badges,
        "stats": {
            "lessons_completed": stats.get("lessons_completed", 0),
            "quizzes_passed": stats.get("quizzes_passed", 0),
            "courses_completed": stats.get("courses_completed", 0),
        },
    }

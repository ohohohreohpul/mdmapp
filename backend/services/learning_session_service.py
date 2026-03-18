"""
Learning Session Service — Duolingo-style infinite learning
Now powered by Supabase (PostgreSQL) instead of MongoDB.
"""
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from supabase import AsyncClient
from .openrouter_service import generate_learning_session, get_personalized_feedback

logger = logging.getLogger(__name__)

PASS_THRESHOLD = 80
MIN_QUESTIONS_PER_SESSION = 5
MAX_QUESTIONS_PER_SESSION = 10


# ── Knowledge levels ──────────────────────────────────────────

async def get_or_create_knowledge_level(
    supabase: AsyncClient,
    user_id: str,
    lesson_id: str,
) -> Dict[str, Any]:
    res = await supabase.table("knowledge_levels") \
        .select("*").eq("user_id", user_id).eq("lesson_id", lesson_id).maybe_single().execute()
    if res.data:
        return res.data

    new_record = {
        "user_id": user_id,
        "lesson_id": lesson_id,
        "knowledge_score": 0,
        "attempts": 0,
        "questions_answered": 0,
        "correct_answers": 0,
        "wrong_topics": [],
        "is_unlocked": False,
        "best_score": 0,
        "last_attempt": None,
    }
    ins = await supabase.table("knowledge_levels").insert(new_record).execute()
    return ins.data[0] if ins.data else new_record


# ── Session start ─────────────────────────────────────────────

async def start_learning_session(
    supabase: AsyncClient,
    user_id: str,
    lesson_id: str,
) -> Dict[str, Any]:
    # Fetch lesson
    lesson_res = await supabase.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    if not lesson_res.data:
        return {"error": "ไม่พบบทเรียน", "success": False}
    lesson = lesson_res.data

    # Fetch module + course for context
    module_res = await supabase.table("modules").select("course_id").eq("id", lesson["module_id"]).maybe_single().execute()
    course_id = (module_res.data or {}).get("course_id")
    career_path = "General"
    if course_id:
        course_res = await supabase.table("courses").select("career_path").eq("id", course_id).maybe_single().execute()
        if course_res.data:
            career_path = course_res.data.get("career_path", "General")

    knowledge = await get_or_create_knowledge_level(supabase, user_id, lesson_id)

    # Determine difficulty
    if knowledge["attempts"] == 0 or knowledge["best_score"] >= 70:
        difficulty = "medium"
    elif knowledge["best_score"] < 50:
        difficulty = "easy"
    else:
        difficulty = "medium"

    content = lesson.get("article_content") or lesson.get("description", "")

    # Append learning materials
    mat_res = await supabase.table("learning_materials").select("content").eq("lesson_id", lesson_id).execute()
    for mat in (mat_res.data or []):
        content += "\n\n" + mat.get("content", "")

    session_data = await generate_learning_session(
        lesson_content=content,
        lesson_title=lesson.get("title", ""),
        career_path=career_path,
        num_questions=MIN_QUESTIONS_PER_SESSION,
        difficulty=difficulty,
        previous_mistakes=(knowledge.get("wrong_topics") or [])[:5],
    )

    session_record = {
        "user_id": user_id,
        "lesson_id": lesson_id,
        "course_id": str(course_id) if course_id else None,
        "questions": session_data.get("questions", []),
        "intro": session_data.get("intro", ""),
        "tips": session_data.get("tips", []),
        "difficulty": difficulty,
        "completed": False,
    }
    ins = await supabase.table("learning_sessions").insert(session_record).execute()
    session_id = ins.data[0]["id"]

    return {
        "success": True,
        "session_id": session_id,
        "lesson_title": lesson.get("title", ""),
        "intro": session_data.get("intro", ""),
        "questions": session_data.get("questions", []),
        "tips": session_data.get("tips", []),
        "current_knowledge": knowledge["knowledge_score"],
        "pass_threshold": PASS_THRESHOLD,
        "attempt_number": knowledge["attempts"] + 1,
    }


# ── Session submit ────────────────────────────────────────────

async def submit_learning_session(
    supabase: AsyncClient,
    user_id: str,
    session_id: str,
    answers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    session_res = await supabase.table("learning_sessions").select("*").eq("id", session_id).maybe_single().execute()
    if not session_res.data:
        return {"error": "ไม่พบเซสชัน", "success": False}
    session = session_res.data

    if session["user_id"] != user_id:
        return {"error": "ไม่มีสิทธิ์", "success": False}

    questions = session.get("questions") or []
    lesson_id = session.get("lesson_id")

    # Grade answers
    correct_count = 0
    wrong_topics: List[str] = []
    results = []

    for i, q in enumerate(questions):
        user_answer = next(
            (a.get("answer") for a in answers if a.get("question_index") == i),
            None,
        )
        q_type = q.get("type", "multiple_choice")
        is_correct = False

        if q_type in ("multiple_choice", "scenario", "image_question"):
            is_correct = user_answer == q.get("correct_index", 0)
        elif q_type == "true_false":
            is_correct = user_answer == q.get("correct_answer", True)
        elif q_type == "fill_blank":
            correct_ans = str(q.get("correct_answer", "")).lower().strip()
            user_ans = str(user_answer).lower().strip() if user_answer is not None else ""
            is_correct = user_ans == correct_ans or correct_ans in user_ans

        if is_correct:
            correct_count += 1
        else:
            topic = q.get("topic", "")
            if topic and topic not in wrong_topics:
                wrong_topics.append(topic)

        results.append({
            "question_index": i,
            "is_correct": is_correct,
            "correct_answer": q.get("correct_index") if q_type in ("multiple_choice", "scenario", "image_question") else q.get("correct_answer"),
            "explanation": q.get("explanation", ""),
            "topic": q.get("topic", ""),
        })

    total_questions = len(questions)
    score_percent = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
    passed = score_percent >= PASS_THRESHOLD

    # Update session row
    await supabase.table("learning_sessions").update({
        "completed": True,
        "score": score_percent,
        "correct_count": correct_count,
        "passed": passed,
        "completed_at": datetime.utcnow().isoformat(),
        "results": results,
    }).eq("id", session_id).execute()

    # Update knowledge level
    knowledge = await get_or_create_knowledge_level(supabase, user_id, lesson_id)
    existing_wrong: List[str] = list(knowledge.get("wrong_topics") or [])
    combined_wrong = list(set(existing_wrong + wrong_topics))[:10]

    kl_update = {
        "knowledge_score": score_percent,
        "last_attempt": datetime.utcnow().isoformat(),
        "is_unlocked": passed,
        "attempts": (knowledge.get("attempts") or 0) + 1,
        "questions_answered": (knowledge.get("questions_answered") or 0) + total_questions,
        "correct_answers": (knowledge.get("correct_answers") or 0) + correct_count,
        "wrong_topics": combined_wrong,
    }
    if score_percent > (knowledge.get("best_score") or 0):
        kl_update["best_score"] = score_percent

    await supabase.table("knowledge_levels").update(kl_update) \
        .eq("user_id", user_id).eq("lesson_id", lesson_id).execute()

    # Personalised feedback
    course_id = session.get("course_id")
    career_path = "General"
    if course_id:
        c_res = await supabase.table("courses").select("career_path").eq("id", course_id).maybe_single().execute()
        if c_res.data:
            career_path = c_res.data.get("career_path", "General")

    feedback = await get_personalized_feedback(
        score_percent=score_percent,
        wrong_topics=wrong_topics,
        career_path=career_path,
    )

    return {
        "success": True,
        "score": score_percent,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "passed": passed,
        "pass_threshold": PASS_THRESHOLD,
        "results": results,
        "wrong_topics": wrong_topics,
        "feedback": feedback,
        "can_proceed": passed,
        "best_score": max(score_percent, knowledge.get("best_score") or 0),
    }


# ── Lesson unlock check ───────────────────────────────────────

async def check_lesson_unlock(
    supabase: AsyncClient,
    user_id: str,
    lesson_id: str,
) -> Dict[str, Any]:
    knowledge = await get_or_create_knowledge_level(supabase, user_id, lesson_id)
    return {
        "is_unlocked": knowledge.get("is_unlocked", False) or knowledge.get("knowledge_score", 0) >= PASS_THRESHOLD,
        "knowledge_score": knowledge.get("knowledge_score", 0),
        "best_score": knowledge.get("best_score", 0),
        "attempts": knowledge.get("attempts", 0),
        "pass_threshold": PASS_THRESHOLD,
    }


# ── Course progress ───────────────────────────────────────────

async def get_course_progress(
    supabase: AsyncClient,
    user_id: str,
    course_id: str,
) -> Dict[str, Any]:
    modules_res = await supabase.table("modules").select("*").eq("course_id", course_id).order("order_index").execute()
    modules = modules_res.data or []

    total_lessons = 0
    unlocked_lessons = 0
    lesson_progress = []

    for module in modules:
        lessons_res = await supabase.table("lessons").select("*") \
            .eq("module_id", module["id"]).order("order_index").execute()

        for lesson in (lessons_res.data or []):
            total_lessons += 1
            lid = lesson["id"]

            kl_res = await supabase.table("knowledge_levels").select("*") \
                .eq("user_id", user_id).eq("lesson_id", lid).maybe_single().execute()
            kl = kl_res.data

            is_unlocked = False
            knowledge_score = 0
            if kl:
                is_unlocked = kl.get("is_unlocked", False) or kl.get("knowledge_score", 0) >= PASS_THRESHOLD
                knowledge_score = kl.get("knowledge_score", 0)

            if is_unlocked:
                unlocked_lessons += 1

            lesson_progress.append({
                "lesson_id": lid,
                "title": lesson.get("title", ""),
                "module_id": module["id"],
                "is_unlocked": is_unlocked,
                "knowledge_score": knowledge_score,
                "best_score": kl.get("best_score", 0) if kl else 0,
            })

    overall_progress = round((unlocked_lessons / total_lessons) * 100) if total_lessons > 0 else 0

    return {
        "course_id": course_id,
        "total_lessons": total_lessons,
        "unlocked_lessons": unlocked_lessons,
        "overall_progress": overall_progress,
        "lesson_progress": lesson_progress,
    }

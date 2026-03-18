"""
AI Service for Quiz Generation and Lesson Summaries
Uses OpenAI (gpt-4o-mini) via the openai package — no proprietary dependencies.
Falls back gracefully when no API key is configured.
"""
import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


async def generate_quiz_questions(
    content: str,
    lesson_title: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    language: str = "thai",
) -> List[Dict[str, Any]]:
    """Generate multiple-choice quiz questions from lesson content using OpenAI."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set — skipping AI quiz generation")
        return []

    prompt = f"""สร้าง {num_questions} คำถามแบบ multiple choice จากเนื้อหาต่อไปนี้

หัวข้อ: {lesson_title}
ระดับความยาก: {difficulty}

เนื้อหา:
{content[:3000]}

ตอบเป็น JSON array ในรูปแบบนี้เท่านั้น:
[
  {{
    "question": "คำถาม",
    "options": ["ตัวเลือก A", "ตัวเลือก B", "ตัวเลือก C", "ตัวเลือก D"],
    "correct_index": 0,
    "explanation": "คำอธิบายสั้นๆ"
  }}
]"""

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "คุณเป็นผู้เชี่ยวชาญในการสร้างแบบทดสอบการเรียนรู้ที่มีคุณภาพสูง "
                        "ตอบเป็น JSON array เท่านั้น ห้ามมีข้อความอื่น"
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content.strip()
        # The JSON object mode wraps array in an object — unwrap if needed
        parsed = json.loads(raw)
        questions: List[Dict] = parsed if isinstance(parsed, list) else (
            parsed.get("questions") or parsed.get("items") or list(parsed.values())[0]
        )

        validated = []
        for q in questions:
            if all(k in q for k in ("question", "options", "correct_index")):
                validated.append({
                    "question": q["question"],
                    "options": q["options"][:4],
                    "correct_index": min(int(q["correct_index"]), len(q["options"]) - 1),
                    "explanation": q.get("explanation", ""),
                    "type": "multiple_choice",
                })
        return validated[:num_questions]

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI quiz response as JSON: {e}")
        return []
    except Exception as e:
        logger.error(f"Error generating quiz questions: {e}")
        return []


async def generate_lesson_summary(content: str, max_length: int = 200) -> str:
    """Generate a short Thai summary of lesson content using OpenAI."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set — skipping AI summary")
        return ""

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "สรุปเนื้อหาให้สั้นกระชับ เข้าใจง่าย"},
                {"role": "user", "content": f"สรุปเนื้อหานี้ใน {max_length} ตัวอักษร:\n\n{content[:2000]}"},
            ],
            temperature=0.5,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()[:max_length]
    except Exception as e:
        logger.error(f"Error generating lesson summary: {e}")
        return ""


async def get_personalized_recommendation(
    user_progress: Dict[str, Any],
    available_courses: List[Dict[str, Any]],
) -> List[str]:
    """Get personalised course_id recommendations for a user."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return []

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        prompt = (
            f"จากความก้าวหน้าของผู้เรียน:\n{json.dumps(user_progress, ensure_ascii=False)}\n\n"
            f"และคอร์สที่มี:\n"
            f"{json.dumps([{'id': c.get('_id', c.get('id')), 'title': c['title'], 'path': c['career_path']} for c in available_courses[:20]], ensure_ascii=False)}\n\n"
            "แนะนำ 3 course_id ที่เหมาะสมที่สุด ตอบเป็น JSON array ของ course_id เท่านั้น"
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "คุณเป็น AI ที่แนะนำคอร์สเรียนตามความก้าวหน้าของผู้เรียน ตอบเป็น JSON เท่านั้น"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            response_format={"type": "json_object"},
        )
        raw = json.loads(response.choices[0].message.content.strip())
        ids = raw if isinstance(raw, list) else list(raw.values())[0]
        return ids[:3]
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return []

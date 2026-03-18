"""
OpenRouter AI Service for Mydemy Learning Sessions
Supports multiple AI models through unified API
"""
import os
import json
import httpx
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# OpenRouter Configuration
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Available models
MODELS = {
    "fast": "openai/gpt-4o-mini",
    "smart": "openai/gpt-4o",
    "claude": "anthropic/claude-3.5-sonnet",
    "gemini": "google/gemini-2.0-flash-001",
    "auto": "openrouter/auto"  # Auto-select best model
}


async def call_openrouter(
    messages: List[Dict[str, str]],
    model: str = "fast",
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> Optional[str]:
    """
    Call OpenRouter API with messages
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Model key from MODELS dict
        temperature: Randomness (0-2)
        max_tokens: Max response length
    
    Returns:
        Response text or None on error
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY not set")
        return None
    
    model_id = MODELS.get(model, MODELS["fast"])
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mydemy.app",
        "X-Title": "Mydemy Learning App"
    }
    
    payload = {
        "model": model_id,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.error(f"OpenRouter error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"OpenRouter request failed: {str(e)}")
        return None


async def generate_learning_session(
    lesson_content: str,
    lesson_title: str,
    career_path: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    previous_mistakes: List[str] = None
) -> Dict[str, Any]:
    """
    Generate a Duolingo-style learning session with varied question types
    
    Returns:
        {
            "intro": "Brief intro text",
            "questions": [...],
            "tips": ["learning tips"]
        }
    """
    
    difficulty_thai = {
        "easy": "ง่าย เหมาะสำหรับมือใหม่",
        "medium": "ปานกลาง ต้องเข้าใจเนื้อหา",
        "hard": "ยาก ต้องวิเคราะห์และประยุกต์ใช้"
    }
    
    mistake_context = ""
    if previous_mistakes:
        mistake_context = f"""\n\nผู้เรียนเคยตอบผิดในหัวข้อเหล่านี้: {', '.join(previous_mistakes)}
กรุณาสร้างคำถามที่ช่วยทบทวนหัวข้อเหล่านี้ด้วย"""
    
    system_prompt = """คุณเป็นผู้เชี่ยวชาญสร้างแบบทดสอบการเรียนรู้สไตล์ Duolingo

สไตล์ภาษา:
- ใช้ภาษาไทยแบบ GenZ สนุกสนาน ไม่เป็นทางการมาก
- ใช้ emoji ประกอบบ้าง
- ให้กำลังใจผู้เรียน

รูปแบบคำถามที่ต้องสร้าง:
1. multiple_choice - 4 ตัวเลือก
2. true_false - จริง/เท็จ
3. fill_blank - เติมคำในช่องว่าง
4. scenario - สถานการณ์จำลอง/case study
5. image_question - คำถามที่ต้องมีรูปประกอบ (ให้ image_prompt สำหรับสร้างรูป)

ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น"""
    
    user_prompt = f"""สร้างแบบทดสอบ {num_questions} ข้อ สำหรับบทเรียน:

หัวข้อ: {lesson_title}
สาขา: {career_path}
ระดับ: {difficulty_thai.get(difficulty, difficulty_thai['medium'])}

เนื้อหา:
{lesson_content[:4000]}
{mistake_context}

ตอบเป็น JSON ในรูปแบบนี้:
{{
  "intro": "ข้อความแนะนำสั้นๆ สไตล์ GenZ พร้อม emoji",
  "questions": [
    {{
      "type": "multiple_choice",
      "question": "คำถาม",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "คำอธิบายสั้นๆ ทำไมตอบนี้",
      "hint": "คำใบ้ถ้าตอบผิด",
      "topic": "หัวข้อที่ทดสอบ"
    }},
    {{
      "type": "true_false",
      "question": "ข้อความ (จริงหรือเท็จ)",
      "correct_answer": true,
      "explanation": "คำอธิบาย",
      "topic": "หัวข้อที่ทดสอบ"
    }},
    {{
      "type": "fill_blank",
      "question": "ประโยคที่มี _____ ให้เติม",
      "correct_answer": "คำตอบ",
      "hint": "คำใบ้",
      "topic": "หัวข้อที่ทดสอบ"
    }},
    {{
      "type": "scenario",
      "scenario": "สถานการณ์จำลองที่ต้องวิเคราะห์",
      "question": "คำถามจากสถานการณ์",
      "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
      "correct_index": 0,
      "explanation": "คำอธิบายการวิเคราะห์",
      "topic": "หัวข้อที่ทดสอบ"
    }},
    {{
      "type": "image_question",
      "image_prompt": "คำอธิบายรูปภาพที่ควรแสดง เช่น wireframe, chart, diagram",
      "image_description": "คำอธิบายรูปเป็นข้อความสำหรับ accessibility",
      "question": "คำถามเกี่ยวกับรูป",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "คำอธิบาย",
      "topic": "หัวข้อที่ทดสอบ"
    }}
  ],
  "tips": ["เคล็ดลับการเรียน 1", "เคล็ดลับ 2"]
}}

สำคัญ: 
- สร้างคำถามหลากหลายประเภท
- คำถามต้องทดสอบความเข้าใจ ไม่ใช่แค่จำ
- ตัวเลือกผิดต้องดูสมเหตุสมผล"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        response = await call_openrouter(messages, model="smart", temperature=0.8)
        
        if not response:
            return get_fallback_session(lesson_title)
        
        # Parse JSON
        response_text = response.strip()
        
        # Handle markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        session_data = json.loads(response_text)
        
        # Validate structure
        if "questions" not in session_data:
            return get_fallback_session(lesson_title)
        
        return session_data
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        return get_fallback_session(lesson_title)
    except Exception as e:
        logger.error(f"Session generation error: {e}")
        return get_fallback_session(lesson_title)


def get_fallback_session(lesson_title: str) -> Dict[str, Any]:
    """Return a fallback session if AI fails"""
    return {
        "intro": f"มาทดสอบความเข้าใจเรื่อง {lesson_title} กันเถอะ! 💪 (โหมดออฟไลน์)",
        "questions": [
            {
                "type": "multiple_choice",
                "question": f"ข้อใดเป็นหลักการสำคัญของ {lesson_title}?",
                "options": [
                    "การวางแผนที่ดี",
                    "การวิเคราะห์ข้อมูล", 
                    "การทำงานเป็นทีม",
                    "ทั้งหมดที่กล่าวมา"
                ],
                "correct_index": 3,
                "explanation": "ทุกข้อล้วนสำคัญในการทำงานจริง",
                "hint": "คิดถึงหลักการทั่วไป",
                "topic": lesson_title
            },
            {
                "type": "true_false",
                "question": f"{lesson_title} เป็นหัวข้อสำคัญสำหรับการทำงาน",
                "correct_answer": True,
                "explanation": "ใช่ เป็นความรู้พื้นฐานที่จำเป็น",
                "hint": "ทุกหัวข้อในคอร์สมีความสำคัญ",
                "topic": lesson_title
            },
            {
                "type": "fill_blank", 
                "question": f"การเรียนรู้ _____ จะช่วยให้เราทำงานได้ดีขึ้น",
                "correct_answer": lesson_title.lower(),
                "explanation": f"การเรียนรู้ {lesson_title} เป็นพื้นฐานสำคัญ",
                "hint": "ชื่อหัวข้อที่เรากำลังเรียน",
                "topic": lesson_title
            },
            {
                "type": "scenario",
                "scenario": f"คุณกำลังเริ่มเรียนรู้เกี่ยวกับ {lesson_title} ในโปรเจกต์งานใหม่",
                "question": "สิ่งแรกที่คุณควรทำคืออะไร?",
                "options": [
                    "ทำความเข้าใจพื้นฐานก่อน",
                    "เริ่มทำงานเลย",
                    "ถามเพื่อนร่วมงาน",
                    "หาข้อมูลเพิ่มเติม"
                ],
                "correct_index": 0,
                "explanation": "การทำความเข้าใจพื้นฐานเป็นสิ่งสำคัญที่สุด",
                "topic": lesson_title
            },
            {
                "type": "multiple_choice",
                "question": f"ประโยชน์หลักของการเรียน {lesson_title} คืออะไร?",
                "options": [
                    "เพื่อสอบผ่าน",
                    "เพื่อนำไปใช้ในงานจริง",
                    "เพื่อความรู้ทั่วไป",
                    "เพื่อเพิ่ม CV"
                ],
                "correct_index": 1,
                "explanation": "เป้าหมายหลักคือการนำความรู้ไปใช้ในงานจริง",
                "hint": "คิดถึงเป้าหมายการเรียนรู้ในระยะยาว",
                "topic": lesson_title
            }
        ],
        "tips": [
            "ลองอ่านเนื้อหาอีกครั้งนะ!",
            "ฝึกทำแบบฝึกหัดเพิ่มเติม",
            "หาตัวอย่างในโลกจริงมาลองวิเคราะห์"
        ]
    }


async def generate_visual_description(
    topic: str,
    visual_type: str = "diagram"
) -> Dict[str, str]:
    """
    Generate description for visual content (chart, diagram, etc.)
    
    Args:
        topic: The topic to visualize
        visual_type: Type of visual (diagram, chart, wireframe, infographic)
    
    Returns:
        {
            "description": "Text description of the visual",
            "alt_text": "Accessibility text",
            "placeholder_emoji": "Emoji to show as placeholder"
        }
    """
    
    visual_emojis = {
        "diagram": "📊",
        "chart": "📈",
        "wireframe": "🖼️",
        "infographic": "📋",
        "flowchart": "🔄",
        "table": "📑"
    }
    
    system_prompt = """สร้างคำอธิบายภาพประกอบการเรียนรู้
ตอบเป็น JSON เท่านั้น"""
    
    user_prompt = f"""สร้างคำอธิบาย {visual_type} สำหรับหัวข้อ: {topic}

ตอบในรูปแบบ:
{{
  "description": "คำอธิบายสิ่งที่แสดงในภาพ (3-4 ประโยค)",
  "alt_text": "ข้อความสำหรับ screen reader",
  "key_points": ["จุดสำคัญ 1", "จุดสำคัญ 2", "จุดสำคัญ 3"]
}}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        response = await call_openrouter(messages, model="fast", temperature=0.5)
        
        if response:
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            data = json.loads(response_text)
            data["placeholder_emoji"] = visual_emojis.get(visual_type, "📊")
            return data
            
    except Exception as e:
        logger.error(f"Visual generation error: {e}")
    
    return {
        "description": f"{visual_type} แสดงข้อมูลเกี่ยวกับ {topic}",
        "alt_text": f"{visual_type} - {topic}",
        "key_points": [topic],
        "placeholder_emoji": visual_emojis.get(visual_type, "📊")
    }


async def get_personalized_feedback(
    score_percent: int,
    wrong_topics: List[str],
    career_path: str
) -> Dict[str, str]:
    """
    Generate personalized feedback based on quiz performance
    """
    
    system_prompt = """คุณเป็นโค้ชการเรียนที่ให้กำลังใจ
ใช้ภาษาไทยแบบ GenZ สนุกสนาน มี emoji
ตอบเป็น JSON เท่านั้น"""
    
    user_prompt = f"""ผู้เรียนทำแบบทดสอบได้ {score_percent}%
สาขา: {career_path}
หัวข้อที่ยังต้องปรับปรุง: {', '.join(wrong_topics) if wrong_topics else 'ไม่มี'}

สร้าง feedback ในรูปแบบ:
{{
  "message": "ข้อความให้กำลังใจ/ยินดี ตามคะแนน",
  "next_action": "แนะนำสิ่งที่ควรทำต่อ",
  "study_tips": ["เคล็ดลับ 1", "เคล็ดลับ 2"]
}}"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        response = await call_openrouter(messages, model="fast", temperature=0.7)
        
        if response:
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            return json.loads(response_text)
            
    except Exception as e:
        logger.error(f"Feedback generation error: {e}")
    
    # Fallback feedback
    if score_percent >= 80:
        return {
            "message": "🎉 เยี่ยมมาก! คุณผ่านแล้ว!",
            "next_action": "ไปบทเรียนถัดไปได้เลย",
            "study_tips": ["ทบทวนบ้างเป็นระยะ"]
        }
    else:
        return {
            "message": f"💪 ได้ {score_percent}% ใกล้แล้ว! ลองอีกครั้งนะ",
            "next_action": "ทบทวนเนื้อหาแล้วลองใหม่",
            "study_tips": [f"โฟกัสเรื่อง {wrong_topics[0]}" if wrong_topics else "อ่านช้าๆ ทำความเข้าใจ"]
        }

from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import acreate_client, AsyncClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

# Password hashing — uses bcrypt package directly (compatible with bcrypt 4.x)
try:
    import bcrypt as _bcrypt_lib

    def _verify_password(plain: str, stored_hash: str) -> bool:
        """Verify a plain password against a stored hash.
        Supports:
          - WordPress bcrypt: $wp$2y$... → strip $wp$ prefix → standard bcrypt
          - Standard bcrypt: $2b$... / $2y$...
        """
        if not stored_hash:
            return False
        h = stored_hash
        if h.startswith("$wp$"):
            # $wp$2y$10$xxx  →  $2y$10$xxx
            h = "$" + h[4:]
        try:
            return _bcrypt_lib.checkpw(plain.encode(), h.encode())
        except Exception:
            return False

    def _hash_password(plain: str) -> str:
        hashed = _bcrypt_lib.hashpw(plain.encode(), _bcrypt_lib.gensalt(rounds=12))
        return hashed.decode()

except ImportError:
    def _verify_password(plain: str, stored_hash: str) -> bool:  # type: ignore[misc]
        """Fallback: plain comparison (dev only — install bcrypt for production)."""
        return bool(stored_hash) and stored_hash == plain

    def _hash_password(plain: str) -> str:  # type: ignore[misc]
        return plain

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ── Supabase client (initialised in lifespan) ─────────────────
supabase: AsyncClient = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase
    supabase = await acreate_client(
        os.environ['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY'],
    )
    logger.info("Supabase client ready")
    yield
    logger.info("Shutting down")


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# ── Helpers ───────────────────────────────────────────────────
def with_id(row: Optional[dict]) -> Optional[dict]:
    """Copy UUID 'id' to '_id' so the frontend keeps working unchanged."""
    if row:
        row["_id"] = row.get("id", "")
    return row


def rows_with_id(rows: List[dict]) -> List[dict]:
    return [with_id(r) for r in rows]


# ==================== MODELS ====================

class AdminSettings(BaseModel):
    ai_provider: str = "openai"
    openai_key: Optional[str] = None
    gemini_key: Optional[str] = None
    claude_key: Optional[str] = None
    elevenlabs_key: Optional[str] = None
    bunny_api_key: Optional[str] = None
    bunny_library_id: Optional[str] = None


class AdminSettingsUpdate(BaseModel):
    ai_provider: Optional[str] = None
    openai_key: Optional[str] = None
    gemini_key: Optional[str] = None
    claude_key: Optional[str] = None
    elevenlabs_key: Optional[str] = None
    bunny_api_key: Optional[str] = None
    bunny_library_id: Optional[str] = None


class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    email: str
    progress: Dict[str, Any] = {}
    certificates: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserCreate(BaseModel):
    username: str
    email: str


class Course(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    career_path: str
    thumbnail: Optional[str] = None
    modules: List[str] = []
    total_lessons: int = 0
    is_published: bool = False
    has_final_exam: bool = True
    prerequisites: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class CourseCreate(BaseModel):
    title: str
    description: str
    career_path: str
    thumbnail: Optional[str] = None
    prerequisites: List[str] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    is_published: Optional[bool] = None
    prerequisites: Optional[List[str]] = None


class Module(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    course_id: str
    title: str
    description: str
    order: int
    lessons: List[str] = []
    unlock_after_days: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ModuleCreate(BaseModel):
    course_id: str
    title: str
    description: str
    order: int
    unlock_after_days: int = 0


class Lesson(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    module_id: str
    title: str
    description: str
    order: int
    content_type: str
    video_url: Optional[str] = None
    video_id: Optional[str] = None
    article_content: Optional[str] = None
    audio_url: Optional[str] = None
    audio_generated: bool = False
    duration_minutes: int = 0
    has_quiz: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class LessonCreate(BaseModel):
    module_id: str
    title: str
    description: str
    order: int
    content_type: str
    video_url: Optional[str] = None
    video_id: Optional[str] = None
    article_content: Optional[str] = None
    duration_minutes: int = 0


class QuizQuestion(BaseModel):
    question: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    media_url: Optional[str] = None


class Quiz(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    lesson_id: Optional[str] = None
    course_id: str
    quiz_type: str
    title: str
    questions: List[QuizQuestion] = []
    passing_score: int = 70
    time_limit_minutes: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class QuizCreate(BaseModel):
    lesson_id: Optional[str] = None
    course_id: str
    quiz_type: str
    title: str
    time_limit_minutes: Optional[int] = None


class QuizSubmission(BaseModel):
    quiz_id: str
    user_id: str
    answers: Dict[str, str]
    score: Optional[int] = None
    passed: Optional[bool] = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)


class LearningMaterial(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    course_id: str
    lesson_id: Optional[str] = None
    title: str
    content: str
    file_type: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class MaterialCreate(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    title: str
    content: str
    file_type: str = "text"


# ── Auth models ───────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    user_id: str
    new_password: str
    current_password: Optional[str] = None  # required if not must_reset_password


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Mydemy Learning API", "version": "2.0.0", "status": "active", "db": "supabase"}


# ===== ADMIN SETTINGS =====

@api_router.get("/admin/settings")
async def get_admin_settings():
    res = await supabase.table("admin_settings").select("*").eq("id", 1).maybe_single().execute()
    if not res.data:
        ins = await supabase.table("admin_settings").insert({"id": 1, "ai_provider": "openai"}).execute()
        return ins.data[0] if ins.data else AdminSettings().dict()
    row = dict(res.data)
    row.pop("id", None)
    return row


@api_router.put("/admin/settings")
async def update_admin_settings(settings: AdminSettingsUpdate):
    update_data = {k: v for k, v in settings.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    await supabase.table("admin_settings").update(update_data).eq("id", 1).execute()
    res = await supabase.table("admin_settings").select("*").eq("id", 1).maybe_single().execute()
    row = dict(res.data or {})
    row.pop("id", None)
    return row


# ===== USERS =====

async def _build_user_response(user: dict) -> dict:
    """Attach reconstructed progress dict and '_id' to a user row."""
    prog_res = await supabase.table("user_progress").select("*").eq("user_id", user["id"]).execute()
    progress: Dict[str, Any] = {}
    for p in (prog_res.data or []):
        progress[p["course_id"]] = {
            "completed_lessons": p.get("completed_lessons") or [],
            "quiz_scores": p.get("quiz_scores") or {},
        }
    user["progress"] = progress
    return with_id(user)


# ===== AUTH =====

@api_router.post("/auth/login")
async def login(body: LoginRequest):
    """
    Authenticate a user.
    - WordPress-migrated users: password verified against $wp$ bcrypt hash.
    - Returns must_reset_password=True for first-time WP migrants.
    """
    # Use .limit(1) instead of .maybe_single() to avoid None response issues
    res = await supabase.table("users").select("*").eq("email", body.email.lower().strip()).limit(1).execute()
    rows = res.data if res and res.data else []
    if not rows:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    user = rows[0]
    stored_hash = user.get("password_hash") or ""

    if not stored_hash:
        raise HTTPException(status_code=401, detail="ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อผู้ดูแล")

    if not _verify_password(body.password, stored_hash):
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    return await _build_user_response(dict(user))


@api_router.post("/auth/register")
async def register(body: RegisterRequest):
    """Register a brand-new user with a password."""
    email = body.email.lower().strip()
    existing = await supabase.table("users").select("id").eq("email", email).limit(1).execute()
    if existing and existing.data:
        raise HTTPException(status_code=400, detail="อีเมลนี้มีบัญชีอยู่แล้ว")

    hashed = _hash_password(body.password)
    res = await supabase.table("users").insert({
        "username": body.username,
        "email": email,
        "password_hash": hashed,
        "must_reset_password": False,
        "certificates": [],
    }).execute()
    return await _build_user_response(res.data[0])


@api_router.post("/auth/change-password")
async def change_password(body: ChangePasswordRequest):
    """
    Change a user's password.
    - If must_reset_password=True (WP migrant first login), current_password is not required.
    - Otherwise current_password must be provided and verified.
    """
    res = await supabase.table("users").select("*").eq("id", body.user_id).limit(1).execute()
    rows = res.data if res and res.data else []
    if not rows:
        raise HTTPException(status_code=404, detail="ไม่พบผู้ใช้")

    user = rows[0]
    must_reset = user.get("must_reset_password", False)

    if not must_reset:
        if not body.current_password:
            raise HTTPException(status_code=400, detail="กรุณากรอกรหัสผ่านเดิม")
        if not _verify_password(body.current_password, user.get("password_hash") or ""):
            raise HTTPException(status_code=401, detail="รหัสผ่านเดิมไม่ถูกต้อง")

    new_hash = _hash_password(body.new_password)
    await supabase.table("users").update({
        "password_hash": new_hash,
        "must_reset_password": False,
    }).eq("id", body.user_id).execute()

    updated = await supabase.table("users").select("*").eq("id", body.user_id).limit(1).execute()
    return await _build_user_response(dict((updated.data or [{}])[0]))


@api_router.post("/auth/forgot-password")
async def forgot_password(email: str):
    """Mark account as must_reset_password (admin-triggered reset flow)."""
    res = await supabase.table("users").select("id").eq("email", email.lower().strip()).limit(1).execute()
    rows = res.data if res and res.data else []
    if not rows:
        return {"message": "หากมีบัญชี เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้"}
    await supabase.table("users").update({
        "must_reset_password": True,
    }).eq("id", rows[0]["id"]).execute()
    return {"message": "กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน"}


class SetupPasswordRequest(BaseModel):
    email: str
    new_password: str


@api_router.post("/auth/setup-password")
async def setup_password(body: SetupPasswordRequest):
    """
    First-time password setup for WordPress-migrated accounts.
    Works ONLY when the account has no password (password_hash IS NULL).
    The user just needs to know their email to set a new password.
    """
    email = body.email.lower().strip()
    res = await supabase.table("users").select("*").eq("email", email).limit(1).execute()
    rows = res.data if res and res.data else []
    if not rows:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชีที่ใช้อีเมลนี้")

    user = rows[0]
    # Only allow if no password is set yet
    if user.get("password_hash"):
        raise HTTPException(status_code=400, detail="บัญชีนี้มีรหัสผ่านแล้ว กรุณาใช้หน้าลืมรหัสผ่าน")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")

    new_hash = _hash_password(body.new_password)
    await supabase.table("users").update({
        "password_hash": new_hash,
        "must_reset_password": False,
    }).eq("id", user["id"]).execute()

    updated = await supabase.table("users").select("*").eq("id", user["id"]).limit(1).execute()
    return await _build_user_response(dict((updated.data or [{}])[0]))


@api_router.post("/users")
async def create_user(user: UserCreate):
    existing = await supabase.table("users").select("id").eq("email", user.email).maybe_single().execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User already exists")
    res = await supabase.table("users").insert({
        "username": user.username,
        "email": user.email,
        "certificates": [],
    }).execute()
    return await _build_user_response(res.data[0])


@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    res = await supabase.table("users").select("*").eq("id", user_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return await _build_user_response(res.data)


@api_router.get("/users")
async def list_users():
    res = await supabase.table("users").select("*").execute()
    return rows_with_id(res.data or [])


# ===== COURSES =====

@api_router.post("/courses")
async def create_course(course: CourseCreate):
    res = await supabase.table("courses").insert({
        "title": course.title,
        "description": course.description,
        "career_path": course.career_path,
        "thumbnail": course.thumbnail,
        "prerequisites": course.prerequisites,
        "total_lessons": 0,
        "is_published": False,
        "has_final_exam": True,
    }).execute()
    return with_id(res.data[0])


@api_router.get("/courses")
async def list_courses(career_path: Optional[str] = None, published_only: bool = False):
    query = supabase.table("courses").select("*")
    if career_path:
        query = query.eq("career_path", career_path)
    if published_only:
        query = query.eq("is_published", True)
    res = await query.execute()
    return rows_with_id(res.data or [])


@api_router.get("/courses/{course_id}")
async def get_course(course_id: str):
    res = await supabase.table("courses").select("*").eq("id", course_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    return with_id(res.data)


@api_router.put("/courses/{course_id}")
async def update_course(course_id: str, course: CourseUpdate):
    update_data = {k: v for k, v in course.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    res = await supabase.table("courses").update(update_data).eq("id", course_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    return with_id(res.data[0])


@api_router.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    # Modules + lessons cascade via FK; clean up quizzes & materials manually
    await supabase.table("quizzes").delete().eq("course_id", course_id).execute()
    await supabase.table("learning_materials").delete().eq("course_id", course_id).execute()
    res = await supabase.table("courses").delete().eq("id", course_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}


# ===== MODULES =====

@api_router.post("/modules")
async def create_module(module: ModuleCreate):
    res = await supabase.table("modules").insert({
        "course_id": module.course_id,
        "title": module.title,
        "description": module.description,
        "order_index": module.order,
        "unlock_after_days": module.unlock_after_days,
    }).execute()
    row = dict(res.data[0])
    row["order"] = row.get("order_index", module.order)
    row["lessons"] = []
    return with_id(row)


@api_router.get("/modules/course/{course_id}")
async def list_modules_by_course(course_id: str):
    res = await supabase.table("modules").select("*").eq("course_id", course_id).order("order_index").execute()
    rows = res.data or []
    for r in rows:
        r["order"] = r.get("order_index", 0)
        r["lessons"] = []
    return rows_with_id(rows)


@api_router.get("/modules/{module_id}")
async def get_module(module_id: str):
    res = await supabase.table("modules").select("*").eq("id", module_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Module not found")
    row = dict(res.data)
    row["order"] = row.get("order_index", 0)
    row["lessons"] = []
    return with_id(row)


# ===== LESSONS =====

@api_router.post("/lessons")
async def create_lesson(lesson: LessonCreate):
    res = await supabase.table("lessons").insert({
        "module_id": lesson.module_id,
        "title": lesson.title,
        "description": lesson.description,
        "order_index": lesson.order,
        "content_type": lesson.content_type,
        "video_url": lesson.video_url,
        "video_id": lesson.video_id,
        "article_content": lesson.article_content,
        "duration_minutes": lesson.duration_minutes,
        "has_quiz": True,
        "audio_generated": False,
    }).execute()
    row = dict(res.data[0])
    row["order"] = row.get("order_index", lesson.order)

    # Increment course total_lessons
    mod_res = await supabase.table("modules").select("course_id").eq("id", lesson.module_id).maybe_single().execute()
    if mod_res.data:
        cid = mod_res.data["course_id"]
        course_res = await supabase.table("courses").select("total_lessons").eq("id", cid).maybe_single().execute()
        if course_res.data:
            new_total = (course_res.data.get("total_lessons") or 0) + 1
            await supabase.table("courses").update({"total_lessons": new_total}).eq("id", cid).execute()

    return with_id(row)


@api_router.get("/lessons/module/{module_id}")
async def list_lessons_by_module(module_id: str):
    res = await supabase.table("lessons").select("*").eq("module_id", module_id).order("order_index").execute()
    rows = res.data or []
    for r in rows:
        r["order"] = r.get("order_index", 0)
    return rows_with_id(rows)


@api_router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str):
    res = await supabase.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    row = dict(res.data)
    row["order"] = row.get("order_index", 0)
    return with_id(row)


# ===== LEARNING MATERIALS =====

@api_router.post("/materials")
async def create_material(material: MaterialCreate):
    res = await supabase.table("learning_materials").insert({
        "course_id": material.course_id,
        "lesson_id": material.lesson_id,
        "title": material.title,
        "content": material.content,
        "file_type": material.file_type,
    }).execute()
    return with_id(res.data[0])


@api_router.get("/materials/course/{course_id}")
async def list_materials_by_course(course_id: str):
    res = await supabase.table("learning_materials").select("*").eq("course_id", course_id).execute()
    return rows_with_id(res.data or [])


@api_router.get("/materials/lesson/{lesson_id}")
async def list_materials_by_lesson(lesson_id: str):
    res = await supabase.table("learning_materials").select("*").eq("lesson_id", lesson_id).execute()
    return rows_with_id(res.data or [])


# ===== QUIZZES =====

@api_router.post("/quizzes")
async def create_quiz(quiz: QuizCreate):
    res = await supabase.table("quizzes").insert({
        "lesson_id": quiz.lesson_id,
        "course_id": quiz.course_id,
        "quiz_type": quiz.quiz_type,
        "title": quiz.title,
        "questions": [],
        "passing_score": 70,
        "time_limit_minutes": quiz.time_limit_minutes,
    }).execute()
    return with_id(res.data[0])


@api_router.get("/quizzes/lesson/{lesson_id}")
async def get_lesson_quiz(lesson_id: str):
    res = await supabase.table("quizzes").select("*").eq("lesson_id", lesson_id).maybe_single().execute()
    return with_id(res.data) if res.data else None


@api_router.get("/quizzes/course/{course_id}/final")
async def get_final_exam(course_id: str):
    res = await supabase.table("quizzes").select("*") \
        .eq("course_id", course_id).eq("quiz_type", "final_exam").maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Final exam not found")
    return with_id(res.data)


@api_router.put("/quizzes/{quiz_id}/questions")
async def update_quiz_questions(quiz_id: str, questions: List[QuizQuestion]):
    questions_data = [q.dict() for q in questions]
    res = await supabase.table("quizzes").update({"questions": questions_data}).eq("id", quiz_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return with_id(res.data[0])


@api_router.post("/quizzes/generate")
async def generate_quiz_from_material(material_id: str, num_questions: int = 10):
    mat_res = await supabase.table("learning_materials").select("*").eq("id", material_id).maybe_single().execute()
    if not mat_res.data:
        raise HTTPException(status_code=404, detail="Material not found")
    material = mat_res.data

    settings_res = await supabase.table("admin_settings").select("*").eq("id", 1).maybe_single().execute()
    if not settings_res.data:
        return {"message": "Please configure AI provider in admin settings", "questions": []}
    settings = settings_res.data

    ai_provider = settings.get("ai_provider", "openai")
    content = material.get("content", "")
    course_id = material.get("course_id")
    lesson_id = material.get("lesson_id")

    career_path = ""
    if course_id:
        c_res = await supabase.table("courses").select("career_path").eq("id", course_id).maybe_single().execute()
        if c_res.data:
            career_path = c_res.data.get("career_path", "")

    try:
        questions = await generate_quiz_with_ai(content, num_questions, ai_provider, settings, career_path)
        ins = await supabase.table("quizzes").insert({
            "lesson_id": lesson_id,
            "course_id": course_id,
            "quiz_type": "lesson_quiz" if lesson_id else "final_exam",
            "title": f"แบบทดสอบ - {material.get('title', 'Quiz')}",
            "questions": questions,
            "passing_score": 70,
        }).execute()
        new_id = ins.data[0]["id"]
        return {
            "success": True,
            "message": f"สร้างแบบทดสอบสำเร็จ! ({num_questions} ข้อ)",
            "quiz_id": new_id,
            "questions_count": len(questions),
        }
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {e}", "questions": []}


async def generate_quiz_with_ai(content: str, num_questions: int, ai_provider: str, settings: dict, career_path: str):
    prompt = f"""คุณเป็นผู้เชี่ยวชาญด้าน {career_path}

จากเนื้อหาด้านล่าง สร้างแบบทดสอบ {num_questions} ข้อ ในรูปแบบ Multiple Choice (4 ตัวเลือก)

เนื้อหา:
{content[:4000]}

กรุณาสร้างคำถามที่ครอบคลุมเนื้อหาสำคัญ ระดับความยากปานกลาง ตัวเลือกผิดต้องสมเหตุสมผล

ตอบกลับในรูปแบบ JSON array เท่านั้น:
[
  {{
    "question": "คำถาม",
    "question_type": "multiple_choice",
    "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
    "correct_answer": "ตัวเลือกที่ถูก",
    "explanation": "คำอธิบาย"
  }}
]"""

    try:
        if ai_provider == "openai" and settings.get("openai_key"):
            from openai import OpenAI
            client = OpenAI(api_key=settings["openai_key"])
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a Thai educational content expert. Always respond in valid JSON format."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            questions = result.get("questions", result) if isinstance(result, dict) else result

        elif ai_provider == "gemini" and settings.get("gemini_key"):
            import google.generativeai as genai
            genai.configure(api_key=settings["gemini_key"])
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
            result = json.loads(text)
            questions = result.get("questions", result) if isinstance(result, dict) else result

        elif ai_provider == "claude" and settings.get("claude_key"):
            from anthropic import Anthropic
            client = Anthropic(api_key=settings["claude_key"])
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip().removeprefix("```json").removesuffix("```").strip()
            result = json.loads(text)
            questions = result.get("questions", result) if isinstance(result, dict) else result

        else:
            raise Exception("No valid AI API key configured")

        return [
            {
                "question": q.get("question", ""),
                "question_type": "multiple_choice",
                "options": q.get("options", []),
                "correct_answer": q.get("correct_answer", ""),
                "explanation": q.get("explanation", ""),
                "media_url": None,
            }
            for q in questions[:num_questions]
        ]

    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise Exception(f"ไม่สามารถสร้างแบบทดสอบได้: {e}")


# ===== QUIZ SUBMISSIONS =====

@api_router.post("/quizzes/submit")
async def submit_quiz(submission: QuizSubmission):
    quiz_res = await supabase.table("quizzes").select("*").eq("id", submission.quiz_id).maybe_single().execute()
    if not quiz_res.data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz = quiz_res.data

    questions = quiz.get("questions") or []
    correct_count = sum(
        1 for idx, q in enumerate(questions)
        if submission.answers.get(str(idx), "").strip().lower()
           == str(q.get("correct_answer", "")).strip().lower()
    )
    total_questions = len(questions)
    score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    passed = score >= quiz.get("passing_score", 70)

    await supabase.table("quiz_submissions").insert({
        "quiz_id": submission.quiz_id,
        "user_id": submission.user_id,
        "answers": submission.answers,
        "score": score,
        "passed": passed,
    }).execute()

    # Award certificate on passed final exam
    if passed and quiz.get("quiz_type") == "final_exam":
        user_res = await supabase.table("users").select("certificates").eq("id", submission.user_id).maybe_single().execute()
        if user_res.data:
            certs: List[str] = list(user_res.data.get("certificates") or [])
            cid = str(quiz.get("course_id", ""))
            if cid and cid not in certs:
                certs.append(cid)
                await supabase.table("users").update({"certificates": certs}).eq("id", submission.user_id).execute()

    return {
        "score": score,
        "passed": passed,
        "correct_answers": correct_count,
        "total_questions": total_questions,
    }


# ===== USER PROGRESS =====

@api_router.post("/progress/lesson-complete")
async def mark_lesson_complete(user_id: str, lesson_id: str, course_id: str):
    prog_res = await supabase.table("user_progress").select("*") \
        .eq("user_id", user_id).eq("course_id", course_id).maybe_single().execute()

    if prog_res.data:
        completed: List[str] = list(prog_res.data.get("completed_lessons") or [])
        if lesson_id not in completed:
            completed.append(lesson_id)
            await supabase.table("user_progress") \
                .update({"completed_lessons": completed}) \
                .eq("user_id", user_id).eq("course_id", course_id).execute()
    else:
        await supabase.table("user_progress").insert({
            "user_id": user_id,
            "course_id": course_id,
            "completed_lessons": [lesson_id],
            "quiz_scores": {},
        }).execute()

    return {"message": "Lesson marked as complete"}


@api_router.get("/progress/{user_id}/course/{course_id}")
async def get_user_progress(user_id: str, course_id: str):
    user_res = await supabase.table("users").select("id").eq("id", user_id).maybe_single().execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")

    prog_res = await supabase.table("user_progress").select("*") \
        .eq("user_id", user_id).eq("course_id", course_id).maybe_single().execute()
    progress = prog_res.data or {}

    course_res = await supabase.table("courses").select("total_lessons").eq("id", course_id).maybe_single().execute()
    total_lessons = (course_res.data or {}).get("total_lessons", 0)

    completed_count = len(progress.get("completed_lessons") or [])
    completion_pct = int((completed_count / total_lessons) * 100) if total_lessons > 0 else 0

    return {
        "completed_lessons": progress.get("completed_lessons") or [],
        "total_lessons": total_lessons,
        "completion_percentage": completion_pct,
        "quiz_scores": progress.get("quiz_scores") or {},
    }


# ===== AUDIO GENERATION =====

@api_router.post("/audio/generate/{lesson_id}")
async def generate_lesson_audio(lesson_id: str):
    lesson_res = await supabase.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    if not lesson_res.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson = lesson_res.data

    if lesson["content_type"] != "article":
        raise HTTPException(status_code=400, detail="Only articles can be converted to audio")
    if not lesson.get("article_content"):
        raise HTTPException(status_code=400, detail="No article content found")

    settings_res = await supabase.table("admin_settings").select("*").eq("id", 1).maybe_single().execute()
    settings = settings_res.data or {}
    if not settings.get("elevenlabs_key"):
        return {"success": False, "message": "Please configure ElevenLabs API key in admin settings"}

    try:
        from elevenlabs import ElevenLabs, VoiceSettings
        import re, base64
        client = ElevenLabs(api_key=settings["elevenlabs_key"])
        text = re.sub('<[^<]+?>', '', lesson.get("article_content", ""))[:5000]
        audio = client.generate(
            text=text,
            voice="Rachel",
            model="eleven_multilingual_v2",
            voice_settings=VoiceSettings(stability=0.5, similarity_boost=0.75, style=0.0, use_speaker_boost=True),
        )
        audio_bytes = b''.join(audio)
        audio_b64 = f"data:audio/mp3;base64,{base64.b64encode(audio_bytes).decode()}"
        await supabase.table("lessons").update({"audio_url": audio_b64, "audio_generated": True}).eq("id", lesson_id).execute()
        return {"success": True, "message": "สร้าง Audio สำเร็จ!", "audio_url": audio_b64}
    except Exception as e:
        logger.error(f"ElevenLabs error: {e}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {e}"}


# ==================== GAMIFICATION ====================

from services.gamification import (
    get_user_dashboard,
    add_xp,
    get_or_create_user_stats,
    BADGES,
    XP_PER_LESSON,
    XP_PER_QUIZ_CORRECT,
    XP_PER_COURSE_COMPLETE,
    XP_PER_PERFECT_QUIZ,
)


@api_router.get("/gamification/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    return await get_user_dashboard(supabase, user_id)


@api_router.post("/gamification/add-xp")
async def add_user_xp(user_id: str, xp_amount: int, reason: str = "lesson"):
    return await add_xp(supabase, user_id, xp_amount, reason)


@api_router.post("/gamification/complete-lesson")
async def complete_lesson_gamification(user_id: str, lesson_id: str, quiz_score: int = 0):
    xp = XP_PER_LESSON
    if quiz_score > 0:
        xp += int(quiz_score / 20) * XP_PER_QUIZ_CORRECT
        if quiz_score == 100:
            xp += XP_PER_PERFECT_QUIZ
    return await add_xp(supabase, user_id, xp, "lesson")


@api_router.post("/gamification/complete-course")
async def complete_course_gamification(user_id: str, course_id: str):
    return await add_xp(supabase, user_id, XP_PER_COURSE_COMPLETE, "course")


@api_router.get("/gamification/badges")
async def get_all_badges():
    return list(BADGES.values())


@api_router.put("/gamification/daily-goal/{user_id}")
async def set_daily_goal(user_id: str, goal: int):
    existing = await supabase.table("user_stats").select("id").eq("user_id", user_id).maybe_single().execute()
    if existing.data:
        await supabase.table("user_stats").update({"daily_goal": goal}).eq("user_id", user_id).execute()
    else:
        await supabase.table("user_stats").insert({"user_id": user_id, "daily_goal": goal}).execute()
    return {"success": True, "daily_goal": goal}


# ==================== AI QUIZ ENDPOINTS ====================

from services.ai_service import generate_quiz_questions, generate_lesson_summary


# ==================== LEARNING SESSION ENDPOINTS ====================

from services.learning_session_service import (
    start_learning_session,
    submit_learning_session,
    check_lesson_unlock,
    get_course_progress,
)


class LearningSessionAnswer(BaseModel):
    question_index: int
    answer: Any


class SubmitSessionRequest(BaseModel):
    session_id: str
    answers: List[LearningSessionAnswer]


@api_router.post("/learning/session/start/{lesson_id}")
async def start_session(lesson_id: str, user_id: str = "demo_user"):
    return await start_learning_session(supabase, user_id, lesson_id)


@api_router.post("/learning/session/submit")
async def submit_session(request: SubmitSessionRequest, user_id: str = "demo_user"):
    answers = [{"question_index": a.question_index, "answer": a.answer} for a in request.answers]
    return await submit_learning_session(supabase, user_id, request.session_id, answers)


@api_router.get("/learning/unlock/{lesson_id}")
async def check_unlock(lesson_id: str, user_id: str = "demo_user"):
    return await check_lesson_unlock(supabase, user_id, lesson_id)


@api_router.get("/learning/progress/{course_id}")
async def get_progress(course_id: str, user_id: str = "demo_user"):
    return await get_course_progress(supabase, user_id, course_id)


@api_router.post("/ai/generate-quiz/{lesson_id}")
async def generate_quiz_for_lesson(lesson_id: str, num_questions: int = 5, difficulty: str = "medium"):
    lesson_res = await supabase.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    if not lesson_res.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson = lesson_res.data
    content = lesson.get("article_content") or lesson.get("description", "")
    if not content:
        raise HTTPException(status_code=400, detail="Lesson has no content to generate quiz from")

    questions = await generate_quiz_questions(
        content=content,
        lesson_title=lesson.get("title", ""),
        num_questions=num_questions,
        difficulty=difficulty,
    )
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate quiz questions")

    quiz_doc = {
        "lesson_id": lesson_id,
        "title": f"แบบทดสอบ: {lesson.get('title', '')}",
        "questions": questions,
        "difficulty": difficulty,
        "is_ai_generated": True,
    }
    await supabase.table("generated_quizzes").upsert(quiz_doc, on_conflict="lesson_id").execute()
    return quiz_doc


@api_router.get("/ai/quiz/{lesson_id}")
async def get_ai_quiz(lesson_id: str):
    res = await supabase.table("generated_quizzes").select("*").eq("lesson_id", lesson_id).maybe_single().execute()
    return with_id(res.data) if res.data else None


@api_router.post("/ai/summarize-lesson/{lesson_id}")
async def summarize_lesson(lesson_id: str):
    lesson_res = await supabase.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    if not lesson_res.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    content = lesson_res.data.get("article_content") or lesson_res.data.get("description", "")
    summary = await generate_lesson_summary(content)
    return {"summary": summary}


# ── Register router & middleware ──────────────────────────────
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

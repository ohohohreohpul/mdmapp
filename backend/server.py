from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
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
import io
import re
import asyncio
import uuid as uuid_lib

try:
    import pdfplumber as _pdfplumber
    _PDFPLUMBER_AVAILABLE = True
except ImportError:
    _PDFPLUMBER_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, KeepTogether
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
    _REPORTLAB_AVAILABLE = True
except ImportError:
    _REPORTLAB_AVAILABLE = False

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
def _decode_html(val: str) -> str:
    import html
    return html.unescape(val) if isinstance(val, str) else val


def with_id(row: Optional[dict]) -> Optional[dict]:
    """Copy UUID 'id' to '_id' and decode HTML entities in text fields."""
    if row:
        row["_id"] = row.get("id", "")
        for field in ("title", "description", "name", "content", "article_content", "excerpt"):
            if field in row:
                row[field] = _decode_html(row[field])
    return row


def rows_with_id(rows: List[dict]) -> List[dict]:
    return [with_id(r) for r in rows]


def _one(res) -> Optional[dict]:
    """Safely extract the first row from a Supabase .limit(1).execute() result.

    Replaces the unsafe .maybe_single().execute() pattern which returns None
    (not an object with .data) when no row exists, causing AttributeError.
    """
    if res and res.data and len(res.data) > 0:
        return res.data[0]
    return None


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
    res = await supabase.table("admin_settings").select("*").eq("id", 1).limit(1).execute()
    data = _one(res)
    if not data:
        ins = await supabase.table("admin_settings").insert({"id": 1, "ai_provider": "openai"}).execute()
        return ins.data[0] if ins.data else AdminSettings().dict()
    row = dict(data)
    row.pop("id", None)
    return row


@api_router.put("/admin/settings")
async def update_admin_settings(settings: AdminSettingsUpdate):
    update_data = {k: v for k, v in settings.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    await supabase.table("admin_settings").update(update_data).eq("id", 1).execute()
    res = await supabase.table("admin_settings").select("*").eq("id", 1).limit(1).execute()
    data = _one(res)
    row = dict(data or {})
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
    existing_hash = user.get("password_hash") or ""
    # Block only if a real (non-WordPress-migrated) password has been set.
    # WP-migrated hashes start with "$wp$" — those users haven't chosen their own
    # password yet, so we allow them to use the first-login flow.
    if existing_hash and not existing_hash.startswith("$wp$"):
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
    existing = await supabase.table("users").select("id").eq("email", user.email).limit(1).execute()
    existing_data = _one(existing)
    if existing_data:
        raise HTTPException(status_code=400, detail="User already exists")
    res = await supabase.table("users").insert({
        "username": user.username,
        "email": user.email,
        "certificates": [],
    }).execute()
    return await _build_user_response(res.data[0])


@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    res = await supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return await _build_user_response(data)


@api_router.patch("/users/{user_id}")
async def update_user_profile(user_id: str, body: dict):
    allowed = {k: v for k, v in body.items() if k in ("username", "display_name", "has_resume_setup")}
    if not allowed:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    await supabase.table("users").update(allowed).eq("id", user_id).execute()
    res = await supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return await _build_user_response(data)


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
    res = await supabase.table("courses").select("*").eq("id", course_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Course not found")
    return with_id(data)


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
    res = await supabase.table("modules").select("*").eq("id", module_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Module not found")
    row = dict(data)
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
    mod_res = await supabase.table("modules").select("course_id").eq("id", lesson.module_id).limit(1).execute()
    mod_data = _one(mod_res)
    if mod_data:
        cid = mod_data["course_id"]
        course_res = await supabase.table("courses").select("total_lessons").eq("id", cid).limit(1).execute()
        course_data = _one(course_res)
        if course_data:
            new_total = (course_data.get("total_lessons") or 0) + 1
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
    res = await supabase.table("lessons").select("*").eq("id", lesson_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    row = dict(data)
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
    res = await supabase.table("quizzes").select("*").eq("lesson_id", lesson_id).limit(1).execute()
    data = _one(res)
    return with_id(data) if data else None


@api_router.get("/quizzes/course/{course_id}/final")
async def get_final_exam(course_id: str):
    res = await supabase.table("quizzes").select("*") \
        .eq("course_id", course_id).eq("quiz_type", "final_exam").limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Final exam not found")
    return with_id(data)


@api_router.put("/quizzes/{quiz_id}/questions")
async def update_quiz_questions(quiz_id: str, questions: List[QuizQuestion]):
    questions_data = [q.dict() for q in questions]
    res = await supabase.table("quizzes").update({"questions": questions_data}).eq("id", quiz_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return with_id(res.data[0])


@api_router.post("/quizzes/generate")
async def generate_quiz_from_material(material_id: str, num_questions: int = 10):
    mat_res = await supabase.table("learning_materials").select("*").eq("id", material_id).limit(1).execute()
    mat_data = _one(mat_res)
    if not mat_data:
        raise HTTPException(status_code=404, detail="Material not found")
    material = mat_data

    settings_res = await supabase.table("admin_settings").select("*").eq("id", 1).limit(1).execute()
    settings_data = _one(settings_res)
    if not settings_data:
        return {"message": "Please configure AI provider in admin settings", "questions": []}
    settings = settings_data

    ai_provider = settings.get("ai_provider", "openai")
    content = material.get("content", "")
    course_id = material.get("course_id")
    lesson_id = material.get("lesson_id")

    career_path = ""
    if course_id:
        c_res = await supabase.table("courses").select("career_path").eq("id", course_id).limit(1).execute()
        c_data = _one(c_res)
        if c_data:
            career_path = c_data.get("career_path", "")

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
    quiz_res = await supabase.table("quizzes").select("*").eq("id", submission.quiz_id).limit(1).execute()
    quiz = _one(quiz_res)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

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
        user_res = await supabase.table("users").select("certificates,display_name,username").eq("id", submission.user_id).limit(1).execute()
        user_data = _one(user_res)
        if user_data:
            certs: List[str] = list(user_data.get("certificates") or [])
            cid = str(quiz.get("course_id", ""))
            if cid and cid not in certs:
                certs.append(cid)
                await supabase.table("users").update({"certificates": certs}).eq("id", submission.user_id).execute()
            # Issue proper certificate record (idempotent)
            if cid:
                try:
                    existing_cert = await supabase.table("certificates") \
                        .select("id") \
                        .eq("user_id", submission.user_id) \
                        .eq("course_id", cid) \
                        .limit(1).execute()
                    if not _one(existing_cert):
                        course_res = await supabase.table("courses") \
                            .select("title,career_path") \
                            .eq("id", cid) \
                            .limit(1).execute()
                        course_data = _one(course_res)
                        if course_data:
                            now = datetime.utcnow()
                            display_name = (
                                user_data.get("display_name")
                                or user_data.get("username")
                                or "ผู้เรียน"
                            )
                            await supabase.table("certificates").insert({
                                "user_id": submission.user_id,
                                "cert_type": "course",
                                "course_id": cid,
                                "career_path": course_data.get("career_path"),
                                "course_title": course_data.get("title"),
                                "user_display_name": display_name,
                                "issue_month": now.month,
                                "issue_year": now.year,
                                "verification_code": _gen_cert_code("MDY"),
                            }).execute()
                except Exception as e:
                    logger.warning(f"Could not auto-issue certificate: {e}")

    # Award XP for the quiz attempt
    if submission.user_id and submission.user_id != "demo_user":
        try:
            xp_amount = correct_count * XP_PER_QUIZ_CORRECT
            if score == 100:
                xp_amount += XP_PER_PERFECT_QUIZ
            xp_reason = "course" if quiz.get("quiz_type") == "final_exam" and passed else "quiz"
            await add_xp(supabase, submission.user_id, xp_amount, xp_reason)
        except Exception as e:
            logger.warning(f"Could not award quiz XP: {e}")

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
        .eq("user_id", user_id).eq("course_id", course_id).limit(1).execute()
    prog_data = _one(prog_res)

    xp_result = None
    if prog_data:
        completed: List[str] = list(prog_data.get("completed_lessons") or [])
        if lesson_id not in completed:
            completed.append(lesson_id)
            await supabase.table("user_progress") \
                .update({"completed_lessons": completed}) \
                .eq("user_id", user_id).eq("course_id", course_id).execute()
            # Award XP for a newly completed lesson
            xp_result = await add_xp(supabase, user_id, XP_PER_LESSON, "lesson")
    else:
        await supabase.table("user_progress").insert({
            "user_id": user_id,
            "course_id": course_id,
            "completed_lessons": [lesson_id],
            "quiz_scores": {},
        }).execute()
        # Award XP for a newly completed lesson
        xp_result = await add_xp(supabase, user_id, XP_PER_LESSON, "lesson")

    return {"message": "Lesson marked as complete", "xp": xp_result}


@api_router.get("/progress/{user_id}/course/{course_id}")
async def get_user_progress(user_id: str, course_id: str):
    user_res = await supabase.table("users").select("id").eq("id", user_id).limit(1).execute()
    user_data = _one(user_res)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    prog_res = await supabase.table("user_progress").select("*") \
        .eq("user_id", user_id).eq("course_id", course_id).limit(1).execute()
    progress = _one(prog_res) or {}

    course_res = await supabase.table("courses").select("total_lessons").eq("id", course_id).limit(1).execute()
    course_data = _one(course_res)
    total_lessons = (course_data or {}).get("total_lessons", 0)

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
    lesson_res = await supabase.table("lessons").select("*").eq("id", lesson_id).limit(1).execute()
    lesson = _one(lesson_res)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if lesson["content_type"] != "article":
        raise HTTPException(status_code=400, detail="Only articles can be converted to audio")
    if not lesson.get("article_content"):
        raise HTTPException(status_code=400, detail="No article content found")

    settings_res = await supabase.table("admin_settings").select("*").eq("id", 1).limit(1).execute()
    settings = _one(settings_res) or {}
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
    existing = await supabase.table("user_stats").select("id").eq("user_id", user_id).limit(1).execute()
    existing_data = _one(existing)
    if existing_data:
        await supabase.table("user_stats").update({"daily_goal": goal}).eq("user_id", user_id).execute()
    else:
        await supabase.table("user_stats").insert({"user_id": user_id, "daily_goal": goal}).execute()
    return {"success": True, "daily_goal": goal}


@api_router.post("/gamification/daily-checkin")
async def daily_checkin(body: dict):
    user_id = body.get("user_id")
    if not user_id or user_id == "demo_user":
        raise HTTPException(status_code=400, detail="Invalid user")

    stats = await get_or_create_user_stats(supabase, user_id)
    today = datetime.utcnow().strftime("%Y-%m-%d")

    last = stats.get("last_activity_date")
    # Normalise — Supabase may return a date object or a string
    if last and not isinstance(last, str):
        last = str(last)[:10]

    if last == today:
        return {
            "already_checked_in": True,
            "xp_awarded": 0,
            "streak": stats.get("current_streak", 0),
        }

    result = await add_xp(supabase, user_id, 20, "daily_checkin")
    return {
        "already_checked_in": False,
        "xp_awarded": 20,
        "streak": result["streak"],
        "new_badges": result.get("new_badges", []),
    }


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


# ==================== PRACTICE CONTENT (DUOLINGO) ENDPOINTS ====================

class PracticeProgressRequest(BaseModel):
    module_id: str
    score: int           # percentage 0-100
    correct: int
    total: int
    user_id: str = "demo_user"


@api_router.get("/practice/course/{course_id}")
async def get_practice_modules(course_id: str, user_id: str = "demo_user"):
    """All practice modules for a course, with the user's progress on each."""
    mods_res = await supabase.table("practice_modules") \
        .select("id,module_key,module_order,title,question_count,mastery_threshold") \
        .eq("course_id", course_id) \
        .order("module_order") \
        .execute()
    modules = mods_res.data or []

    # Fetch user progress for all modules in one query
    if modules and user_id:
        mod_ids = [m["id"] for m in modules]
        prog_res = await supabase.table("practice_progress") \
            .select("module_id,completed,best_score,attempts") \
            .eq("user_id", user_id) \
            .in_("module_id", mod_ids) \
            .execute()
        prog_map = {p["module_id"]: p for p in (prog_res.data or [])}
        for m in modules:
            p = prog_map.get(m["id"], {})
            m["user_completed"] = p.get("completed", False)
            m["user_best_score"] = p.get("best_score", 0)
            m["user_attempts"]   = p.get("attempts", 0)

    return modules


@api_router.get("/practice/module/{module_id}")
async def get_practice_module(module_id: str):
    """Single module with full questions array."""
    res = await supabase.table("practice_modules") \
        .select("*") \
        .eq("id", module_id) \
        .limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Practice module not found")
    return data


@api_router.post("/practice/progress")
async def save_practice_progress(body: PracticeProgressRequest):
    """Upsert user progress for a module; award XP if newly completed."""
    threshold = 70
    # Get current best
    existing = await supabase.table("practice_progress") \
        .select("id,best_score,attempts,completed") \
        .eq("user_id", body.user_id) \
        .eq("module_id", body.module_id) \
        .limit(1).execute()
    existing_data = _one(existing)

    passed = body.score >= threshold
    new_best = max(body.score, existing_data.get("best_score", 0) if existing_data else 0)
    was_completed = existing_data.get("completed", False) if existing_data else False
    newly_completed = passed and not was_completed

    row = {
        "user_id": body.user_id,
        "module_id": body.module_id,
        "completed": was_completed or passed,
        "best_score": new_best,
        "attempts": (existing_data.get("attempts", 0) if existing_data else 0) + 1,
        "last_attempt_at": "now()",
    }
    await supabase.table("practice_progress") \
        .upsert(row, on_conflict="user_id,module_id") \
        .execute()

    # Award XP if module newly completed
    xp_awarded = 0
    if newly_completed and body.user_id != "demo_user":
        xp_awarded = 50  # flat 50 XP per completed module
        try:
            await add_xp(supabase, body.user_id, xp_awarded, f"practice_module_{body.module_id}")
        except Exception:
            pass

    return {"passed": passed, "best_score": new_best, "newly_completed": newly_completed, "xp_awarded": xp_awarded}


# ==================== CERTIFICATES ====================

import secrets
import string


def _gen_cert_code(prefix: str = "MDY") -> str:
    """Generate a human-readable verification code like MDY-202603-AB1C2D"""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(chars) for _ in range(6))
    year = datetime.utcnow().year
    month = datetime.utcnow().month
    return f"{prefix}-{year}{month:02d}-{suffix}"


class CertificateIssueRequest(BaseModel):
    user_id: str
    cert_type: str          # 'course' or 'career'
    course_id: Optional[str] = None
    career_path: Optional[str] = None


@api_router.get("/certificates/user/{user_id}")
async def get_user_certificates(user_id: str):
    """Return all certificates for a user, newest first."""
    res = await supabase.table("certificates") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("issued_at", desc=True) \
        .execute()
    return res.data or []


@api_router.get("/certificates/verify/{code}")
async def verify_certificate(code: str):
    """Public endpoint — verify a certificate by its verification code."""
    res = await supabase.table("certificates") \
        .select("id,cert_type,course_title,career_path,career_courses,user_display_name,issued_at,issue_year,issue_month,verification_code") \
        .eq("verification_code", code) \
        .limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="ไม่พบใบประกาศนียบัตร")
    return data


@api_router.post("/certificates/issue")
async def issue_certificate(body: CertificateIssueRequest):
    """Issue a certificate for a course or career path completion."""
    # Validate cert_type
    if body.cert_type not in ("course", "career"):
        raise HTTPException(status_code=400, detail="cert_type must be 'course' or 'career'")

    # Get user display name
    user_res = await supabase.table("users") \
        .select("display_name,username") \
        .eq("id", body.user_id) \
        .limit(1).execute()
    user_data = _one(user_res)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    display_name = (
        user_data.get("display_name")
        or user_data.get("username")
        or "ผู้เรียน"
    )

    now = datetime.utcnow()

    # ── Course certificate ──────────────────────────────────
    if body.cert_type == "course":
        if not body.course_id:
            raise HTTPException(status_code=400, detail="course_id required for course cert")

        course_res = await supabase.table("courses") \
            .select("title,career_path") \
            .eq("id", body.course_id) \
            .limit(1).execute()
        course_data = _one(course_res)
        if not course_data:
            raise HTTPException(status_code=404, detail="Course not found")

        # Idempotent — return existing cert if already issued
        existing = await supabase.table("certificates") \
            .select("id,verification_code,issued_at,user_display_name,cert_type,course_title,career_path,issue_year,issue_month,career_courses") \
            .eq("user_id", body.user_id) \
            .eq("course_id", body.course_id) \
            .limit(1).execute()
        existing_data = _one(existing)
        if existing_data:
            return existing_data

        code = _gen_cert_code("MDY")
        ins = await supabase.table("certificates").insert({
            "user_id": body.user_id,
            "cert_type": "course",
            "course_id": body.course_id,
            "career_path": course_data.get("career_path"),
            "course_title": course_data.get("title"),
            "user_display_name": display_name,
            "issue_month": now.month,
            "issue_year": now.year,
            "verification_code": code,
        }).execute()
        return ins.data[0] if ins.data else {}

    # ── Career certificate ──────────────────────────────────
    if not body.career_path:
        raise HTTPException(status_code=400, detail="career_path required for career cert")

    # Collect all published courses in this career path
    courses_res = await supabase.table("courses") \
        .select("id,title") \
        .eq("career_path", body.career_path) \
        .eq("is_published", True) \
        .execute()
    career_courses = [c["title"] for c in (courses_res.data or [])]

    # Idempotent
    existing = await supabase.table("certificates") \
        .select("id,verification_code,issued_at,user_display_name,cert_type,course_title,career_path,issue_year,issue_month,career_courses") \
        .eq("user_id", body.user_id) \
        .eq("career_path", body.career_path) \
        .eq("cert_type", "career") \
        .limit(1).execute()
    existing_data = _one(existing)
    if existing_data:
        return existing_data

    code = _gen_cert_code("MDY")
    ins = await supabase.table("certificates").insert({
        "user_id": body.user_id,
        "cert_type": "career",
        "career_path": body.career_path,
        "career_courses": career_courses,
        "course_title": body.career_path,
        "user_display_name": display_name,
        "issue_month": now.month,
        "issue_year": now.year,
        "verification_code": code,
    }).execute()
    return ins.data[0] if ins.data else {}


# ==================== RESUME & COVER LETTER ====================

# ── Pydantic models ────────────────────────────────────────────

class WorkExperienceEntry(BaseModel):
    company: str
    role: str
    start_date: str
    end_date: str
    bullets: List[str] = []

class EducationEntry(BaseModel):
    institution: str
    degree: str
    field: str
    graduation_year: str

class LanguageEntry(BaseModel):
    language: str
    level: str          # e.g. "Native", "Fluent", "TOEIC 850"
    score: Optional[str] = None

class CertificationEntry(BaseModel):
    name: str
    issuer: str
    year: Optional[str] = None
    url: Optional[str] = None
    is_mydemy: bool = False

class ResumeCreateBody(BaseModel):
    user_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    skills: List[str] = []
    work_experience: List[WorkExperienceEntry] = []
    education: List[EducationEntry] = []
    languages: List[LanguageEntry] = []
    certifications: List[CertificationEntry] = []

class CoverLetterCreate(BaseModel):
    user_id: str
    title: str
    company_name: Optional[str] = None
    position: Optional[str] = None
    content: str

class CoverLetterUpdate(BaseModel):
    title: Optional[str] = None
    company_name: Optional[str] = None
    position: Optional[str] = None
    content: Optional[str] = None

# ── PDF parsing helpers ────────────────────────────────────────

_SKILL_KEYWORDS = [
    "python","sql","excel","figma","sketch","react","javascript","html","css",
    "tableau","power bi","google analytics","node","agile","scrum","ux research",
    "data analysis","project management","digital marketing","seo",
    "content marketing","copywriting","leadership","presentation","photoshop",
    "illustrator","notion","jira","confluence","trello","canva",
]

_SECTION_HEADERS = [
    "experience","work experience","education","skills","summary","objective",
    "projects","certifications","languages","achievements","awards",
    "ประสบการณ์","การศึกษา","ทักษะ","สรุป","โครงการ","ภาษา","ใบประกาศ",
]

def _parse_pdf_sync(file_bytes: bytes):
    """Returns (parsed_text, skills, ats_score, parse_status) — runs sync."""
    if not _PDFPLUMBER_AVAILABLE:
        return ("", [], 0, "failed")
    try:
        with _pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = [p.extract_text() or "" for p in pdf.pages]
            page_count = len(pdf.pages)
        full_text = "\n".join(pages_text).strip()
    except Exception:
        return ("", [], 0, "failed")

    if not full_text or len(full_text) < 100:
        return (full_text, [], 5, "failed")

    text_lower = full_text.lower()
    found_skills = [kw for kw in _SKILL_KEYWORDS if kw in text_lower]

    score = 0
    char_count = len(full_text)
    if char_count >= 500:   score += 40
    elif char_count >= 200: score += 20
    elif char_count >= 100: score += 10
    headers_found = sum(1 for h in _SECTION_HEADERS if h in text_lower)
    score += min(headers_found * 5, 30)
    score += min(len(found_skills) * 3, 15)
    if re.search(r'[\w.+-]+@[\w-]+\.\w+', full_text): score += 5
    if re.search(r'[\d\s\-\+\(\)]{8,}', full_text):   score += 5
    if 1 <= page_count <= 3: score += 5
    return (full_text, found_skills, min(score, 100), "success")

async def _parse_pdf(file_bytes: bytes):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _parse_pdf_sync, file_bytes)

def _score_template_resume(data: ResumeCreateBody) -> tuple:
    """Returns (ats_score, skills_list)."""
    score = 40  # baseline — always machine-readable
    if data.email:  score += 5
    if data.phone:  score += 5
    if len(data.skills) >= 3: score += 15
    elif data.skills:         score += 7
    if len(data.work_experience) >= 2: score += 20
    elif data.work_experience:         score += 10
    if data.education: score += 10
    if data.linkedin:  score += 5
    if data.languages: score += 3
    if data.certifications: score += 5
    return (min(score, 100), data.skills)

async def _get_fresh_signed_url(file_path: str) -> str:
    """Generate a 1-hour signed URL from a Supabase Storage path."""
    try:
        result = await supabase.storage.from_("resumes").create_signed_url(file_path, 3600)
        # supabase-py 2.x returns a dict or object
        if isinstance(result, dict):
            return result.get("signedURL") or result.get("signed_url") or ""
        return getattr(result, "signed_url", "") or getattr(result, "signedURL", "") or ""
    except Exception:
        return ""

def _generate_resume_pdf(resume_data: dict) -> bytes:
    """Generate a PDF from resume template data using reportlab."""
    if not _REPORTLAB_AVAILABLE:
        raise HTTPException(500, "PDF generation not available")

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)

    story = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'],
        fontSize=20, textColor=colors.HexColor('#111827'),
        spaceAfter=6, alignment=TA_CENTER, fontName='Helvetica-Bold'
    )

    # Name
    name = resume_data.get('full_name', 'Resume')
    story.append(Paragraph(name, title_style))

    # Contact info
    contact_parts = []
    if resume_data.get('email'):
        contact_parts.append(resume_data['email'])
    if resume_data.get('phone'):
        contact_parts.append(resume_data['phone'])
    if resume_data.get('linkedin'):
        contact_parts.append(resume_data['linkedin'])

    if contact_parts:
        contact_text = ' • '.join(contact_parts)
        contact_style = ParagraphStyle('Contact', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER)
        story.append(Paragraph(contact_text, contact_style))

    story.append(Spacer(1, 0.2*inch))

    # Skills
    skills = resume_data.get('skills', [])
    if skills:
        heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=12, textColor=colors.HexColor('#374151'), spaceBefore=6, spaceAfter=6)
        story.append(Paragraph('SKILLS', heading_style))
        skills_text = ', '.join(skills)
        story.append(Paragraph(skills_text, styles['Normal']))
        story.append(Spacer(1, 0.15*inch))

    # Work Experience
    work_exp = resume_data.get('work_experience', [])
    if work_exp:
        story.append(Paragraph('WORK EXPERIENCE', heading_style))
        for job in work_exp:
            job_title = job.get('role', '')
            company = job.get('company', '')
            dates = ' – '.join(filter(None, [job.get('start_date'), job.get('end_date')]))

            job_text = f"<b>{job_title}</b> • {company}"
            if dates:
                job_text += f" ({dates})"
            story.append(Paragraph(job_text, styles['Normal']))

            bullets = job.get('bullets', [])
            if isinstance(bullets, list):
                for bullet in bullets:
                    story.append(Paragraph(f"• {bullet}", styles['Normal']))
            story.append(Spacer(1, 0.08*inch))

    # Education
    education = resume_data.get('education', [])
    if education:
        story.append(Paragraph('EDUCATION', heading_style))
        for edu in education:
            degree = edu.get('degree', '')
            field = edu.get('field', '')
            institution = edu.get('institution', '')
            year = edu.get('graduation_year', '')

            edu_text = f"<b>{degree}"
            if field:
                edu_text += f", {field}"
            edu_text += f"</b> • {institution}"
            if year:
                edu_text += f" ({year})"
            story.append(Paragraph(edu_text, styles['Normal']))
        story.append(Spacer(1, 0.08*inch))

    # Languages
    languages = resume_data.get('languages', [])
    if languages:
        story.append(Paragraph('LANGUAGES', heading_style))
        for lang in languages:
            lang_text = f"<b>{lang.get('language', '')}</b> – {lang.get('level', '')}"
            story.append(Paragraph(lang_text, styles['Normal']))
        story.append(Spacer(1, 0.08*inch))

    # Certifications
    certifications = resume_data.get('certifications', [])
    if certifications:
        story.append(Paragraph('CERTIFICATIONS', heading_style))
        for cert in certifications:
            cert_text = f"<b>{cert.get('name', '')}</b>"
            issuer = cert.get('issuer', '')
            year = cert.get('year', '')
            if issuer or year:
                cert_text += f" • {issuer}"
                if year:
                    cert_text += f" ({year})"
            story.append(Paragraph(cert_text, styles['Normal']))

    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()

# ── Resume endpoints ───────────────────────────────────────────

@api_router.post("/resume/upload")
async def upload_resume(
    user_id: str = Form(...),
    file: UploadFile = File(...),
):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(400, "ไฟล์ต้องเป็น PDF เท่านั้น")
    file_bytes = await file.read()
    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(400, "ไฟล์ต้องมีขนาดไม่เกิน 2MB")

    resume_id = str(uuid_lib.uuid4())
    storage_path = f"{user_id}/{resume_id}.pdf"

    # Upload to Supabase Storage
    try:
        await supabase.storage.from_("resumes").upload(storage_path, file_bytes, {"content-type": "application/pdf"})
    except Exception as e:
        raise HTTPException(500, f"อัปโหลดไม่สำเร็จ: {str(e)}")

    # Parse & score
    parsed_text, skills, ats_score, parse_status = await _parse_pdf(file_bytes)

    # Insert into DB
    now_iso = datetime.utcnow().isoformat()
    row = {
        "id": resume_id,
        "user_id": user_id,
        "resume_type": "uploaded",
        "file_path": storage_path,
        "file_name": file.filename or "resume.pdf",
        "file_size": len(file_bytes),
        "ats_score": ats_score,
        "parsed_skills": skills,
        "parsed_text": parsed_text[:5000] if parsed_text else None,
        "parse_status": parse_status,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    ins = await supabase.table("user_resumes").insert(row).execute()

    # Mark user setup complete
    await supabase.table("users").update({"has_resume_setup": True}).eq("id", user_id).execute()

    result = ins.data[0] if ins.data else row
    result["_id"] = result.get("id")
    result["file_url"] = await _get_fresh_signed_url(storage_path)
    return result


@api_router.post("/resume/create")
async def create_resume(body: ResumeCreateBody):
    ats_score, skills = _score_template_resume(body)
    resume_id = str(uuid_lib.uuid4())
    now_iso = datetime.utcnow().isoformat()

    resume_data = {
        "full_name": body.full_name,
        "email": body.email,
        "phone": body.phone,
        "linkedin": body.linkedin,
        "skills": body.skills,
        "work_experience": [e.model_dump() for e in body.work_experience],
        "education": [e.model_dump() for e in body.education],
        "languages": [e.model_dump() for e in body.languages],
        "certifications": [e.model_dump() for e in body.certifications],
    }

    row = {
        "id": resume_id,
        "user_id": body.user_id,
        "resume_type": "created",
        "resume_data": resume_data,
        "ats_score": ats_score,
        "parsed_skills": skills,
        "parse_status": "success",
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    ins = await supabase.table("user_resumes").insert(row).execute()
    await supabase.table("users").update({"has_resume_setup": True}).eq("id", body.user_id).execute()

    result = ins.data[0] if ins.data else row
    result["_id"] = result.get("id")
    return result


@api_router.get("/resume/{user_id}")
async def get_resume(user_id: str):
    res = await supabase.table("user_resumes") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(1).execute()
    data = _one(res)
    if not data:
        return None
    data["_id"] = data.get("id")
    if data.get("file_path"):
        data["file_url"] = await _get_fresh_signed_url(data["file_path"])
    return data


@api_router.delete("/resume/{resume_id}")
async def delete_resume(resume_id: str):
    res = await supabase.table("user_resumes").select("file_path").eq("id", resume_id).limit(1).execute()
    data = _one(res)
    if data and data.get("file_path"):
        try:
            await supabase.storage.from_("resumes").remove([data["file_path"]])
        except Exception:
            pass
    await supabase.table("user_resumes").delete().eq("id", resume_id).execute()
    return {"deleted": True}


@api_router.put("/resume/created/{resume_id}")
async def update_created_resume(resume_id: str, body: ResumeCreateBody):
    """Update an existing template resume in-place."""
    ats_score, skills = _score_template_resume(body)
    resume_data = {
        "full_name": body.full_name,
        "email": body.email,
        "phone": body.phone,
        "linkedin": body.linkedin,
        "skills": body.skills,
        "work_experience": [e.model_dump() for e in body.work_experience],
        "education": [e.model_dump() for e in body.education],
        "languages": [e.model_dump() for e in body.languages],
        "certifications": [e.model_dump() for e in body.certifications],
    }
    update_data = {
        "resume_data": resume_data,
        "ats_score": ats_score,
        "parsed_skills": skills,
        "updated_at": datetime.utcnow().isoformat(),
    }
    await supabase.table("user_resumes").update(update_data).eq("id", resume_id).execute()
    res = await supabase.table("user_resumes").select("*").eq("id", resume_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Resume not found")
    data["_id"] = data.get("id")
    return data


@api_router.get("/resume/{user_id}/export-pdf")
async def export_resume_pdf(user_id: str):
    """Export resume as PDF."""
    res = await supabase.table("user_resumes") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("resume_type", "created") \
        .order("created_at", desc=True) \
        .limit(1).execute()
    data = _one(res)
    if not data or not data.get("resume_data"):
        raise HTTPException(404, "Resume not found")

    resume_data = data["resume_data"]
    pdf_bytes = _generate_resume_pdf(resume_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="resume.pdf"'},
    )


@api_router.post("/resume/skip")
async def skip_resume_setup(body: dict):
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(400, "user_id required")
    await supabase.table("users").update({"has_resume_setup": True}).eq("id", user_id).execute()
    return {"skipped": True}


# ── Cover letter endpoints ─────────────────────────────────────

@api_router.get("/cover-letters/{user_id}")
async def list_cover_letters(user_id: str):
    res = await supabase.table("user_cover_letters") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True).execute()
    rows = res.data or []
    for r in rows:
        r["_id"] = r.get("id")
    return rows


@api_router.post("/cover-letters")
async def create_cover_letter(body: CoverLetterCreate):
    now_iso = datetime.utcnow().isoformat()
    row = {
        "user_id": body.user_id,
        "title": body.title,
        "company_name": body.company_name,
        "position": body.position,
        "content": body.content,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    ins = await supabase.table("user_cover_letters").insert(row).execute()
    result = ins.data[0] if ins.data else row
    result["_id"] = result.get("id")
    return result


@api_router.put("/cover-letters/{letter_id}")
async def update_cover_letter(letter_id: str, body: CoverLetterUpdate):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    await supabase.table("user_cover_letters").update(update_data).eq("id", letter_id).execute()
    res = await supabase.table("user_cover_letters").select("*").eq("id", letter_id).limit(1).execute()
    data = _one(res)
    if data:
        data["_id"] = data.get("id")
    return data or {}


@api_router.delete("/cover-letters/{letter_id}")
async def delete_cover_letter(letter_id: str):
    await supabase.table("user_cover_letters").delete().eq("id", letter_id).execute()
    return {"deleted": True}


# ── Register router & middleware ──────────────────────────────
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

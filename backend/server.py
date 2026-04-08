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
import urllib.request
import httpx

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
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    _REPORTLAB_AVAILABLE = True
except ImportError:
    _REPORTLAB_AVAILABLE = False

# ── Thai font bootstrap ────────────────────────────────────────────────────────
_THAI_FONT_READY = False

def _ensure_thai_font() -> tuple[str, str]:
    """
    Ensure a Thai-capable TTF font is registered with ReportLab.
    Returns (regular_font_name, bold_font_name).

    Strategy:
    1. Try common system font paths (Linux / Railway Debian image).
    2. Fall back to downloading Sarabun from Google Fonts GitHub and caching
       it in /tmp so it persists across warm restarts.
    """
    global _THAI_FONT_READY
    if _THAI_FONT_READY:
        return 'Sarabun', 'Sarabun-Bold'

    # Common system paths – Railway uses Debian; fonts-thai-tlwg may be present
    system_candidates = [
        (
            '/usr/share/fonts/truetype/thai/Sarabun-Regular.ttf',
            '/usr/share/fonts/truetype/thai/Sarabun-Bold.ttf',
        ),
        (
            '/usr/share/fonts/truetype/noto/NotoSansThai-Regular.ttf',
            '/usr/share/fonts/truetype/noto/NotoSansThai-Bold.ttf',
        ),
        (
            '/usr/share/fonts/truetype/thai/TlwgMono.ttf',
            '/usr/share/fonts/truetype/thai/TlwgMonoBold.ttf',
        ),
    ]
    for reg_path, bold_path in system_candidates:
        if os.path.exists(reg_path):
            pdfmetrics.registerFont(TTFont('Sarabun', reg_path))
            if os.path.exists(bold_path):
                pdfmetrics.registerFont(TTFont('Sarabun-Bold', bold_path))
            else:
                pdfmetrics.registerFont(TTFont('Sarabun-Bold', reg_path))
            pdfmetrics.registerFontFamily(
                'Sarabun', normal='Sarabun', bold='Sarabun-Bold',
                italic='Sarabun', boldItalic='Sarabun-Bold',
            )
            _THAI_FONT_READY = True
            return 'Sarabun', 'Sarabun-Bold'

    # Download Sarabun from Google Fonts (GitHub mirror) and cache in /tmp
    cache_dir = '/tmp/mydemy_fonts'
    os.makedirs(cache_dir, exist_ok=True)
    reg_local  = os.path.join(cache_dir, 'Sarabun-Regular.ttf')
    bold_local = os.path.join(cache_dir, 'Sarabun-Bold.ttf')

    base_url = 'https://github.com/google/fonts/raw/main/ofl/sarabun'
    if not os.path.exists(reg_local):
        urllib.request.urlretrieve(f'{base_url}/Sarabun-Regular.ttf', reg_local)
    if not os.path.exists(bold_local):
        urllib.request.urlretrieve(f'{base_url}/Sarabun-Bold.ttf', bold_local)

    pdfmetrics.registerFont(TTFont('Sarabun',      reg_local))
    pdfmetrics.registerFont(TTFont('Sarabun-Bold', bold_local))
    pdfmetrics.registerFontFamily(
        'Sarabun', normal='Sarabun', bold='Sarabun-Bold',
        italic='Sarabun', boldItalic='Sarabun-Bold',
    )
    _THAI_FONT_READY = True
    return 'Sarabun', 'Sarabun-Bold'

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
    sequence_order: Optional[int] = None
    counts_for_certification: Optional[bool] = None


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


# ===== MIGRATION: embedded practice questions → quizzes table =====

def _transform_practice_question(q: dict) -> dict:
    """Convert one embedded question (prompt/answer/content) to renderer format
    (question/options/correct_answer/micro_lesson/concept_reveal/scenario_nodes)."""
    q_type  = (q.get("type") or q.get("question_type") or "multiple-choice").strip()
    raw_content = q.get("content")
    content = raw_content if isinstance(raw_content, dict) else {}
    out     = dict(q)
    out["type"] = q_type

    if not out.get("question"):
        out["question"] = out.get("prompt") or ""

    if q_type == "micro-lesson":
        if not out.get("micro_lesson"):
            out["micro_lesson"] = {"cards": content.get("cards") or []}
        return out

    if q_type == "concept-reveal":
        if not out.get("concept_reveal"):
            out["concept_reveal"] = content.get("conceptReveal") or {}
        return out

    if q_type == "scenario":
        if not out.get("scenario_nodes"):
            out["scenario_nodes"] = content.get("scenarioNodes") or []
        if not out.get("correct_answer") and out.get("answer"):
            out["correct_answer"] = str(out["answer"])
        return out

    if q_type == "fill-blank":
        if not out.get("correct_answer"):
            blanks = (content.get("visual") or {}).get("config", {}).get("blanks", [])
            if blanks:
                id_to_label: dict = {}
                for blank in blanks:
                    if not isinstance(blank, dict):
                        continue
                    for opt in blank.get("options", []):
                        if not isinstance(opt, dict):
                            continue
                        id_to_label[opt["id"]] = opt.get("label") or opt["id"]
                raw = str(out.get("answer") or "").split(",")[0].strip()
                out["correct_answer"] = id_to_label.get(raw, raw)
            elif out.get("answer"):
                out["correct_answer"] = str(out["answer"])
        return out

    if q_type == "drag-arrange":
        return out

    # multiple-choice / comparison / chart-* — resolve option ID → text
    content_opts = content.get("options") or []
    if content_opts:
        out["options"] = [
            (o.get("content") or o.get("label") or str(o.get("id", "")))
            for o in content_opts if isinstance(o, dict)
        ]
        raw_answer = str(out.get("answer") or "")
        id_to_text = {
            o["id"]: (o.get("content") or o.get("label") or o["id"])
            for o in content_opts if isinstance(o, dict) and "id" in o
        }
        out["correct_answer"] = id_to_text.get(raw_answer, raw_answer)

    return out


@api_router.get("/admin/migrate-practice-quizzes")
async def migrate_practice_quizzes():
    """One-time migration: reads all practice_modules, transforms embedded
    questions to renderer format, and upserts one quiz row per module into
    the quizzes table (quiz_type = module_key).

    Safe to run multiple times — uses upsert logic (update if exists, insert if not).
    """
    try:
        mods_res = await supabase.table("practice_modules") \
            .select("id, course_id, module_key, title, questions") \
            .execute()
        modules = mods_res.data or []

        results = []
        for mod in modules:
            course_id  = mod.get("course_id")
            module_key = mod.get("module_key") or mod["id"]
            title      = mod.get("title") or module_key
            embedded   = mod.get("questions") or []

            if not course_id:
                results.append({"module": title, "status": "skipped_no_course_id", "questions": 0})
                continue

            if not embedded:
                results.append({"module": title, "status": "skipped_no_questions", "questions": 0})
                continue

            transformed = []
            transform_error = None
            for qi, q in enumerate(embedded):
                try:
                    transformed.append(_transform_practice_question(dict(q)))
                except Exception as e:
                    import traceback as _tb
                    transform_error = {
                        "question_index": qi,
                        "question_id": q.get("id") if isinstance(q, dict) else str(q)[:40],
                        "error": str(e),
                        "trace": _tb.format_exc().splitlines()[-5:],
                    }
                    break
            if transform_error:
                results.append({"module": title, "status": "transform_error", "questions": 0, "detail": transform_error})
                continue

            try:
                # Upsert: update existing row or insert new one
                existing = await supabase.table("quizzes") \
                    .select("id") \
                    .eq("course_id", course_id) \
                    .eq("quiz_type", module_key) \
                    .limit(1).execute()

                existing_row = _one(existing)
                if existing_row:
                    await supabase.table("quizzes") \
                        .update({"questions": transformed, "title": title}) \
                        .eq("id", existing_row["id"]) \
                        .execute()
                    status = "updated"
                else:
                    await supabase.table("quizzes").insert({
                        "course_id": course_id,
                        "quiz_type": module_key,
                        "title":     title,
                        "questions": transformed,
                    }).execute()
                    status = "inserted"
            except Exception as e:
                results.append({"module": title, "status": f"db_error: {e}", "questions": 0})
                continue

            results.append({"module": title, "status": status, "questions": len(transformed)})

        total_q = sum(r["questions"] for r in results)
        return {
            "ok": True,
            "modules_processed": len(results),
            "total_questions": total_q,
            "details": results,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


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
    - Primary: Supabase Auth email/password (for all users created via Supabase Auth)
    - Fallback: custom bcrypt password_hash field (for WordPress-migrated users)
    """
    email = body.email.lower().strip()

    # ── 1. Try Supabase Auth first (covers the vast majority of users) ──────
    try:
        auth_res = await supabase.auth.sign_in_with_password({
            "email": email,
            "password": body.password,
        })
        if auth_res and auth_res.user:
            # Fetch the public.users profile row
            res = await supabase.table("users").select("*").eq("email", email).limit(1).execute()
            rows = res.data if res and res.data else []
            if rows:
                return await _build_user_response(dict(rows[0]))
            # Profile row missing — auto-create minimal one
            insert_res = await supabase.table("users").insert({
                "email": email,
                "username": email.split("@")[0],
                "must_reset_password": False,
                "certificates": [],
            }).execute()
            if insert_res and insert_res.data:
                return await _build_user_response(dict(insert_res.data[0]))
    except Exception:
        pass  # Supabase Auth failed — try legacy password_hash below

    # ── 2. Legacy: check password_hash column (WordPress-migrated users) ────
    res = await supabase.table("users").select("*").eq("email", email).limit(1).execute()
    rows = res.data if res and res.data else []
    if not rows:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    user = rows[0]
    stored_hash = user.get("password_hash") or ""

    if not stored_hash:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

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


# ── Career path sequence definitions ────────────────────────────────────────
# Ordered list of course IDs for each sequenced career path.
# A user must complete course N before course N+1 unlocks.
# Completing all courses triggers issuance of a career certificate.
CAREER_PATH_SEQUENCES: Dict[str, List[str]] = {
    "Data Analysis": [
        "6ea633e1-2ae9-4e18-bbe6-2801b3d9999e",  # Introduction of Data Analytics
        "9762122a-03c9-4766-8f52-6c11e2163f6d",  # Mastering Spreadsheets
        "2397e18d-aebc-412e-b46d-12aa99c45254",  # Explore the data
        "2797c982-ce83-4007-b3cd-e394eb7b3deb",  # Data Cleaning with SQL
        "f1b2f10e-a9bf-413c-807a-818c4d8a1a25",  # Introduction to Python
        "58a6a79b-191b-477d-b86f-72f870176bf5",  # วิเคราะห์ข้อมูลด้วย Python Part 1
        "ad5ef8c2-747e-48fe-b4d3-c544dc735dc9",  # วิเคราะห์ข้อมูลด้วย Python Part 2
        "92cb258f-5b07-45ee-8468-7607fed6bc9d",  # Introduction to Data Storytelling
        "20dcb6f6-3ad0-428c-8b81-7b763b0b1d87",  # Data Analysis and Visualization Capstone
        "e0d9fd2e-5b41-471c-9954-9ee935a873ac",  # Data-Driven Marketing
    ],
    "UX Design": [
        "0f879dc3-0c1f-434c-b630-d4912d48e4f3",  # Introduction to UX&UI Designs
        "0a7c889b-defd-4826-af2d-eb1711dff6e9",  # Foundation of UX/UI Design
        "1e2ccc48-02e7-4164-9750-86ad1ecdf76b",  # Design Foundation and Theory
        "2699b86e-e10d-4662-9546-cd23fd659f1d",  # Introduction to Figma
        "637516a7-7b64-4959-82a3-23a13702aacf",  # Empathize User with User Research
        "92131454-e789-41d0-b39f-d99b27db57b9",  # Ideation & Creation of Wireframes
        "c07c784a-6614-4052-8a51-7ab286d7b8a0",  # Prototype and Testing
        "e29d1eb7-f8fa-41b3-8b78-fd0879bed1c7",  # Deep Dive into UX Writing
        "e64a9500-21cd-4dca-9ad2-141964cd34dd",  # Build a UX Career - Final Chapter
    ],
    "Learning Designer": [
        "0ed54de0-bab7-4fee-8757-ca62d3ada0ca",  # Introduction to Learning Design & Experience
        "508599a4-ee45-46b2-9c94-799842934243",  # Learning Design for Adult Learner
        "4ad3ad4d-9bad-4605-868f-898ab7368dfc",  # Learner-Centric Design for Educators
        "b1403780-a5cd-4748-ba8b-cdaf6890e7ba",  # Project Management for Learning Designers
    ],
    "Project Management": [
        "fd617c90-9df8-47f2-b284-2af7a38f6425",  # Project Management Crash Course
        "eeaa3d1c-db5b-4b34-85b1-c69a5519a443",  # The Complete Series of Project Management (1-3)
        "8e6e7a83-a691-412a-a01b-7a23c0f5b218",  # Project Leadership in the Digital Age (Part 4)
    ],
    "QA Tester": [
        # Coming soon - no courses yet
    ],
}


async def _user_completed_course_ids(supabase_client, user_id: str) -> set:
    """Return the set of course IDs the user has completed (either via cert or all practice modules)."""
    if not user_id or user_id == "demo_user":
        return set()

    # Video courses: completed when they have a course certificate
    cert_res = await supabase_client.table("certificates") \
        .select("course_id") \
        .eq("user_id", user_id) \
        .eq("cert_type", "course") \
        .execute()
    completed: set = {r["course_id"] for r in (cert_res.data or []) if r.get("course_id")}

    # Interactive courses: completed when all their practice modules are completed
    # Get all practice modules grouped by course_id where user has completed=True
    prog_res = await supabase_client.table("practice_progress") \
        .select("module_id") \
        .eq("user_id", user_id) \
        .eq("completed", True) \
        .execute()
    completed_module_ids = {r["module_id"] for r in (prog_res.data or [])}

    if completed_module_ids:
        # Find which courses have ALL their modules completed
        all_pm_res = await supabase_client.table("practice_modules") \
            .select("id,course_id") \
            .execute()
        course_modules: Dict[str, set] = {}
        for pm in (all_pm_res.data or []):
            cid = pm["course_id"]
            course_modules.setdefault(cid, set()).add(pm["id"])
        for cid, all_mods in course_modules.items():
            if all_mods and all_mods.issubset(completed_module_ids):
                completed.add(cid)

    return completed


@api_router.get("/courses")
async def list_courses(career_path: Optional[str] = None, published_only: bool = False, user_id: Optional[str] = None):
    query = supabase.table("courses").select("*")
    if career_path:
        query = query.eq("career_path", career_path)
    if published_only:
        query = query.eq("is_published", True)
    res = await query.execute()
    courses = rows_with_id(res.data or [])

    # Enrich each course with its practice module count (single extra query)
    if courses:
        course_ids = [c["_id"] for c in courses]
        pm_res = await supabase.table("practice_modules").select("course_id").in_("course_id", course_ids).execute()
        pm_counts: dict = {}
        for pm in (pm_res.data or []):
            cid = pm["course_id"]
            pm_counts[cid] = pm_counts.get(cid, 0) + 1
        for c in courses:
            c["practice_module_count"] = pm_counts.get(c["_id"], 0)

    # Enrich with lock status (sequence_order is now a real DB column)
    user_completed = await _user_completed_course_ids(supabase, user_id) if user_id else set()

    # Build per-career-path ordered lists of cert-required courses for prerequisite chaining
    cert_sequences: Dict[str, list] = {}
    for c in courses:
        cp = c.get("career_path", "")
        if c.get("counts_for_certification", True) and c.get("sequence_order") is not None:
            cert_sequences.setdefault(cp, []).append(c)
    for cp in cert_sequences:
        cert_sequences[cp].sort(key=lambda x: x["sequence_order"])

    for c in courses:
        cid = c["_id"]
        cp = c.get("career_path", "")
        seq = cert_sequences.get(cp, [])
        seq_ids = [x["_id"] for x in seq]
        if not c.get("counts_for_certification", True):
            # Optional courses are never locked
            c["is_locked"] = False
            c["prerequisite_course_id"] = None
        elif cid in seq_ids:
            idx = seq_ids.index(cid)
            c["is_locked"] = idx > 0 and seq_ids[idx - 1] not in user_completed
            c["prerequisite_course_id"] = seq_ids[idx - 1] if idx > 0 else None
        else:
            c["is_locked"] = False
            c["prerequisite_course_id"] = None
        c["is_completed"] = cid in user_completed

    # Sort: sequenced courses first (by sequence_order), then non-sequenced
    courses.sort(key=lambda c: (c["sequence_order"] is None, c["sequence_order"] or 0))

    return courses


@api_router.get("/courses/{course_id}")
async def get_course(course_id: str, user_id: Optional[str] = None):
    res = await supabase.table("courses").select("*").eq("id", course_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Course not found")
    course = with_id(data)

    # Enrich with lock info (sequence_order is a real DB column)
    cid = course["_id"]
    cp = course.get("career_path", "")
    user_completed = await _user_completed_course_ids(supabase, user_id) if user_id else set()
    course["is_completed"] = cid in user_completed

    if not course.get("counts_for_certification", True):
        course["is_locked"] = False
        course["prerequisite_course_id"] = None
    elif course.get("sequence_order") is not None:
        # Find the previous cert-required course in the same career path
        prev_res = await supabase.table("courses") \
            .select("id") \
            .eq("career_path", cp) \
            .eq("counts_for_certification", True) \
            .lt("sequence_order", course["sequence_order"]) \
            .order("sequence_order", desc=True) \
            .limit(1).execute()
        prev = (prev_res.data or [None])[0]
        if prev:
            course["prerequisite_course_id"] = prev["id"]
            course["is_locked"] = prev["id"] not in user_completed
        else:
            course["prerequisite_course_id"] = None
            course["is_locked"] = False
    else:
        course["prerequisite_course_id"] = None
        course["is_locked"] = False

    return course


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


@api_router.post("/admin/seed-sequences")
async def seed_sequences():
    """One-time migration: populate sequence_order from the hardcoded CAREER_PATH_SEQUENCES dict."""
    updated = 0
    for career_path, course_ids in CAREER_PATH_SEQUENCES.items():
        for idx, course_id in enumerate(course_ids):
            res = await supabase.table("courses") \
                .update({"sequence_order": idx + 1}) \
                .eq("id", course_id).execute()
            if res.data:
                updated += 1
    return {"message": f"Seeded sequence_order for {updated} courses"}


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

                # Check career path sequence completion after course cert
                if cid:
                    try:
                        user_completed_set = await _user_completed_course_ids(supabase, submission.user_id)
                        course_cp_res = await supabase.table("courses") \
                            .select("career_path").eq("id", cid).limit(1).execute()
                        cp_data = _one(course_cp_res)
                        cp = (cp_data or {}).get("career_path", "")
                        sequence = CAREER_PATH_SEQUENCES.get(cp, [])
                        if sequence and all(sid in user_completed_set for sid in sequence):
                            existing_career = await supabase.table("certificates") \
                                .select("id").eq("user_id", submission.user_id).eq("career_path", cp).eq("cert_type", "career").limit(1).execute()
                            if not _one(existing_career):
                                courses_res = await supabase.table("courses") \
                                    .select("title").in_("id", sequence).execute()
                                career_courses_titles = [c["title"] for c in (courses_res.data or [])]
                                display_name_career = (
                                    user_data.get("display_name")
                                    or user_data.get("username")
                                    or "ผู้เรียน"
                                )
                                now_c = datetime.utcnow()
                                import secrets as _sec, string as _str
                                _chars = _str.ascii_uppercase + _str.digits
                                _suffix = "".join(_sec.choice(_chars) for _ in range(6))
                                career_code = f"MDY-{now_c.year}{now_c.month:02d}-{_suffix}"
                                await supabase.table("certificates").insert({
                                    "user_id": submission.user_id,
                                    "cert_type": "career",
                                    "career_path": cp,
                                    "career_courses": career_courses_titles,
                                    "user_display_name": display_name_career,
                                    "issue_month": now_c.month,
                                    "issue_year": now_c.year,
                                    "verification_code": career_code,
                                }).execute()
                    except Exception as e:
                        logger.warning(f"Could not check/issue career cert after final exam: {e}")

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

    # Use a dedicated checkin key inside daily_xp so that lesson/quiz activity
    # on the same day doesn't falsely mark the user as already checked in.
    daily_xp: dict = dict(stats.get("daily_xp") or {})
    checkin_key = f"__checkin__{today}"

    if daily_xp.get(checkin_key):
        return {
            "already_checked_in": True,
            "xp_awarded": 0,
            "streak": stats.get("current_streak", 0),
        }

    # Mark the checkin flag first so re-entrant calls can't double-award
    daily_xp[checkin_key] = True
    await supabase.table("user_stats").update({"daily_xp": daily_xp}).eq("user_id", user_id).execute()

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


@api_router.get("/practice/debug/{module_id}")
async def debug_practice_module(module_id: str):
    """Debug: show raw data for a practice module and its quizzes."""
    pm_res = await supabase.table("practice_modules").select("*").eq("id", module_id).limit(1).execute()
    pm = _one(pm_res)
    if not pm:
        return {"error": "practice_module not found", "module_id": module_id}
    course_id = pm.get("course_id")
    embedded_q_count = len(pm.get("questions") or [])
    embedded_sample = (pm.get("questions") or [])[:1]

    quiz_res = await supabase.table("quizzes").select("id,quiz_type,title,course_id").eq("course_id", course_id).execute()
    quizzes_found = quiz_res.data or []

    full_quiz_res = await supabase.table("quizzes").select("questions").eq("course_id", course_id).execute()
    all_qs = []
    for row in (full_quiz_res.data or []):
        all_qs.extend(row.get("questions") or [])
    sample_q = all_qs[:1]

    return {
        "module_id": module_id,
        "course_id": course_id,
        "embedded_question_count": embedded_q_count,
        "embedded_question_sample": embedded_sample,
        "quizzes_for_course": quizzes_found,
        "quiz_question_count": len(all_qs),
        "quiz_question_sample": sample_q,
    }


def _normalize_embedded_question(q: dict) -> Optional[dict]:
    """Normalize practice_modules embedded question schema to duolingo renderer format.

    Handles two schemas:
    1. Standard (already has 'question') – pass through with type normalization.
    2. Embedded import format (uses 'prompt'/'answer' and nested blanks) – normalize fields.
    3. Self-contained types (micro-lesson, concept-reveal, scenario) – pass through as-is.
    """
    if not q:
        return None

    q_type = q.get("type") or q.get("question_type") or ""

    # Self-contained types that don't need a 'question' field – pass straight through
    if q_type in ("micro-lesson", "concept-reveal", "scenario"):
        if "type" not in q:
            q["type"] = q_type
        return q

    # Already in standard format (has 'question' field)
    if q.get("question"):
        if "type" not in q and q.get("question_type"):
            q["type"] = q["question_type"]
        return q

    # Embedded import format uses 'prompt' as the question text
    if not q.get("prompt"):
        # No question text at all – skip
        return None

    q["question"] = q["prompt"]
    if "type" not in q:
        q["type"] = q_type or "multiple_choice"

    # Normalize answer → correct_answer
    raw_answer = str(q.get("answer", ""))
    answer_ids = [a.strip() for a in raw_answer.split(",") if a.strip()]

    # Fill-blank with nested blanks (code completion style)
    blanks = (q.get("content") or {}).get("visual", {}).get("config", {}).get("blanks", [])
    if blanks:
        # Build id→label map across all blanks
        id_to_label = {}
        for blank in blanks:
            for opt in blank.get("options", []):
                id_to_label[opt["id"]] = opt["label"]

        # Convert to multiple_choice using the first blank so the renderer works
        first_blank = blanks[0]
        first_answer_id = answer_ids[0] if answer_ids else ""
        q["type"] = "multiple_choice"
        q["options"] = [opt["label"] for opt in first_blank.get("options", [])]
        q["correct_answer"] = id_to_label.get(first_answer_id, first_answer_id)
    else:
        # Simple MC with flat options list
        content_opts = (q.get("content") or {}).get("options", [])
        if content_opts:
            q["options"] = [
                o.get("label", o) if isinstance(o, dict) else o
                for o in content_opts
            ]
            q["type"] = "multiple_choice"
            id_to_label = {
                o["id"]: o.get("label", o["id"])
                for o in content_opts if isinstance(o, dict) and "id" in o
            }
            resolved = [id_to_label.get(aid, aid) for aid in answer_ids]
            q["correct_answer"] = resolved[0] if len(resolved) == 1 else ", ".join(resolved)
        else:
            if not q.get("correct_answer") and raw_answer:
                q["correct_answer"] = raw_answer
            if "type" not in q:
                q["type"] = "fill-blank"

    return q


@api_router.get("/practice/module/{module_id}")
async def get_practice_module(module_id: str):
    """Single module with full questions array.

    Lookup order:
    1. quizzes table filtered by course_id + module_key (populated by
       migrate_practice_to_quizzes.py) — preferred, renderer-ready format.
    2. Fall back to embedded questions in practice_modules.questions.
    """
    res = await supabase.table("practice_modules") \
        .select("*") \
        .eq("id", module_id) \
        .limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Practice module not found")

    course_id  = data.get("course_id")
    module_key = data.get("module_key")

    if course_id and module_key:
        # Prefer the per-module quiz row written by the migration script.
        quiz_res = await supabase.table("quizzes") \
            .select("questions") \
            .eq("course_id", course_id) \
            .eq("quiz_type", module_key) \
            .limit(1).execute()
        quiz_row = _one(quiz_res)
        if quiz_row and quiz_row.get("questions"):
            data["questions"] = quiz_row["questions"]
            return data

    # Fall back to embedded questions — returned as-is.
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

    # Check if this completion finishes the entire course (interactive) → issue course cert + check career cert
    career_cert_issued = False
    if newly_completed and body.user_id != "demo_user":
        try:
            # Identify the course for this module
            mod_res = await supabase.table("practice_modules") \
                .select("course_id") \
                .eq("id", body.module_id) \
                .limit(1).execute()
            mod_data = _one(mod_res)
            if mod_data:
                course_id = mod_data["course_id"]
                # Check if all modules for this course are now completed
                user_completed_set = await _user_completed_course_ids(supabase, body.user_id)
                if course_id in user_completed_set:
                    # Issue course cert if not already issued
                    existing_cert = await supabase.table("certificates") \
                        .select("id").eq("user_id", body.user_id).eq("course_id", course_id).limit(1).execute()
                    if not _one(existing_cert):
                        course_res = await supabase.table("courses") \
                            .select("title,career_path").eq("id", course_id).limit(1).execute()
                        course_data = _one(course_res)
                        user_res = await supabase.table("users") \
                            .select("display_name,username").eq("id", body.user_id).limit(1).execute()
                        user_data = _one(user_res)
                        if course_data and user_data:
                            now = datetime.utcnow()
                            display_name = user_data.get("display_name") or user_data.get("username") or "ผู้เรียน"
                            await supabase.table("certificates").insert({
                                "user_id": body.user_id,
                                "cert_type": "course",
                                "course_id": course_id,
                                "career_path": course_data.get("career_path"),
                                "course_title": course_data.get("title"),
                                "user_display_name": display_name,
                                "issue_month": now.month,
                                "issue_year": now.year,
                                "verification_code": _gen_cert_code("MDY"),
                            }).execute()

                    # Re-fetch updated completed set after potential new cert
                    user_completed_set = await _user_completed_course_ids(supabase, body.user_id)
                    # Check career path sequence completion
                    course_res2 = await supabase.table("courses") \
                        .select("career_path").eq("id", course_id).limit(1).execute()
                    cp_data = _one(course_res2)
                    cp = (cp_data or {}).get("career_path", "")
                    sequence = CAREER_PATH_SEQUENCES.get(cp, [])
                    if sequence and all(cid in user_completed_set for cid in sequence):
                        # All sequence courses done — issue career cert if not already
                        existing_career = await supabase.table("certificates") \
                            .select("id").eq("user_id", body.user_id).eq("career_path", cp).eq("cert_type", "career").limit(1).execute()
                        if not _one(existing_career):
                            courses_res = await supabase.table("courses") \
                                .select("title").in_("id", sequence).execute()
                            career_courses_titles = [c["title"] for c in (courses_res.data or [])]
                            user_res2 = await supabase.table("users") \
                                .select("display_name,username").eq("id", body.user_id).limit(1).execute()
                            u2 = _one(user_res2)
                            display_name2 = (u2 or {}).get("display_name") or (u2 or {}).get("username") or "ผู้เรียน"
                            now2 = datetime.utcnow()
                            await supabase.table("certificates").insert({
                                "user_id": body.user_id,
                                "cert_type": "career",
                                "career_path": cp,
                                "career_courses": career_courses_titles,
                                "user_display_name": display_name2,
                                "issue_month": now2.month,
                                "issue_year": now2.year,
                                "verification_code": _gen_cert_code("MDY"),
                            }).execute()
                            career_cert_issued = True
        except Exception as e:
            logger.warning(f"Could not check/issue career cert after practice module: {e}")

    return {"passed": passed, "best_score": new_best, "newly_completed": newly_completed, "xp_awarded": xp_awarded, "career_cert_issued": career_cert_issued}


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
    """Generate a PDF from resume template data using reportlab + Sarabun (Thai support)."""
    if not _REPORTLAB_AVAILABLE:
        raise HTTPException(500, "PDF generation not available")

    # Register Thai-capable font (downloads Sarabun on first call if needed)
    font_reg, font_bold = _ensure_thai_font()

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, pagesize=A4,
        topMargin=0.5*inch, bottomMargin=0.5*inch,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
    )

    # ── Shared styles ────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        'ResumeTitle',
        fontSize=20, leading=26,
        textColor=colors.HexColor('#111827'),
        spaceAfter=4, alignment=TA_CENTER,
        fontName=font_bold,
    )
    contact_style = ParagraphStyle(
        'ResumeContact',
        fontSize=10, leading=14,
        textColor=colors.HexColor('#6B7280'),
        alignment=TA_CENTER, spaceAfter=4,
        fontName=font_reg,
    )
    heading_style = ParagraphStyle(
        'ResumeHeading',
        fontSize=11, leading=16,
        textColor=colors.HexColor('#374151'),
        spaceBefore=14, spaceAfter=5,
        fontName=font_bold,
        borderPadding=(0, 0, 3, 0),
    )
    body_style = ParagraphStyle(
        'ResumeBody',
        fontSize=10, leading=15,
        textColor=colors.HexColor('#1F2937'),
        fontName=font_reg,
    )
    bullet_style = ParagraphStyle(
        'ResumeBullet',
        fontSize=10, leading=15,
        textColor=colors.HexColor('#374151'),
        fontName=font_reg,
        leftIndent=12,
        spaceAfter=2,
    )

    story = []

    # ── Name ────────────────────────────────────────────────────────────────
    name = resume_data.get('full_name', 'Resume')
    story.append(Paragraph(name, title_style))

    # ── Contact info ────────────────────────────────────────────────────────
    contact_parts = []
    if resume_data.get('email'):
        contact_parts.append(resume_data['email'])
    if resume_data.get('phone'):
        contact_parts.append(resume_data['phone'])
    if resume_data.get('linkedin'):
        # Shorten long LinkedIn URLs to just "LinkedIn"
        li = resume_data['linkedin']
        contact_parts.append('LinkedIn' if len(li) > 40 else li)

    if contact_parts:
        story.append(Paragraph(' • '.join(contact_parts), contact_style))

    story.append(Spacer(1, 0.18*inch))

    # ── Section divider helper ───────────────────────────────────────────────
    def section(title: str):
        story.append(Paragraph(title.upper(), heading_style))
        story.append(Spacer(1, 0.02*inch))

    # ── Skills ──────────────────────────────────────────────────────────────
    skills = resume_data.get('skills', [])
    if skills:
        section('Skills')
        story.append(Paragraph(', '.join(skills), body_style))
        story.append(Spacer(1, 0.1*inch))

    # ── Work Experience ─────────────────────────────────────────────────────
    work_exp = resume_data.get('work_experience', [])
    if work_exp:
        section('Work Experience')
        for job in work_exp:
            role    = job.get('role', '')
            company = job.get('company', '')
            dates   = ' – '.join(filter(None, [job.get('start_date'), job.get('end_date')]))
            header  = f"<b>{role}</b> • {company}"
            if dates:
                header += f"  <font color='#6B7280'>({dates})</font>"
            story.append(Paragraph(header, body_style))
            for bullet in (job.get('bullets') or []):
                story.append(Paragraph(f"• {bullet}", bullet_style))
            story.append(Spacer(1, 0.08*inch))

    # ── Education ───────────────────────────────────────────────────────────
    education = resume_data.get('education', [])
    if education:
        section('Education')
        for edu in education:
            degree = edu.get('degree', '')
            field  = edu.get('field', '')
            inst   = edu.get('institution', '')
            year   = edu.get('graduation_year', '')
            line   = f"<b>{degree}"
            if field:
                line += f", {field}"
            line += f"</b> • {inst}"
            if year:
                line += f" ({year})"
            story.append(Paragraph(line, body_style))
        story.append(Spacer(1, 0.08*inch))

    # ── Languages ───────────────────────────────────────────────────────────
    languages = resume_data.get('languages', [])
    if languages:
        section('Languages')
        for lang in languages:
            story.append(Paragraph(
                f"<b>{lang.get('language', '')}</b> – {lang.get('level', '')}",
                body_style,
            ))
        story.append(Spacer(1, 0.08*inch))

    # ── Certifications ──────────────────────────────────────────────────────
    certifications = resume_data.get('certifications', [])
    if certifications:
        section('Certifications')
        for cert in certifications:
            cert_name = cert.get('name', '')
            issuer    = cert.get('issuer', '')
            year      = cert.get('year', '')
            line      = f"<b>{cert_name}</b>"
            if issuer:
                line += f" • {issuer}"
            if year:
                line += f" ({year})"
            story.append(Paragraph(line, body_style))

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


# ===== LESSON VIDEO UPDATE =====

class LessonVideoUpdate(BaseModel):
    video_url: Optional[str] = None
    video_id: Optional[str] = None


@api_router.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, body: LessonVideoUpdate):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await supabase.table("lessons").update(update_data).eq("id", lesson_id).execute()
    res = await supabase.table("lessons").select("*").eq("id", lesson_id).limit(1).execute()
    data = _one(res)
    if not data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    data["order"] = data.get("order_index", 0)
    return with_id(data)


# ===== BUNNY.NET INTEGRATION =====

BUNNY_API_BASE = "https://video.bunnycdn.com"


async def _get_bunny_credentials():
    res = await supabase.table("admin_settings").select("bunny_api_key,bunny_library_id").eq("id", 1).limit(1).execute()
    data = _one(res)
    if not data or not data.get("bunny_api_key") or not data.get("bunny_library_id"):
        raise HTTPException(status_code=400, detail="Bunny.net API key and Library ID are not configured. Please set them in Admin → Settings.")
    return data["bunny_api_key"], data["bunny_library_id"]


@api_router.get("/bunny/collections")
async def list_bunny_collections():
    """Fetch all collections from the configured Bunny.net library."""
    api_key, library_id = await _get_bunny_credentials()
    all_collections = []
    page = 1
    items_per_page = 100
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            resp = await client.get(
                f"{BUNNY_API_BASE}/library/{library_id}/collections",
                params={"page": page, "itemsPerPage": items_per_page, "orderBy": "name"},
                headers={"AccessKey": api_key},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Bunny.net API error: {resp.text}")
            data = resp.json()
            items = data.get("items") or []
            all_collections.extend([
                {
                    "guid": c["guid"],
                    "name": c.get("name", ""),
                    "video_count": c.get("videoCount", 0),
                    "thumbnail_url": c.get("previewImageUrls", [None])[0],
                }
                for c in items
            ])
            total = data.get("totalItems", 0)
            if page * items_per_page >= total:
                break
            page += 1
    return {"collections": all_collections, "total": len(all_collections)}


@api_router.get("/bunny/videos")
async def list_bunny_videos(collection_id: Optional[str] = None):
    """Fetch videos from the configured Bunny.net library, optionally filtered by collection."""
    api_key, library_id = await _get_bunny_credentials()
    all_videos = []
    page = 1
    items_per_page = 100
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            params: Dict[str, Any] = {"page": page, "itemsPerPage": items_per_page, "orderBy": "title"}
            if collection_id:
                params["collection"] = collection_id
            resp = await client.get(
                f"{BUNNY_API_BASE}/library/{library_id}/videos",
                params=params,
                headers={"AccessKey": api_key},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Bunny.net API error: {resp.text}")
            data = resp.json()
            items = data.get("items") or []
            all_videos.extend([
                {
                    "guid": v["guid"],
                    "title": v.get("title", ""),
                    "length": v.get("length", 0),
                    "collection_id": v.get("collectionId", ""),
                    "embed_url": f"https://iframe.mediadelivery.net/embed/{library_id}/{v['guid']}",
                }
                for v in items
            ])
            total = data.get("totalItems", 0)
            if page * items_per_page >= total:
                break
            page += 1
    return {"videos": all_videos, "total": len(all_videos)}


class BunnyMatchRequest(BaseModel):
    lessons: List[Dict[str, Any]]   # [{id, title, module_title, course_title}]
    videos: List[Dict[str, Any]]    # [{guid, title, embed_url}]


@api_router.post("/bunny/ai-match")
async def ai_match_bunny_videos(body: BunnyMatchRequest):
    """Use the configured AI provider to suggest which Bunny video belongs to each lesson."""
    if not body.lessons or not body.videos:
        raise HTTPException(status_code=400, detail="lessons and videos are required")

    # Fetch AI credentials
    settings_res = await supabase.table("admin_settings").select("*").eq("id", 1).limit(1).execute()
    settings = _one(settings_res) or {}
    ai_provider = settings.get("ai_provider", "openai")
    openai_key = settings.get("openai_key")
    claude_key = settings.get("claude_key")
    gemini_key = settings.get("gemini_key")

    # Build a compact prompt
    lessons_list = "\n".join(
        f'{i+1}. [ID:{l["id"]}] {l["course_title"]} > {l["module_title"]} > {l["title"]}'
        for i, l in enumerate(body.lessons)
    )
    videos_list = "\n".join(
        f'{i+1}. [GUID:{v["guid"]}] {v["title"]}'
        for i, v in enumerate(body.videos)
    )
    prompt = f"""You are a helpful assistant matching course lesson titles to video titles.
Below are lessons and available videos. For each lesson, pick the BEST matching video (or null if none fits).
Return ONLY a valid JSON array — no markdown, no explanation.
Format: [{{"lesson_id": "...", "video_guid": "...", "confidence": 0.0-1.0}}]

LESSONS:
{lessons_list}

VIDEOS:
{videos_list}
"""

    result_text = ""
    async with httpx.AsyncClient(timeout=60) as client:
        if (ai_provider == "claude" or not openai_key) and claude_key:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": claude_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={"model": "claude-3-haiku-20240307", "max_tokens": 4096, "messages": [{"role": "user", "content": prompt}]},
            )
            resp.raise_for_status()
            result_text = resp.json()["content"][0]["text"]
        elif (ai_provider == "gemini" or not openai_key) and gemini_key:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            resp.raise_for_status()
            result_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        elif openai_key:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "max_tokens": 4096},
            )
            resp.raise_for_status()
            result_text = resp.json()["choices"][0]["message"]["content"]
        else:
            raise HTTPException(status_code=400, detail="No AI credentials configured. Please add an OpenAI, Claude, or Gemini API key in Settings.")

    # Strip markdown fences if present
    result_text = re.sub(r"```json|```", "", result_text).strip()
    try:
        matches = json.loads(result_text)
    except Exception:
        raise HTTPException(status_code=500, detail=f"AI returned unparseable response: {result_text[:200]}")

    # Build a guid→video lookup for convenience
    video_map = {v["guid"]: v for v in body.videos}
    enriched = []
    for m in matches:
        guid = m.get("video_guid")
        video = video_map.get(guid) if guid else None
        enriched.append({
            "lesson_id": m.get("lesson_id"),
            "video_guid": guid,
            "video_title": video["title"] if video else None,
            "embed_url": video["embed_url"] if video else None,
            "confidence": m.get("confidence", 0),
        })
    return {"matches": enriched}


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    user_id: Optional[str] = None   # None = broadcast to all users
    title: str
    body: str
    type: str = "announcement"      # announcement | achievement | course | system
    action_url: Optional[str] = None
    icon: Optional[str] = None      # emoji icon


@api_router.get("/notifications")
async def list_notifications(user_id: Optional[str] = None, limit: int = 50):
    query = supabase.table("notifications").select("*").order("created_at", desc=True).limit(limit)
    if user_id:
        res = await supabase.table("notifications").select("*").or_(
            f"user_id.eq.{user_id},user_id.is.null"
        ).order("created_at", desc=True).limit(limit).execute()
    else:
        res = await query.is_("user_id", "null").execute()
    return rows_with_id(res.data or [])


@api_router.post("/notifications")
async def create_notification(notif: NotificationCreate):
    res = await supabase.table("notifications").insert({
        "user_id": notif.user_id,
        "title": notif.title,
        "body": notif.body,
        "type": notif.type,
        "action_url": notif.action_url,
        "icon": notif.icon,
    }).execute()
    return with_id(res.data[0])


@api_router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str):
    await supabase.table("notifications").delete().eq("id", notif_id).execute()
    return {"ok": True}


# ── Register router & middleware ──────────────────────────────
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

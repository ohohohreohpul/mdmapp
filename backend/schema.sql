-- ============================================================
-- MYDEMY — Supabase / PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Admin Settings (singleton row) ──────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
    id              SERIAL PRIMARY KEY,
    ai_provider     TEXT NOT NULL DEFAULT 'openai',
    openai_key      TEXT,
    gemini_key      TEXT,
    claude_key      TEXT,
    elevenlabs_key  TEXT,
    bunny_api_key   TEXT,
    bunny_library_id TEXT
);
-- Ensure the singleton row exists
INSERT INTO admin_settings (id, ai_provider)
VALUES (1, 'openai')
ON CONFLICT (id) DO NOTHING;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username     TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    certificates TEXT[] NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User Progress (replaces embedded users.progress dict) ────
CREATE TABLE IF NOT EXISTS user_progress (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id         UUID NOT NULL,
    completed_lessons TEXT[] NOT NULL DEFAULT '{}',
    quiz_scores       JSONB NOT NULL DEFAULT '{}',
    UNIQUE (user_id, course_id)
);

-- ── Courses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                    TEXT NOT NULL,
    description              TEXT NOT NULL DEFAULT '',
    career_path              TEXT NOT NULL DEFAULT '',
    thumbnail                TEXT,
    total_lessons            INTEGER NOT NULL DEFAULT 0,
    is_published             BOOLEAN NOT NULL DEFAULT FALSE,
    has_final_exam           BOOLEAN NOT NULL DEFAULT TRUE,
    prerequisites            TEXT[] NOT NULL DEFAULT '{}',
    sequence_order           INTEGER,
    counts_for_certification BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Migration: add new columns if upgrading an existing DB
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sequence_order INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS counts_for_certification BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Modules ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    order_index      INTEGER NOT NULL DEFAULT 0,
    unlock_after_days INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Lessons ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id        UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    order_index      INTEGER NOT NULL DEFAULT 0,
    content_type     TEXT NOT NULL DEFAULT 'article',
    video_url        TEXT,
    video_id         TEXT,
    article_content  TEXT,
    audio_url        TEXT,
    audio_generated  BOOLEAN NOT NULL DEFAULT FALSE,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    has_quiz         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Quizzes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id           UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    quiz_type           TEXT NOT NULL DEFAULT 'lesson_quiz',
    title               TEXT NOT NULL DEFAULT '',
    questions           JSONB NOT NULL DEFAULT '[]',
    passing_score       INTEGER NOT NULL DEFAULT 70,
    time_limit_minutes  INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Quiz Submissions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id      TEXT NOT NULL,
    answers      JSONB NOT NULL DEFAULT '{}',
    score        INTEGER NOT NULL DEFAULT 0,
    passed       BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Learning Materials ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_materials (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id   UUID REFERENCES lessons(id) ON DELETE SET NULL,
    title       TEXT NOT NULL DEFAULT '',
    content     TEXT NOT NULL DEFAULT '',
    file_type   TEXT NOT NULL DEFAULT 'text',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User Stats (Gamification) ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT UNIQUE NOT NULL,   -- TEXT so "demo_user" works
    xp_total          INTEGER NOT NULL DEFAULT 0,
    daily_goal        INTEGER NOT NULL DEFAULT 30,
    current_streak    INTEGER NOT NULL DEFAULT 0,
    longest_streak    INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    badges            JSONB NOT NULL DEFAULT '[]',
    daily_xp          JSONB NOT NULL DEFAULT '{}',
    lessons_completed INTEGER NOT NULL DEFAULT 0,
    quizzes_passed    INTEGER NOT NULL DEFAULT 0,
    courses_completed INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Knowledge Levels ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_levels (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT NOT NULL,
    lesson_id         TEXT NOT NULL,
    knowledge_score   INTEGER NOT NULL DEFAULT 0,
    attempts          INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    correct_answers   INTEGER NOT NULL DEFAULT 0,
    wrong_topics      TEXT[] NOT NULL DEFAULT '{}',
    is_unlocked       BOOLEAN NOT NULL DEFAULT FALSE,
    best_score        INTEGER NOT NULL DEFAULT 0,
    last_attempt      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, lesson_id)
);

-- ── Learning Sessions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       TEXT NOT NULL,
    lesson_id     TEXT NOT NULL,
    course_id     TEXT,
    questions     JSONB NOT NULL DEFAULT '[]',
    intro         TEXT,
    tips          TEXT[] NOT NULL DEFAULT '{}',
    difficulty    TEXT NOT NULL DEFAULT 'medium',
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed     BOOLEAN NOT NULL DEFAULT FALSE,
    score         INTEGER,
    correct_count INTEGER,
    passed        BOOLEAN,
    completed_at  TIMESTAMPTZ,
    results       JSONB
);

-- ── AI-Generated Quizzes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_quizzes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL DEFAULT '',
    questions       JSONB NOT NULL DEFAULT '[]',
    difficulty      TEXT NOT NULL DEFAULT 'medium',
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_ai_generated BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Indexes (performance) ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_modules_course_id        ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id        ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id        ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id        ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_course_id      ON learning_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_lesson_id      ON learning_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id    ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_levels_user    ON knowledge_levels(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user   ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user    ON quiz_submissions(user_id);

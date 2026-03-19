-- ──────────────────────────────────────────────────────────────
-- Practice Content Tables (Duolingo-style)
-- Run this in Supabase SQL Editor
-- ──────────────────────────────────────────────────────────────

-- Stores one row per practice module (5 for the UX intro course)
CREATE TABLE IF NOT EXISTS practice_modules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_key          TEXT NOT NULL,          -- e.g. "ux-intro-1"
  module_order        INT  NOT NULL,
  title               TEXT NOT NULL,
  questions           JSONB NOT NULL,         -- full questions array
  question_count      INT,
  mastery_threshold   INT DEFAULT 70,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks each user's best score per module
CREATE TABLE IF NOT EXISTS practice_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,              -- TEXT to support "demo_user"
  module_id       UUID REFERENCES practice_modules(id) ON DELETE CASCADE,
  completed       BOOLEAN DEFAULT FALSE,
  best_score      INT DEFAULT 0,             -- percentage 0-100
  attempts        INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_modules_course   ON practice_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_practice_modules_key      ON practice_modules(module_key);
CREATE INDEX IF NOT EXISTS idx_practice_progress_user    ON practice_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_progress_module  ON practice_progress(module_id);

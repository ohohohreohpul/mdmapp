-- Resume & Career Feature Migration
-- Run this in the Supabase SQL Editor

-- 1. Add has_resume_setup flag to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS has_resume_setup BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Resume storage table
CREATE TABLE IF NOT EXISTS user_resumes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  resume_type   TEXT NOT NULL CHECK (resume_type IN ('uploaded', 'created')),
  file_path     TEXT,           -- storage path: {user_id}/{id}.pdf  (NOT signed url)
  file_name     TEXT,
  file_size     INTEGER,
  resume_data   JSONB,          -- structured JSON for created resumes
  ats_score     INTEGER CHECK (ats_score BETWEEN 0 AND 100),
  parsed_skills TEXT[],
  parsed_text   TEXT,
  parse_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (parse_status IN ('pending', 'success', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_resumes_user_id ON user_resumes(user_id);

-- 3. Cover letters table
CREATE TABLE IF NOT EXISTS user_cover_letters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL,
  company_name TEXT,
  position     TEXT,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON user_cover_letters(user_id);

-- 4. Optional: backfill existing users so they skip setup
-- Uncomment the line below if you want to skip setup for all existing accounts:
-- UPDATE users SET has_resume_setup = TRUE WHERE created_at < NOW();

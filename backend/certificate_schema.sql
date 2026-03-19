-- ============================================================
-- Mydemy Certificate System Schema
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS certificates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT        NOT NULL,
  cert_type         TEXT        NOT NULL CHECK (cert_type IN ('course', 'career')),
  course_id         UUID        REFERENCES courses(id) ON DELETE SET NULL,
  career_path       TEXT,
  course_title      TEXT,                      -- course name (course cert) or career path name (career cert)
  career_courses    TEXT[],                    -- list of course titles for career cert
  user_display_name TEXT        NOT NULL,
  issued_at         TIMESTAMPTZ DEFAULT NOW(),
  issue_month       INT,
  issue_year        INT,
  verification_code TEXT        UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_certs_user   ON certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_certs_code   ON certificates (verification_code);
CREATE INDEX IF NOT EXISTS idx_certs_course ON certificates (course_id);

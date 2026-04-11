-- Job listings table for Mydemy job board
-- Run this once in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS job_listings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT        UNIQUE,                      -- dedup key from source
  source          TEXT        NOT NULL,                    -- 'linkedin', 'indeed', etc.
  title           TEXT        NOT NULL,
  company         TEXT        NOT NULL,
  company_logo    TEXT,                                    -- logo URL (nullable)
  location        TEXT,
  location_type   TEXT        CHECK (location_type IN ('remote', 'hybrid', 'onsite', 'unknown')),
  salary_label    TEXT,                                    -- raw salary string e.g. "฿50k–฿80k"
  salary_min      INT,
  salary_max      INT,
  salary_currency TEXT        DEFAULT 'THB',
  url             TEXT        NOT NULL,
  description     TEXT,
  career_path     TEXT,                                    -- matches our PATHS: 'UX Design', etc.
  tags            TEXT[]      DEFAULT '{}',
  is_active       BOOLEAN     DEFAULT TRUE,
  posted_at       TIMESTAMPTZ,
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_career    ON job_listings (career_path);
CREATE INDEX IF NOT EXISTS idx_jobs_active    ON job_listings (is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_fetched   ON job_listings (fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_external  ON job_listings (external_id);

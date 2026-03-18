-- ============================================================
-- MIGRATION: Add authentication columns to users table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add auth-related columns to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash      TEXT,
    ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wp_id             INTEGER,
    ADD COLUMN IF NOT EXISTS display_name      TEXT,
    ADD COLUMN IF NOT EXISTS first_name        TEXT,
    ADD COLUMN IF NOT EXISTS last_name         TEXT,
    ADD COLUMN IF NOT EXISTS migrated_from_wp  BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast WP ID lookup during import
CREATE INDEX IF NOT EXISTS idx_users_wp_id ON users(wp_id);

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

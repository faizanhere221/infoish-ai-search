-- ============================================================================
-- ADMIN ROLE MIGRATION
-- ============================================================================
-- Run this in your Supabase SQL Editor BEFORE using the admin panel
-- ============================================================================

-- Step 1: Add role column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Step 2: Add check constraint
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS check_user_role;

ALTER TABLE users
  ADD CONSTRAINT check_user_role
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Step 3: Index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 4: Set existing 'admin' user_type accounts to admin role
UPDATE users SET role = 'admin' WHERE user_type = 'admin' AND role = 'user';

-- Step 5: Add is_featured flag to creators (for homepage featuring)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_creators_featured ON creators(is_featured) WHERE is_featured = TRUE;

-- ============================================================================
-- SETUP YOUR FIRST SUPER ADMIN
-- ============================================================================
-- Replace 'your-email@example.com' with your actual admin email, then run:
--
-- UPDATE users
-- SET role = 'super_admin'
-- WHERE email = 'your-email@example.com';
--
-- ============================================================================

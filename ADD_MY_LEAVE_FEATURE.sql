-- ================================================================
-- MY LEAVE FEATURE DATABASE MIGRATION
-- ================================================================
-- This migration adds:
-- 1. Gender field to profiles table
-- 2. "My Leave" leave type to database
-- Run this in Supabase SQL Editor

-- Step 1: Add gender column to profiles table
ALTER TABLE profiles 
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX idx_profiles_gender ON profiles(gender);

-- Step 2: Add "My Leave" leave type (max 1 per month = 12 per year)
INSERT INTO leave_types (name, max_per_year) 
VALUES ('My Leave', 12)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Verify the data
SELECT * FROM leave_types ORDER BY name;
SELECT COUNT(*) as total_profiles, 
       COUNT(gender) as profiles_with_gender,
       COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_employees,
       COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_employees
FROM profiles;

-- ================================================================
-- NOTES:
-- ================================================================
-- * Existing employees will have gender = NULL
-- * Admin must manually update gender for existing employees
-- * New employees will select gender during registration
-- * "My Leave" is only available for female employees
-- * Monthly limit: Max 1 "My Leave" per calendar month
-- * Yearly limit: Max 12 "My Leave" per year
-- ================================================================

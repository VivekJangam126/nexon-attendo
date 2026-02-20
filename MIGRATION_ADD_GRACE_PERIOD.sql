-- ============================================
-- MIGRATION: Add Grace Period and Strict Mode
-- ============================================
-- This migration adds grace_period_minutes and strict_mode columns
-- to the attendance_settings table for late marking functionality
--
-- Run this in Supabase SQL Editor if you already have the database set up
-- ============================================

-- Add grace_period_minutes column (default 15 minutes)
-- No maximum limit - admin can set any duration
ALTER TABLE attendance_settings 
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15 
CHECK (grace_period_minutes >= 0);

-- Add strict_mode column (default true)
ALTER TABLE attendance_settings 
ADD COLUMN IF NOT EXISTS strict_mode BOOLEAN DEFAULT true;

-- Update existing record to have grace period
UPDATE attendance_settings 
SET grace_period_minutes = 15, strict_mode = true
WHERE setting_name = 'default_attendance_window' 
AND grace_period_minutes IS NULL;

-- Verify the changes
SELECT * FROM attendance_settings;

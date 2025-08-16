-- Migration: Remove bio column from patients table
-- This removes the unnecessary bio field from patients as it's not needed for the search app

-- Remove the bio column from patients table
ALTER TABLE patients DROP COLUMN IF EXISTS bio;

-- Note: This migration only affects the patients table
-- The bio column remains in healthcareproviders table where it's needed
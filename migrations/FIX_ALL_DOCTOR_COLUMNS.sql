-- ============================================
-- QUICK FIX: Complete Doctors Table Schema
-- ============================================
-- Run this in Supabase SQL Editor to ensure ALL columns exist for adding doctors
-- This fixes all missing columns at once

-- ============================================
-- Add all required and optional columns
-- ============================================

-- Required fields
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);

-- Optional fields
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualifications TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS mental_health_specialties JSONB DEFAULT '[]'::jsonb;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- Set defaults for existing records
-- ============================================

UPDATE doctors 
SET full_name = COALESCE(full_name, 'Doctor ' || id::text)
WHERE full_name IS NULL;

UPDATE doctors 
SET email_address = COALESCE(email_address, 'doctor_' || id::text || '@example.com')
WHERE email_address IS NULL;

UPDATE doctors 
SET specialization = COALESCE(specialization, 'General Practice')
WHERE specialization IS NULL;

UPDATE doctors 
SET license_number = COALESCE(license_number, 'LIC-' || id::text)
WHERE license_number IS NULL;

UPDATE doctors 
SET is_active = COALESCE(is_active, true)
WHERE is_active IS NULL;

UPDATE doctors 
SET is_verified = COALESCE(is_verified, false)
WHERE is_verified IS NULL;

-- ============================================
-- Make required fields NOT NULL
-- ============================================

ALTER TABLE doctors ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE doctors ALTER COLUMN email_address SET NOT NULL;
ALTER TABLE doctors ALTER COLUMN specialization SET NOT NULL;

-- ============================================
-- Add unique constraints
-- ============================================

DO $$ 
BEGIN
    -- Email unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctors_email_address_key'
    ) THEN
        ALTER TABLE doctors 
        ADD CONSTRAINT doctors_email_address_key UNIQUE (email_address);
    END IF;
    
    -- License number unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctors_license_number_key'
    ) THEN
        ALTER TABLE doctors 
        ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number);
    END IF;
END $$;

-- ============================================
-- Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_doctors_email_address ON doctors(email_address);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_is_verified ON doctors(is_verified);
CREATE INDEX IF NOT EXISTS idx_doctors_mental_health_specialties ON doctors USING GIN (mental_health_specialties);

-- ============================================
-- Create/Update trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification
-- ============================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ All doctor columns added successfully!';
    RAISE NOTICE '✅ Required fields: full_name, email_address, specialization, license_number';
    RAISE NOTICE '✅ Optional fields: password_hash, phone_number, qualifications, bio, years_of_experience, profile_image_url';
    RAISE NOTICE '✅ Status fields: is_active, is_verified';
    RAISE NOTICE '✅ You can now add doctors without errors!';
END $$;



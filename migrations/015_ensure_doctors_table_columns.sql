-- Ensure all required columns exist in doctors table
-- This migration adds any missing columns that are used in the application

-- Add bio column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add qualifications column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS qualifications TEXT;

-- Add phone_number column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add years_of_experience column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;

-- Add consultation_fee column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2);

-- Add profile_image_url column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add is_active column if it doesn't exist (with default)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_verified column if it doesn't exist (with default)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add mental_health_specialties column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS mental_health_specialties JSONB DEFAULT '[]'::jsonb;

-- Add created_at column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column if it doesn't exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure full_name is NOT NULL (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'doctors' AND column_name = 'full_name' AND is_nullable = 'YES') THEN
        ALTER TABLE doctors ALTER COLUMN full_name SET NOT NULL;
    END IF;
END $$;

-- Ensure email_address is NOT NULL and UNIQUE
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'doctors' AND column_name = 'email_address') THEN
        -- Make sure it's NOT NULL
        ALTER TABLE doctors ALTER COLUMN email_address SET NOT NULL;
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'doctors_email_address_key'
        ) THEN
            ALTER TABLE doctors ADD CONSTRAINT doctors_email_address_key UNIQUE (email_address);
        END IF;
    END IF;
END $$;

-- Ensure specialization is NOT NULL
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'doctors' AND column_name = 'specialization' AND is_nullable = 'YES') THEN
        ALTER TABLE doctors ALTER COLUMN specialization SET NOT NULL;
    END IF;
END $$;

-- Ensure license_number is UNIQUE
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'doctors' AND column_name = 'license_number') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'doctors_license_number_key'
        ) THEN
            ALTER TABLE doctors ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number);
        END IF;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email_address);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_mental_health_specialties ON doctors USING GIN (mental_health_specialties);

-- Add comments to columns
COMMENT ON COLUMN doctors.bio IS 'Professional biography and background';
COMMENT ON COLUMN doctors.qualifications IS 'Educational qualifications and certifications';
COMMENT ON COLUMN doctors.phone_number IS 'Contact phone number';
COMMENT ON COLUMN doctors.years_of_experience IS 'Years of professional experience';
COMMENT ON COLUMN doctors.consultation_fee IS 'Fee per consultation session';
COMMENT ON COLUMN doctors.profile_image_url IS 'URL to doctor profile image';
COMMENT ON COLUMN doctors.is_active IS 'Whether the doctor is currently accepting new patients';
COMMENT ON COLUMN doctors.is_verified IS 'Whether the doctor credentials have been verified by admin';
COMMENT ON COLUMN doctors.mental_health_specialties IS 'Array of specific mental health issues/problems the doctor specializes in';


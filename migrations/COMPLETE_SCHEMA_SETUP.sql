-- ============================================
-- COMPLETE SCHEMA SETUP FOR SUPABASE
-- ============================================
-- Run this entire script in Supabase SQL Editor to set up all tables
-- This script is idempotent - safe to run multiple times

-- ============================================
-- STEP 1: Create helper function for updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- STEP 2: Create USERS table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER,
  gender VARCHAR(50),
  civil_status VARCHAR(50),
  address TEXT,
  contact_number VARCHAR(20),
  email_address VARCHAR(255) UNIQUE NOT NULL,
  emergency_contact_person_number TEXT,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Users trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Users comments
COMMENT ON TABLE users IS 'User information table with personal details and emergency contacts';
COMMENT ON COLUMN users.password_hash IS 'Hashed password for user authentication';
COMMENT ON COLUMN users.role IS 'User role: user, admin, or doctor';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active (default: true)';

-- ============================================
-- STEP 3: Create DOCTORS table
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  phone_number VARCHAR(20),
  specialization VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE,
  qualifications TEXT,
  bio TEXT,
  years_of_experience INTEGER,
  consultation_fee DECIMAL(10, 2),
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  mental_health_specialties JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all required columns exist (for existing tables)
DO $$
BEGIN
    -- Add all columns if they don't exist
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
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
    
    -- Set defaults for existing records
    UPDATE doctors SET full_name = COALESCE(full_name, 'Doctor ' || id::text) WHERE full_name IS NULL;
    UPDATE doctors SET email_address = COALESCE(email_address, 'doctor_' || id::text || '@example.com') WHERE email_address IS NULL;
    UPDATE doctors SET specialization = COALESCE(specialization, 'General Practice') WHERE specialization IS NULL;
    UPDATE doctors SET license_number = COALESCE(license_number, 'LIC-' || id::text) WHERE license_number IS NULL;
    UPDATE doctors SET is_active = COALESCE(is_active, true) WHERE is_active IS NULL;
    UPDATE doctors SET is_verified = COALESCE(is_verified, false) WHERE is_verified IS NULL;
    
    -- Make required fields NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'full_name' AND is_nullable = 'YES') THEN
        ALTER TABLE doctors ALTER COLUMN full_name SET NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'email_address' AND is_nullable = 'YES') THEN
        ALTER TABLE doctors ALTER COLUMN email_address SET NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'specialization' AND is_nullable = 'YES') THEN
        ALTER TABLE doctors ALTER COLUMN specialization SET NOT NULL;
    END IF;
    
    -- Add unique constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_email_address_key') THEN
        ALTER TABLE doctors ADD CONSTRAINT doctors_email_address_key UNIQUE (email_address);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_license_number_key') THEN
        ALTER TABLE doctors ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number);
    END IF;
    
    -- Create all indexes
    CREATE INDEX IF NOT EXISTS idx_doctors_email_address ON doctors(email_address);
    CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
    CREATE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);
    CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);
    CREATE INDEX IF NOT EXISTS idx_doctors_is_verified ON doctors(is_verified);
    CREATE INDEX IF NOT EXISTS idx_doctors_mental_health_specialties ON doctors USING GIN (mental_health_specialties);
END $$;

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email_address);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_mental_health_specialties ON doctors USING GIN (mental_health_specialties);

-- Doctors trigger
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Doctors comments
COMMENT ON TABLE doctors IS 'Doctor information table with professional details, credentials, and availability';
COMMENT ON COLUMN doctors.full_name IS 'Full name of the doctor';
COMMENT ON COLUMN doctors.email_address IS 'Unique email address for login and communication';
COMMENT ON COLUMN doctors.password_hash IS 'Hashed password for doctor authentication';
COMMENT ON COLUMN doctors.specialization IS 'Medical specialty or area of expertise';
COMMENT ON COLUMN doctors.license_number IS 'Medical license or registration number';
COMMENT ON COLUMN doctors.qualifications IS 'Educational qualifications and certifications';
COMMENT ON COLUMN doctors.bio IS 'Professional biography and background';
COMMENT ON COLUMN doctors.consultation_fee IS 'Fee per consultation session';
COMMENT ON COLUMN doctors.is_active IS 'Whether the doctor is currently accepting new patients';
COMMENT ON COLUMN doctors.is_verified IS 'Whether the doctor credentials have been verified by admin';
COMMENT ON COLUMN doctors.mental_health_specialties IS 'Array of specific mental health issues/problems the doctor specializes in';

-- ============================================
-- STEP 4: Create DOCTOR_SCHEDULES table
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Doctor schedules indexes
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- Doctor schedules trigger
DROP TRIGGER IF EXISTS update_doctor_schedules_updated_at ON doctor_schedules;
CREATE TRIGGER update_doctor_schedules_updated_at BEFORE UPDATE ON doctor_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Doctor schedules comments
COMMENT ON TABLE doctor_schedules IS 'Weekly schedule/availability for doctors';
COMMENT ON COLUMN doctor_schedules.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

-- ============================================
-- STEP 5: Create APPOINTMENTS table
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  appointment_type VARCHAR(50) DEFAULT 'Video Call',
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  session_link TEXT,
  meeting_room_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_appointment_time UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

-- Appointments trigger
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appointments comments
COMMENT ON TABLE appointments IS 'Appointments between users and doctors';
COMMENT ON COLUMN appointments.appointment_type IS 'Type of appointment: Video Call, In-Person, Phone Call';
COMMENT ON COLUMN appointments.status IS 'Appointment status: scheduled, confirmed, completed, cancelled, rescheduled';

-- ============================================
-- STEP 6: Create PAYMENTS table
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PHP',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  payment_intent_id VARCHAR(255),
  receipt_url TEXT,
  failure_reason TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10, 2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_refund CHECK (refund_amount IS NULL OR (refund_amount > 0 AND refund_amount <= amount)),
  CONSTRAINT payments_currency_php_only CHECK (currency = 'PHP')
);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_doctor_status ON payments(doctor_id, payment_status);

-- Payments trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payments comments
COMMENT ON TABLE payments IS 'Online payments for appointments';
COMMENT ON COLUMN payments.currency IS 'Payment currency - PHP (Philippine Peso) only';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used: stripe, paypal, credit_card, etc.';
COMMENT ON COLUMN payments.payment_status IS 'Payment status: pending, processing, completed, failed, refunded, cancelled';

-- ============================================
-- STEP 7: Create NOTIFICATIONS table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Notifications trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notifications comments
COMMENT ON TABLE notifications IS 'User notifications for appointments, payments, and system updates';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, appointment_accepted, appointment_cancelled, payment_confirmed, reminder';

-- ============================================
-- STEP 8: Create SETTINGS table
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  setting_category VARCHAR(50) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_category, setting_key)
);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(setting_category);
CREATE INDEX IF NOT EXISTS idx_settings_user_category ON settings(user_id, setting_category);

-- Settings trigger
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Settings comments
COMMENT ON TABLE settings IS 'User and clinic settings';
COMMENT ON COLUMN settings.setting_category IS 'Category: clinic_info, appointment_booking, patient_records, environment_support';
COMMENT ON COLUMN settings.setting_value IS 'Setting value in JSON format';

-- ============================================
-- STEP 9: Create CONSULTATION_FEES table
-- ============================================
CREATE TABLE IF NOT EXISTS consultation_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_type VARCHAR(50) NOT NULL DEFAULT 'Video Call',
  fee_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PHP',
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CONSTRAINT positive_fee_amount CHECK (fee_amount > 0),
  CONSTRAINT valid_effective_dates CHECK (
    effective_until IS NULL OR effective_until >= effective_from
  )
);

-- Consultation fees indexes
CREATE INDEX IF NOT EXISTS idx_consultation_fees_doctor_id ON consultation_fees(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_appointment_type ON consultation_fees(appointment_type);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_is_active ON consultation_fees(is_active);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_effective_dates ON consultation_fees(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_doctor_type_active ON consultation_fees(doctor_id, appointment_type, is_active);

-- Consultation fees trigger
DROP TRIGGER IF EXISTS update_consultation_fees_updated_at ON consultation_fees;
CREATE TRIGGER update_consultation_fees_updated_at BEFORE UPDATE ON consultation_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Consultation fees comments
COMMENT ON TABLE consultation_fees IS 'Consultation fees for doctors by appointment type with history tracking';
COMMENT ON COLUMN consultation_fees.appointment_type IS 'Type of appointment: Video Call, In-Person, Phone Call';
COMMENT ON COLUMN consultation_fees.fee_amount IS 'Fee amount in the specified currency';
COMMENT ON COLUMN consultation_fees.currency IS 'Currency code (default: PHP)';
COMMENT ON COLUMN consultation_fees.duration_minutes IS 'Consultation duration in minutes';
COMMENT ON COLUMN consultation_fees.is_active IS 'Whether this fee is currently active';
COMMENT ON COLUMN consultation_fees.effective_from IS 'Date when this fee becomes effective';
COMMENT ON COLUMN consultation_fees.effective_until IS 'Date when this fee expires (NULL = no expiration)';

-- Create function to get current active fee
CREATE OR REPLACE FUNCTION get_current_consultation_fee(
  p_doctor_id UUID,
  p_appointment_type VARCHAR(50) DEFAULT 'Video Call'
)
RETURNS TABLE (
  id UUID,
  doctor_id UUID,
  appointment_type VARCHAR(50),
  fee_amount DECIMAL(10, 2),
  currency VARCHAR(3),
  duration_minutes INTEGER,
  effective_from DATE,
  effective_until DATE,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cf.id,
    cf.doctor_id,
    cf.appointment_type,
    cf.fee_amount,
    cf.currency,
    cf.duration_minutes,
    cf.effective_from,
    cf.effective_until,
    cf.description
  FROM consultation_fees cf
  WHERE cf.doctor_id = p_doctor_id
    AND cf.appointment_type = p_appointment_type
    AND cf.is_active = true
    AND cf.effective_from <= CURRENT_DATE
    AND (cf.effective_until IS NULL OR cf.effective_until >= CURRENT_DATE)
  ORDER BY cf.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create view for current active fees
CREATE OR REPLACE VIEW current_consultation_fees AS
SELECT 
  cf.id,
  cf.doctor_id,
  d.full_name AS doctor_name,
  d.specialization,
  cf.appointment_type,
  cf.fee_amount,
  cf.currency,
  cf.duration_minutes,
  cf.description,
  cf.effective_from,
  cf.effective_until,
  cf.created_at,
  cf.updated_at
FROM consultation_fees cf
INNER JOIN doctors d ON cf.doctor_id = d.id
WHERE cf.is_active = true
  AND cf.effective_from <= CURRENT_DATE
  AND (cf.effective_until IS NULL OR cf.effective_until >= CURRENT_DATE);

-- ============================================
-- VERIFICATION: Check all tables were created
-- ============================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'doctors', 'doctor_schedules', 'appointments', 'payments', 'notifications', 'settings', 'consultation_fees')
ORDER BY table_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Schema setup completed successfully!';
    RAISE NOTICE 'All tables, indexes, triggers, and constraints have been created.';
END $$;


-- Make doctor_name column nullable in appointments table
-- Since we have doctor_id which references users table, doctor_name is redundant
-- but we'll make it nullable to avoid constraint violations

-- Check if doctor_name column exists and make it nullable
DO $$
BEGIN
  -- Check if doctor_name column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'doctor_name'
  ) THEN
    -- Make the column nullable
    ALTER TABLE appointments 
    ALTER COLUMN doctor_name DROP NOT NULL;
    
    -- Add comment
    COMMENT ON COLUMN appointments.doctor_name IS 
    'Doctor name (redundant - can be obtained from users table via doctor_id). Made nullable for backward compatibility.';
  END IF;
END $$;


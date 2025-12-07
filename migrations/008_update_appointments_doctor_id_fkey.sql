-- Update appointments table to reference users table instead of doctors table for doctor_id
-- This allows doctors from the users table (role='doctor') to be used

-- First, drop the existing foreign key constraint to doctors table
DO $$
BEGIN
  -- Drop the existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'appointments' 
    AND constraint_name = 'appointments_doctor_id_fkey'
  ) THEN
    ALTER TABLE appointments 
    DROP CONSTRAINT appointments_doctor_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraint to users table
DO $$
BEGIN
  -- Add foreign key constraint to users table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'appointments' 
    AND constraint_name = 'appointments_doctor_id_users_fkey'
  ) THEN
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_doctor_id_users_fkey 
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add a check constraint to ensure doctor_id only references users with role='doctor'
-- Note: This is optional but recommended for data integrity
DO $$
BEGIN
  -- Drop existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'appointments' 
    AND constraint_name = 'appointments_doctor_id_check'
  ) THEN
    ALTER TABLE appointments 
    DROP CONSTRAINT appointments_doctor_id_check;
  END IF;
  
  -- Add check constraint to ensure doctor_id references a user with role='doctor'
  -- Note: PostgreSQL doesn't support subqueries in CHECK constraints directly,
  -- so we'll use a trigger instead for validation
END $$;

-- Create a function to validate that doctor_id references a user with role='doctor'
CREATE OR REPLACE FUNCTION validate_doctor_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the doctor_id references a user with role='doctor'
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = NEW.doctor_id 
    AND role = 'doctor'
  ) THEN
    RAISE EXCEPTION 'doctor_id must reference a user with role=''doctor''';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate doctor role before insert or update
DROP TRIGGER IF EXISTS validate_doctor_role_trigger ON appointments;
CREATE TRIGGER validate_doctor_role_trigger
  BEFORE INSERT OR UPDATE OF doctor_id ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_doctor_role();

-- Add comment
COMMENT ON CONSTRAINT appointments_doctor_id_users_fkey ON appointments IS 
'Foreign key to users table. doctor_id must reference a user with role=''doctor''';


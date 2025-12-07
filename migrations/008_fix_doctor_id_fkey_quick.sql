-- Quick fix: Update appointments table foreign key to reference users table
-- Run this SQL directly in your database to fix the foreign key constraint error

-- Step 1: Drop the old foreign key constraint (if it exists)
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

-- Step 2: Add new foreign key constraint to users table
ALTER TABLE appointments 
ADD CONSTRAINT appointments_doctor_id_users_fkey 
FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Create trigger to validate doctor role (optional but recommended)
CREATE OR REPLACE FUNCTION validate_doctor_role()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS validate_doctor_role_trigger ON appointments;
CREATE TRIGGER validate_doctor_role_trigger
  BEFORE INSERT OR UPDATE OF doctor_id ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_doctor_role();


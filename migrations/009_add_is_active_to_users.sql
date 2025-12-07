-- Add is_active column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment to the column
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active (default: true)';

-- Create index on is_active for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update existing users to be active by default (if any exist)
UPDATE users SET is_active = true WHERE is_active IS NULL;


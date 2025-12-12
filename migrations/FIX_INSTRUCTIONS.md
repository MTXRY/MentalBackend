# Fix Doctors Table Schema

## Problem
If you're getting errors like "Could not find the 'bio' column" or other column errors, it means your Supabase database schema doesn't match what the application expects.

## Solution

### Option 1: Quick Fix (Recommended)
1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `FIX_DOCTORS_TABLE.sql`
6. Click **Run** (or press Ctrl+Enter)
7. Wait for the query to complete successfully

### Option 2: Run Individual Migrations
If you prefer to run migrations in order:
1. Run `003_create_doctors_table.sql` (if table doesn't exist)
2. Run `014_add_mental_health_specialties_to_doctors.sql`
3. Run `015_ensure_doctors_table_columns.sql`

## Verification

After running the fix, verify the table structure by running this query in Supabase SQL Editor:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;
```

You should see all these columns:
- id
- full_name
- email_address
- password_hash
- phone_number
- specialization
- license_number
- qualifications
- bio
- years_of_experience
- consultation_fee
- profile_image_url
- is_active
- is_verified
- mental_health_specialties
- created_at
- updated_at

## After Running the Fix

1. Restart your backend server if it's running
2. Try creating a doctor again through the admin panel
3. The error should be resolved!

## Notes

- The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times
- Existing data will not be affected
- The script will add default values where appropriate
- Indexes and constraints will be created automatically


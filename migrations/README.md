# Database Migrations

## Creating the Users Table

To create the users table in your Supabase database, follow these steps:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `001_create_users_table.sql`
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

### Table Structure

The `users` table includes:

- **id** (UUID, Primary Key) - Auto-generated unique identifier
- **full_name** (VARCHAR) - User's full name (required)
- **date_of_birth** (DATE) - Date of birth (required)
- **age** (INTEGER) - Age
- **gender** (VARCHAR) - Gender
- **civil_status** (VARCHAR) - Civil status (e.g., Single, Married, Divorced)
- **address** (TEXT) - Full address
- **contact_number** (VARCHAR) - Contact phone number
- **email_address** (VARCHAR) - Email address (required, unique)
- **emergency_contact_person_number** (TEXT) - Emergency contact information
- **created_at** (TIMESTAMP) - Auto-generated creation timestamp
- **updated_at** (TIMESTAMP) - Auto-updated modification timestamp

### Features

- Automatic UUID generation for primary key
- Unique constraint on email address
- Index on email for faster lookups
- Automatic timestamp management (created_at and updated_at)


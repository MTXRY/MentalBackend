# Complete Supabase Schema Setup Guide

## Quick Setup Instructions

### Step 1: Run the Complete Schema SQL

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `sndvbukdlkyiejqtbajr`

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Complete Schema Script**
   - Open the file: `COMPLETE_SCHEMA_SETUP.sql`
   - Copy the **entire contents** of the file
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)
   - Wait for the query to complete (should take a few seconds)

4. **Verify Success**
   - You should see a success message at the bottom
   - The script will output a table showing all created tables and their column counts

### Step 2: Configure Environment Variables

#### Backend (MentalBackend)

1. Create a `.env` file in the `MentalBackend` directory:
   ```bash
   cd MentalBackend
   cp .env.example .env
   ```

2. The `.env` file should contain:
   ```env
   SUPABASE_URL=https://sndvbukdlkyiejqtbajr.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZHZidWtkbGt5aWVqcXRiYWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Mzg1NDUsImV4cCI6MjA4MDMxNDU0NX0.7qD1G4Auzk94CmNqyABGpFWxz4S-M61GsQ47RfsghIU
   NEXT_PUBLIC_SUPABASE_URL=https://sndvbukdlkyiejqtbajr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZHZidWtkbGt5aWVqcXRiYWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Mzg1NDUsImV4cCI6MjA4MDMxNDU0NX0.7qD1G4Auzk94CmNqyABGpFWxz4S-M61GsQ47RfsghIU
   JWT_SECRET=your-secret-key-change-in-production
   PORT=4000
   NODE_ENV=development
   ```

#### Frontend (admin-dashboard-credibility)

1. Create a `.env.local` file in the `admin-dashboard-credibility` directory:
   ```bash
   cd admin-dashboard-credibility
   ```

2. Create `.env.local` with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://sndvbukdlkyiejqtbajr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZHZidWtkbGt5aWVqcXRiYWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Mzg1NDUsImV4cCI6MjA4MDMxNDU0NX0.7qD1G4Auzk94CmNqyABGpFWxz4S-M61GsQ47RfsghIU
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   ```

### Step 3: Verify Database Schema

Run this query in Supabase SQL Editor to verify all tables were created:

```sql
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'doctors', 'doctor_schedules', 'appointments', 'payments', 'notifications', 'settings')
ORDER BY table_name;
```

You should see 7 tables:
- users
- doctors
- doctor_schedules
- appointments
- payments
- notifications
- settings

### Step 4: Test the Connection

1. **Start the Backend Server:**
   ```bash
   cd MentalBackend
   npm install  # if not already done
   npm start
   ```

2. **Start the Frontend:**
   ```bash
   cd admin-dashboard-credibility
   npm install  # if not already done
   npm run dev
   ```

3. **Test Creating a Doctor:**
   - Open http://localhost:3000
   - Login to admin panel
   - Go to Doctors page
   - Click "Add Doctor"
   - Fill in the form and submit
   - Should successfully create a doctor in Supabase!

## Tables Created

### 1. **users**
- User accounts (patients, admins)
- Fields: id, full_name, email_address, password_hash, role, is_active, etc.

### 2. **doctors**
- Doctor profiles
- Fields: id, full_name, email_address, specialization, license_number, bio, etc.

### 3. **doctor_schedules**
- Doctor availability schedules
- Fields: id, doctor_id, day_of_week, start_time, end_time, etc.

### 4. **appointments**
- Patient appointments with doctors
- Fields: id, user_id, doctor_id, appointment_date, appointment_time, status, etc.

### 5. **payments**
- Payment records for appointments
- Fields: id, appointment_id, amount, currency (PHP), payment_status, etc.

### 6. **notifications**
- User notifications
- Fields: id, user_id, type, title, message, is_read, etc.

### 7. **settings**
- System and user settings
- Fields: id, user_id, setting_category, setting_key, setting_value, etc.

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the complete schema script
- Check that all tables were created using the verification query

### Error: "column does not exist"
- Run the `FIX_DOCTORS_TABLE.sql` script if you're getting doctor table errors
- Or re-run the `COMPLETE_SCHEMA_SETUP.sql` script

### Connection Errors
- Verify your `.env` files have the correct Supabase URL and key
- Make sure you're using the correct project credentials
- Check that your Supabase project is active

### Permission Errors
- Ensure your Supabase anon key has the correct permissions
- Check Row Level Security (RLS) policies if you have them enabled

## Next Steps

1. ✅ Run the schema setup script
2. ✅ Configure environment variables
3. ✅ Test creating a doctor
4. ✅ Test creating a user
5. ✅ Test booking an appointment
6. ✅ Set up Row Level Security (RLS) policies if needed for production

## Support

If you encounter any issues:
1. Check the Supabase dashboard logs
2. Check your backend server logs
3. Verify all environment variables are set correctly
4. Make sure all migrations ran successfully


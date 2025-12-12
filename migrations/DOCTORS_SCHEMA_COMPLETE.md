# Complete Doctors Table Schema

## All Columns Required for Adding a Doctor

### Required Fields (Must be provided)
1. **full_name** - VARCHAR(255) NOT NULL
2. **email_address** - VARCHAR(255) UNIQUE NOT NULL
3. **specialization** - VARCHAR(255) NOT NULL
4. **license_number** - VARCHAR(100) UNIQUE

### Optional Fields
5. **password_hash** - VARCHAR(255) - For authentication
6. **phone_number** - VARCHAR(20)
7. **qualifications** - TEXT
8. **bio** - TEXT
9. **years_of_experience** - INTEGER
10. **consultation_fee** - DECIMAL(10, 2) - Legacy field
11. **profile_image_url** - TEXT
12. **mental_health_specialties** - JSONB - Array of specialties

### Status Fields (with defaults)
13. **is_active** - BOOLEAN DEFAULT true
14. **is_verified** - BOOLEAN DEFAULT false

### System Fields (auto-generated)
15. **id** - UUID PRIMARY KEY (auto-generated)
16. **created_at** - TIMESTAMP (auto-generated)
17. **updated_at** - TIMESTAMP (auto-updated via trigger)

---

## Quick Fix

Run `FIX_ALL_DOCTOR_COLUMNS.sql` in Supabase SQL Editor to add all missing columns at once.

---

## Migration Files

1. **020_complete_doctors_table_schema.sql** - Complete migration with all columns
2. **FIX_ALL_DOCTOR_COLUMNS.sql** - Quick fix script (recommended)

---

## Verification

After running the migration, verify with:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;
```

You should see all 17 columns listed above.



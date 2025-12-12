# Consultation Fees Schema Documentation

## Overview

The `consultation_fees` table provides a flexible system for managing doctor consultation fees with support for:
- Different fees for different appointment types (Video Call, In-Person, Phone Call)
- Fee history tracking (when fees change over time)
- Effective date ranges
- Multiple active fees per doctor (one per appointment type)

## Table Structure

### `consultation_fees` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `doctor_id` | UUID | Foreign key to doctors table |
| `appointment_type` | VARCHAR(50) | Type: 'Video Call', 'In-Person', 'Phone Call' |
| `fee_amount` | DECIMAL(10, 2) | Fee amount (must be > 0) |
| `currency` | VARCHAR(3) | Currency code (default: 'PHP') |
| `duration_minutes` | INTEGER | Consultation duration (default: 60) |
| `is_active` | BOOLEAN | Whether this fee is currently active |
| `effective_from` | DATE | When this fee becomes effective |
| `effective_until` | DATE | When this fee expires (NULL = no expiration) |
| `description` | TEXT | Optional description of the service |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `created_by` | UUID | User (admin) who created this fee |

## Features

### 1. Multiple Appointment Types
Each doctor can have different fees for different appointment types:
- Video Call: ₱500.00
- In-Person: ₱800.00
- Phone Call: ₱400.00

### 2. Fee History
The system tracks fee changes over time. When a new fee is created:
- Old active fees are automatically deactivated
- Historical fees remain in the database for reference
- You can query fee history for any doctor

### 3. Effective Date Ranges
Fees can be scheduled for future dates:
- Set `effective_from` to a future date
- Set `effective_until` to schedule fee changes
- System automatically uses the correct fee based on current date

### 4. Automatic Fee Management
- Trigger automatically deactivates old fees when new ones are created
- Ensures only one active fee per doctor/appointment type at a time
- Maintains data integrity

## Database Functions

### `get_current_consultation_fee(doctor_id, appointment_type)`

Returns the current active consultation fee for a doctor and appointment type.

**Usage:**
```sql
SELECT * FROM get_current_consultation_fee(
  'doctor-uuid-here'::UUID,
  'Video Call'
);
```

## Views

### `current_consultation_fees`

A view showing all currently active consultation fees with doctor information.

**Usage:**
```sql
SELECT * FROM current_consultation_fees
WHERE doctor_id = 'doctor-uuid-here';
```

## API Endpoints

### Get Current Fees
```
GET /api/consultation-fees/current
GET /api/consultation-fees/current?doctor_id=xxx&appointment_type=Video Call
```

### Get Doctor Fees
```
GET /api/consultation-fees/doctor/:doctorId
GET /api/consultation-fees/doctor/:doctorId?appointment_type=Video Call&include_inactive=true
```

### Get Current Fee for Doctor
```
GET /api/consultation-fees/doctor/:doctorId/current?appointment_type=Video Call
```

### Create Fee (Authenticated)
```
POST /api/consultation-fees/doctor/:doctorId
Body: {
  "appointment_type": "Video Call",
  "fee_amount": 500.00,
  "currency": "PHP",
  "duration_minutes": 60,
  "effective_from": "2024-01-01",
  "description": "Standard video consultation"
}
```

### Update Fee (Authenticated)
```
PUT /api/consultation-fees/:feeId
Body: {
  "fee_amount": 600.00,
  "is_active": true
}
```

### Deactivate Fee (Authenticated)
```
DELETE /api/consultation-fees/:feeId
```

## Migration Files

1. **016_create_consultation_fees_table.sql** - Creates the table, functions, triggers, and views
2. **017_sync_doctors_consultation_fees.sql** - Syncs existing fees from doctors table

## Usage Examples

### Example 1: Create a fee for Video Call
```javascript
POST /api/consultation-fees/doctor/123e4567-e89b-12d3-a456-426614174000
{
  "appointment_type": "Video Call",
  "fee_amount": 500.00,
  "currency": "PHP",
  "duration_minutes": 60,
  "description": "Standard video consultation"
}
```

### Example 2: Create different fees for different appointment types
```javascript
// Video Call
POST /api/consultation-fees/doctor/123e4567-e89b-12d3-a456-426614174000
{
  "appointment_type": "Video Call",
  "fee_amount": 500.00
}

// In-Person
POST /api/consultation-fees/doctor/123e4567-e89b-12d3-a456-426614174000
{
  "appointment_type": "In-Person",
  "fee_amount": 800.00
}

// Phone Call
POST /api/consultation-fees/doctor/123e4567-e89b-12d3-a456-426614174000
{
  "appointment_type": "Phone Call",
  "fee_amount": 400.00
}
```

### Example 3: Update fee (creates new active fee, deactivates old one)
```javascript
PUT /api/consultation-fees/doctor/123e4567-e89b-12d3-a456-426614174000
{
  "appointment_type": "Video Call",
  "fee_amount": 600.00,  // New fee amount
  "effective_from": "2024-02-01"  // Effective from Feb 1
}
```

## Integration with Existing System

The consultation fees table works alongside the existing `doctors.consultation_fee` field:
- The `doctors.consultation_fee` field is kept for backward compatibility
- New fees should be managed through the `consultation_fees` table
- Migration 017 syncs existing fees from doctors table to consultation_fees table

## Benefits

1. **Flexibility**: Different fees for different appointment types
2. **History**: Track fee changes over time
3. **Scheduling**: Schedule fee changes for future dates
4. **Audit Trail**: Know who created/updated fees and when
5. **Data Integrity**: Automatic management of active/inactive fees

## Next Steps

1. Run migration `016_create_consultation_fees_table.sql` in Supabase
2. Run migration `017_sync_doctors_consultation_fees.sql` to sync existing fees
3. Update payment logic to use `get_current_consultation_fee()` function
4. Update frontend to display fees by appointment type


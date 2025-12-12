# Complete API Documentation

Complete backend API documentation for all tables in the schema.

## Base URL
All endpoints are prefixed with `/api`

## Authentication
Most endpoints require JWT authentication. Include token in header:
```
Authorization: Bearer <token>
```

---

## 📋 USERS

### Get All Users
```
GET /api/users
GET /api/users?search=john&role=user&is_active=true&page=1&limit=20
```

### Get User by ID
```
GET /api/users/:id
```

### Create User
```
POST /api/users
Body: {
  "full_name": "John Doe",
  "date_of_birth": "1990-01-15",
  "email_address": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Update User
```
PUT /api/users/:id
```

### Delete User
```
DELETE /api/users/:id
```

### Login
```
POST /api/users/login
Body: {
  "email_address": "john@example.com",
  "password": "password123"
}
```

---

## 👨‍⚕️ DOCTORS

### Get All Doctors
```
GET /api/doctors
GET /api/doctors?specialization=Psychiatry&is_verified=true
```

### Get Doctor by ID
```
GET /api/doctors/:id
```

### Create Doctor
```
POST /api/doctors/create
Body: {
  "full_name": "Dr. Jane Smith",
  "email_address": "jane@example.com",
  "specialization": "Psychiatry",
  "license_number": "LIC-2024-001"
}
```

### Update Doctor
```
PUT /api/doctors/:id
```

### Delete Doctor
```
DELETE /api/doctors/:id
```

### Doctor Login
```
POST /api/doctors/login
```

---

## 📅 APPOINTMENTS

### Get All Appointments (Admin)
```
GET /api/appointments
GET /api/appointments?status=scheduled&upcoming=true
```

### Get Appointments by User ID
```
GET /api/appointments/user/:userId
GET /api/appointments/user/:userId?status=confirmed&upcoming=true
```

### Get Appointments by Doctor ID
```
GET /api/appointments/doctor/:doctorId
```

### Get Appointment by ID
```
GET /api/appointments/:id
```

### Create Appointment
```
POST /api/appointments
Body: {
  "doctor_id": "uuid",
  "appointment_date": "2024-02-15",
  "appointment_time": "10:00:00",
  "appointment_type": "Video Call",
  "duration_minutes": 60,
  "notes": "Follow-up appointment"
}
```

### Update Appointment
```
PUT /api/appointments/:id
Body: {
  "status": "confirmed",
  "notes": "Updated notes"
}
```

### Cancel Appointment
```
DELETE /api/appointments/:id
```

---

## 📆 DOCTOR SCHEDULES

### Get All Schedules
```
GET /api/doctor-schedules
GET /api/doctor-schedules?doctor_id=uuid&day_of_week=1&is_available=true
```

### Get Schedule by ID
```
GET /api/doctor-schedules/:id
```

### Get Schedules for Doctor
```
GET /api/doctor-schedules/doctor/:doctorId
GET /api/doctor-schedules/doctor/:doctorId?is_available=true
```

### Create Schedule
```
POST /api/doctor-schedules
Body: {
  "doctor_id": "uuid",
  "day_of_week": 1,  // 0=Sunday, 6=Saturday
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "is_available": true
}
```

### Update Schedule
```
PUT /api/doctor-schedules/:id
```

### Delete Schedule
```
DELETE /api/doctor-schedules/:id
```

---

## 🔔 NOTIFICATIONS

### Get All Notifications (Admin)
```
GET /api/notifications-simple
GET /api/notifications-simple?user_id=uuid&status=unread&page=1
```

### Get Notifications for User
```
GET /api/notifications-simple/user/:userId
GET /api/notifications-simple/user/:userId?status=unread
```

### Get Notification by ID
```
GET /api/notifications-simple/:id
```

### Create Notification
```
POST /api/notifications-simple
Body: {
  "user_id": "uuid",
  "message": "Your appointment has been confirmed",
  "status": "unread"
}
```

### Update Notification
```
PUT /api/notifications-simple/:id
```

### Mark as Read
```
PATCH /api/notifications-simple/:id/read
```

### Delete Notification
```
DELETE /api/notifications-simple/:id
```

---

## 👤 PROFILES

### Get All Profiles (Admin)
```
GET /api/profiles
GET /api/profiles?search=john&is_archived=false&page=1
```

### Get Profile by ID
```
GET /api/profiles/:id
```

### Create Profile
```
POST /api/profiles
Body: {
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "contact": "+1234567890",
  "address1": "123 Main St",
  "address2": "Apt 4B"
}
```

### Update Profile
```
PUT /api/profiles/:id
```

### Archive Profile (Soft Delete)
```
DELETE /api/profiles/:id
```

### Restore Profile
```
PATCH /api/profiles/:id/restore
```

---

## 👥 TEAM MEMBERS

### Get All Team Members (Admin)
```
GET /api/team-members
GET /api/team-members?search=john&role=admin&page=1
```

### Get Team Member by ID
```
GET /api/team-members/:id
```

### Create Team Member
```
POST /api/team-members
Body: {
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "age": 30,
  "phone": "+1234567890",
  "role": "admin"  // admin, user, doctor
}
```

### Update Team Member
```
PUT /api/team-members/:id
```

### Delete Team Member
```
DELETE /api/team-members/:id
```

---

## 💰 CONSULTATION FEES

### Get Current Fees
```
GET /api/consultation-fees/current
GET /api/consultation-fees/current?doctor_id=uuid&appointment_type=Video Call
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

### Create Fee
```
POST /api/consultation-fees/doctor/:doctorId
Body: {
  "appointment_type": "Video Call",
  "fee_amount": 500.00,
  "currency": "PHP",
  "duration_minutes": 60,
  "effective_from": "2024-01-01"
}
```

### Update Fee
```
PUT /api/consultation-fees/:feeId
```

### Delete Fee
```
DELETE /api/consultation-fees/:feeId
```

---

## 👨‍💼 ADMIN

### Dashboard Statistics
```
GET /api/admin/dashboard/stats
```

### User Management
```
GET /api/admin/users
GET /api/admin/users/:id
POST /api/admin/users
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
PATCH /api/admin/users/:id/status
PATCH /api/admin/users/:id/role
```

### Doctor Management
```
GET /api/admin/doctors
GET /api/admin/doctors/:id
POST /api/admin/doctors
PUT /api/admin/doctors/:id
DELETE /api/admin/doctors/:id
PATCH /api/admin/doctors/:id/verification
PATCH /api/admin/doctors/:id/status
```

---

## 📊 PAYMENTS

### Get All Payments
```
GET /api/payments
```

### Get Payment by ID
```
GET /api/payments/:id
```

### Initialize Payment
```
POST /api/payments/initialize
```

---

## ⚙️ SETTINGS

### Get Settings
```
GET /api/settings
GET /api/settings?user_id=uuid&setting_category=clinic_info
```

### Create/Update Setting
```
POST /api/settings
PUT /api/settings/:id
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...},
  "count": 10,
  "total": 100,
  "page": 1,
  "limit": 50
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (Authentication Required)
- `403` - Forbidden (Admin Access Required)
- `404` - Not Found
- `409` - Conflict (Duplicate Entry)
- `500` - Internal Server Error

---

## Notes

1. All timestamps are in ISO 8601 format
2. UUIDs are used for primary keys
3. Pagination defaults: page=1, limit=50
4. Search is case-insensitive and supports partial matches
5. Password fields are never returned in responses
6. Soft deletes are used where applicable (archived flag)


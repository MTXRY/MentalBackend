# Admin API Documentation

Complete API documentation for admin functions to manage users and doctors.

## Authentication

All admin endpoints require:
1. **Authentication**: Valid JWT token in `Authorization: Bearer <token>` header
2. **Authorization**: User must have `role: 'admin'`

## Base URL

All admin endpoints are prefixed with `/api/admin`

---

## Dashboard & Statistics

### Get Dashboard Statistics
```
GET /api/admin/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totals": {
      "users": 150,
      "doctors": 25,
      "appointments": 500,
      "payments": 450
    },
    "active": {
      "users": 140,
      "doctors": 20,
      "verifiedDoctors": 18
    },
    "recent": {
      "appointmentsLast7Days": 45
    },
    "revenue": {
      "total": 225000.00,
      "currency": "PHP"
    }
  }
}
```

---

## User Management

### Get All Users
```
GET /api/admin/users
```

**Query Parameters:**
- `search` (string) - Search in name, email, or contact number
- `role` (string) - Filter by role: 'user', 'admin', 'doctor'
- `is_active` (boolean) - Filter by active status
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 50)
- `sort_by` (string) - Field to sort by (default: 'created_at')
- `sort_order` (string) - 'asc' or 'desc' (default: 'desc')

**Example:**
```
GET /api/admin/users?search=john&role=user&is_active=true&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "count": 20,
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "data": [...]
}
```

### Get User by ID
```
GET /api/admin/users/:id
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    ...
  }
}
```

### Create User
```
POST /api/admin/users
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "date_of_birth": "1990-01-15",
  "email_address": "john@example.com",
  "password": "password123",
  "role": "user",
  "is_active": true,
  "contact_number": "+1234567890",
  "gender": "Male",
  "civil_status": "Single",
  "address": "123 Main St"
}
```

**Required Fields:** `full_name`, `date_of_birth`, `email_address`

### Update User
```
PUT /api/admin/users/:id
```

**Request Body:** (All fields optional)
```json
{
  "full_name": "John Doe Updated",
  "email_address": "newemail@example.com",
  "role": "admin",
  "is_active": false,
  "password": "newpassword123"
}
```

### Delete User
```
DELETE /api/admin/users/:id
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {...}
}
```

### Toggle User Status (Activate/Deactivate)
```
PATCH /api/admin/users/:id/status
```

**Request Body:**
```json
{
  "is_active": false
}
```

### Change User Role
```
PATCH /api/admin/users/:id/role
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Valid Roles:** `user`, `admin`, `doctor`

---

## Doctor Management

### Get All Doctors
```
GET /api/admin/doctors
```

**Query Parameters:**
- `search` (string) - Search in name, email, or specialization
- `specialization` (string) - Filter by specialization
- `is_active` (boolean) - Filter by active status
- `is_verified` (boolean) - Filter by verification status
- `mental_health_specialty` (string) - Filter by mental health specialty
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 50)
- `sort_by` (string) - Field to sort by (default: 'created_at')
- `sort_order` (string) - 'asc' or 'desc' (default: 'desc')

**Example:**
```
GET /api/admin/doctors?specialization=Psychiatry&is_verified=true&page=1
```

### Get Doctor by ID
```
GET /api/admin/doctors/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor retrieved successfully",
  "data": {
    "id": "uuid",
    "full_name": "Dr. Jane Smith",
    "email_address": "jane@example.com",
    "specialization": "Psychiatry",
    "is_verified": true,
    "is_active": true,
    ...
  }
}
```

### Create Doctor
```
POST /api/admin/doctors
```

**Request Body:**
```json
{
  "full_name": "Dr. Jane Smith",
  "email_address": "jane@example.com",
  "password": "password123",
  "specialization": "Psychiatry",
  "license_number": "LIC-2024-001",
  "phone_number": "+1234567890",
  "qualifications": "MD, PhD",
  "bio": "Experienced psychiatrist...",
  "years_of_experience": 10,
  "consultation_fee": 500.00,
  "mental_health_specialties": ["Anxiety", "Depression"],
  "is_active": true,
  "is_verified": false
}
```

**Required Fields:** `full_name`, `email_address`, `specialization`, `license_number`

### Update Doctor
```
PUT /api/admin/doctors/:id
```

**Request Body:** (All fields optional)
```json
{
  "full_name": "Dr. Jane Smith Updated",
  "specialization": "Clinical Psychology",
  "is_verified": true,
  "is_active": true,
  "consultation_fee": 600.00
}
```

### Delete Doctor
```
DELETE /api/admin/doctors/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor deleted successfully",
  "data": {...}
}
```

### Toggle Doctor Verification
```
PATCH /api/admin/doctors/:id/verification
```

**Request Body:**
```json
{
  "is_verified": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor verified successfully",
  "data": {...}
}
```

### Toggle Doctor Status (Activate/Deactivate)
```
PATCH /api/admin/doctors/:id/status
```

**Request Body:**
```json
{
  "is_active": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor deactivated successfully",
  "data": {...}
}
```

---

## Error Responses

All endpoints return consistent error responses:

**401 Unauthorized:**
```json
{
  "error": "Authentication Failed",
  "message": "No token provided. Please login first."
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Admin access required."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "User not found",
  "message": "No user found with ID: xxx"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Required fields: full_name, email_address"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "Email already exists",
  "message": "A user with this email already exists"
}
```

---

## Usage Examples

### Example 1: Get Dashboard Stats
```javascript
const response = await fetch('http://localhost:4000/api/admin/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const data = await response.json();
```

### Example 2: Create a User
```javascript
const response = await fetch('http://localhost:4000/api/admin/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'John Doe',
    date_of_birth: '1990-01-15',
    email_address: 'john@example.com',
    password: 'password123',
    role: 'user'
  })
});
```

### Example 3: Verify a Doctor
```javascript
const response = await fetch(`http://localhost:4000/api/admin/doctors/${doctorId}/verification`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_verified: true
  })
});
```

### Example 4: Search Users
```javascript
const response = await fetch('http://localhost:4000/api/admin/users?search=john&role=user&page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

---

## Notes

1. All admin endpoints require authentication and admin role
2. Password fields are automatically hashed before storage
3. Email addresses and license numbers must be unique
4. Pagination is available for list endpoints
5. Search functionality supports partial matches
6. All timestamps are in ISO 8601 format
7. Password hashes are never returned in responses


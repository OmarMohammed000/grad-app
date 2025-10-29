# User Management & Admin API Documentation

## Overview

This implementation adds comprehensive user self-management and admin user management capabilities to the Hunter Game backend.

## What Was Added

### Database Changes
1. **Migration**: `20251023000000-16-add-role-to-users.js`
   - Adds `role` column to `users` table (STRING, default: 'user')
   - Adds index on `role` for performance
   - Values: 'user' | 'admin'

2. **Seeder**: `20251023000000-create-admin-user.js`
   - Creates initial admin account
   - **Email**: `admin@huntergame.com`
   - **Password**: `Admin@12345`
   - ⚠️ **CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!**

### Authentication Updates
1. **JWT Payload Enhancement**
   - Access and refresh tokens now include `role` field
   - Controllers updated: `login.js`, `refreshToken.js`

2. **New Middleware**: `requireAdmin.js`
   - Verifies user has admin role
   - Used in admin routes for authorization
   - Returns 403 if user is not admin

### User Routes (`/users`)
Self-service endpoints for authenticated users.

#### Public Routes
- `GET /users/:id/profile` - View public user profile

#### Authenticated Routes (require Bearer token)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update current user profile
- `PUT /users/me/password` - Change password
- `DELETE /users/me` - Deactivate account (soft delete)

### Admin Routes (`/admin`)
All admin routes require authentication AND admin role.

#### User Management
- `GET /admin/users` - List all users (with pagination & search)
- `GET /admin/users/:id` - Get user details
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Deactivate user (soft delete)
- `PATCH /admin/users/:id/role` - Change user role

---

## Setup & Deployment

### 1. Run Migration & Seeder

```bash
cd backend

# Run migration to add role column
npx sequelize-cli db:migrate

# Run seeder to create admin user
npx sequelize-cli db:seed --seed 20251023000000-create-admin-user.js
```

### 2. Login as Admin

```bash
POST /auth/login
{
  "email": "admin@huntergame.com",
  "password": "Admin@12345"
}
```

**Response includes:**
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "admin@huntergame.com",
    "displayName": "System Admin",
    "role": "admin",
    ...
  }
}
```

### 3. Change Admin Password Immediately

```bash
PUT /users/me/password
Authorization: Bearer <accessToken>
{
  "currentPassword": "Admin@12345",
  "newPassword": "YourSecurePassword123!"
}
```

---

## API Endpoints Reference

### User Self-Service

#### Get My Profile
```http
GET /users/me
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "isActive": true,
    "lastLogin": "2025-10-23T...",
    "createdAt": "2025-10-23T...",
    "profile": {
      "displayName": "Hunter",
      "avatarUrl": null,
      "bio": null,
      ...
    },
    "character": {
      "level": 5,
      "totalXp": 1250,
      "rank": { "name": "D-Rank", "color": "#4CAF50" }
    }
  }
}
```

#### Update My Profile
```http
PUT /users/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "displayName": "Pro Hunter",
  "avatarUrl": "https://...",
  "bio": "I love challenges",
  "timezone": "America/New_York",
  "theme": "dark",
  "notificationsEnabled": true
}
```

#### Change Password
```http
PUT /users/me/password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456!"
}
```

#### Deactivate Account
```http
DELETE /users/me
Authorization: Bearer <accessToken>
```

Sets `isActive=false` and clears tokens.

#### View Public Profile
```http
GET /users/:id/profile
```

Returns public profile only if `isPublicProfile=true`.

---

### Admin User Management

All admin endpoints require:
- `Authorization: Bearer <accessToken>` 
- User must have `role='admin'`

#### List Users
```http
GET /admin/users?page=1&limit=20&q=search&role=admin&isActive=true&sortBy=createdAt&sortOrder=DESC
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `q` - Search by email or displayName
- `role` - Filter by role ('user' | 'admin')
- `isActive` - Filter by active status (true | false)
- `sortBy` - Sort field (default: 'createdAt')
- `sortOrder` - Sort direction ('ASC' | 'DESC')

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Hunter",
      "role": "user",
      "isActive": true,
      "lastLogin": "2025-10-23T...",
      "level": 5,
      "rank": { "name": "D-Rank", "color": "#4CAF50" }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Get User Details
```http
GET /admin/users/:id
Authorization: Bearer <adminToken>
```

Returns full user object including all profile and character data.

#### Create User
```http
POST /admin/users
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "displayName": "New Hunter",
  "role": "user"
}
```

Creates user with profile and character. Role defaults to 'user'.

#### Update User
```http
PUT /admin/users/:id
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "email": "updated@example.com",
  "isActive": true,
  "role": "admin",
  "displayName": "Updated Name"
}
```

- Can update email, isActive, role, displayName
- Prevents removing last admin
- Validates email uniqueness

#### Delete User (Deactivate)
```http
DELETE /admin/users/:id
Authorization: Bearer <adminToken>
```

Soft deletes user (sets `isActive=false`).

**Protections:**
- Cannot delete yourself
- Cannot delete last admin

#### Change User Role
```http
PATCH /admin/users/:id/role
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "role": "admin"
}
```

Promotes user to admin or demotes to user.

**Protection:**
- Cannot demote last admin

---

## Security Features

### Admin Protections
1. **Last Admin Protection**: Cannot delete or demote the last admin
2. **Self-Deletion Prevention**: Admin cannot delete their own account
3. **Role Validation**: Only 'user' and 'admin' roles allowed
4. **DB Lookup**: requireAdmin middleware fetches role from DB (no JWT tampering)

### User Protections
1. **Password Validation**: Minimum 6 characters
2. **Email Validation**: Regex check for valid format
3. **OAuth Account Protection**: Cannot change password on OAuth-only accounts
4. **Soft Deletes**: Users are deactivated, not deleted (data preserved)

### Token Security
1. **Short Access Tokens**: 15 minutes expiry
2. **Refresh Token Rotation**: New refresh token on every refresh
3. **Hashed Refresh Tokens**: Stored as SHA-256 hash in DB
4. **Role in JWT**: Role included in payload for fast authorization

---

## Activity Logging

All admin actions are logged in `activity_logs` table:
- `user_created_by_admin`
- `user_updated_by_admin`
- `user_deleted_by_admin`
- `role_changed_by_admin`
- `password_changed`
- `account_deactivated`

---

## Testing Guide

### 1. Test User Registration (Existing)
```bash
POST /auth/register
{
  "email": "test@example.com",
  "password": "Test123",
  "displayName": "Test User"
}
```

### 2. Test User Login
```bash
POST /auth/login
{
  "email": "test@example.com",
  "password": "Test123"
}
```

Verify response includes `"role": "user"`.

### 3. Test User Self-Service
```bash
# Get profile
GET /users/me
Authorization: Bearer <userToken>

# Update profile
PUT /users/me
Authorization: Bearer <userToken>
{ "displayName": "Updated Name" }
```

### 4. Test Admin Access Denial (Normal User)
```bash
GET /admin/users
Authorization: Bearer <userToken>
```

Should return `403 Forbidden`.

### 5. Test Admin Login
```bash
POST /auth/login
{
  "email": "admin@huntergame.com",
  "password": "Admin@12345"
}
```

Verify response includes `"role": "admin"`.

### 6. Test Admin Endpoints
```bash
# List users
GET /admin/users
Authorization: Bearer <adminToken>

# Create user
POST /admin/users
Authorization: Bearer <adminToken>
{
  "email": "newadmin@example.com",
  "password": "Secure123",
  "role": "admin"
}

# Promote user to admin
PATCH /admin/users/:id/role
Authorization: Bearer <adminToken>
{ "role": "admin" }
```

### 7. Test Last Admin Protection
```bash
# Try to demote yourself (last admin)
PATCH /admin/users/:yourId/role
Authorization: Bearer <adminToken>
{ "role": "user" }
```

Should return `400 Bad Request`.

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (not admin or account inactive) |
| 404 | Not Found (user/resource not found) |
| 409 | Conflict (email already exists) |
| 500 | Internal Server Error |

---

## Production Checklist

- [ ] Run migrations on production database
- [ ] Run admin seeder
- [ ] Change admin password immediately
- [ ] Set `NODE_ENV=production` in environment
- [ ] Verify JWT secrets are strong & unique
- [ ] Enable CORS only for trusted origins
- [ ] Set up HTTPS/TLS
- [ ] Review activity logs regularly
- [ ] Implement rate limiting on auth endpoints
- [ ] Set up monitoring/alerting for admin actions

---

## Future Enhancements (Optional)

- Password reset via email
- 2FA for admin accounts
- Audit trail dashboard
- Bulk user operations
- User export (CSV/JSON)
- User import
- Role-based permissions (granular)
- User suspension with auto-expiry
- Email verification
- Account recovery flow

---

## Support

For issues or questions, check:
1. Activity logs for audit trail
2. Backend console for error messages
3. Database migrations status: `npx sequelize-cli db:migrate:status`

---

**Created:** October 23, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

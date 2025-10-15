# Authentication System Documentation

## Overview
This authentication system follows the same pattern as your taskApp but is adapted for the grad-app's gamification features.

## Key Differences Between TaskApp and Grad-App Auth

### 1. **Database Schema Differences**

#### TaskApp Schema:
- Simple `Users` table with basic fields (name, email, password_hash, refresh_token)
- Minimal user data

#### Grad-App Schema:
- **users** table - Authentication data (email, password, googleId, isActive, lastLogin, refreshToken)
- **user_profiles** table - User profile settings (displayName, avatar, preferences)
- **characters** table - Gamification data (level, XP, rank, streaks, stats)
- **ranks** table - Rank system (E-Rank through National Level)
- **activity_logs** table - Comprehensive activity tracking

### 2. **Registration Process**

#### TaskApp:
```javascript
// Single table insert
INSERT INTO "Users" (name, email, password_hash)
```

#### Grad-App:
```javascript
// Transaction with multiple related records
1. Create user in 'users' table
2. Create user_profile with default settings
3. Create character (starts at E-Rank, Level 1)
4. Log registration activity
```

**Key Enhancement**: Grad-app uses database transactions to ensure all related records are created atomically.

### 3. **Login Response**

#### TaskApp:
```json
{
  "accessToken": "jwt_token"
}
```

#### Grad-App:
```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Hunter",
    "level": 1,
    "currentXp": 0,
    "totalXp": 0,
    "rank": {
      "name": "E-Rank",
      "color": "#808080"
    }
  }
}
```

**Key Enhancement**: Grad-app returns user profile and character data with the token for immediate UI rendering.

### 4. **Field Names**

#### TaskApp uses:
- `name` (in Users table)
- `password_hash`
- `refresh_token`

#### Grad-App uses:
- `displayName` (in user_profiles table)
- `password` (hashed)
- `refreshToken` (camelCase)

### 5. **Security Enhancements in Grad-App**

1. **Account Status Check**: Verifies `isActive` field during login
2. **Password Validation**: Minimum 6 characters enforced
3. **Email Validation**: Regex validation for email format
4. **Transaction Safety**: All multi-table operations use transactions
5. **Error Messages**: Conditional error details (only in development mode)

### 6. **Mobile-Specific Considerations**

Both implementations are mobile-friendly:

#### Shared Features:
- ✅ HttpOnly cookies for refresh tokens
- ✅ Short-lived access tokens (15 minutes)
- ✅ Refresh token rotation
- ✅ Secure cookie settings in production

#### Grad-App Specific:
- ✅ Returns complete user profile for offline caching
- ✅ Activity logging for analytics
- ✅ Gamification data included in auth responses

### 7. **Cookie Configuration**

#### TaskApp:
```javascript
{
  httpOnly: true,
  secure: production,
  sameSite: 'lax',
  maxAge: 7 days,
  path: '/auth/refresh'  // TaskApp path
}
```

#### Grad-App:
```javascript
{
  httpOnly: true,
  secure: production,
  sameSite: 'lax',
  maxAge: 7 days,
  path: '/api/auth/refresh'  // Grad-app path
}
```

### 8. **SQL Query Differences**

#### TaskApp:
- Uses double quotes for table names: `"Users"`
- Simple queries

#### Grad-App:
- Uses lowercase table names: `users`, `user_profiles`
- Complex JOINs to fetch related data
- Uses transactions for data integrity

## Required Environment Variables

### TaskApp Requirements:
```env
JWT_SECRET
JWT_REFRESH_SECRET
BCRYPT_SALT_ROUNDS
NODE_ENV
```

### Grad-App Requirements (Same + Additional):
```env
JWT_SECRET
JWT_REFRESH_SECRET
BCRYPT_SALT_ROUNDS
NODE_ENV
DB_HOST
DB_PORT
DB_NAME
DB_USERNAME
DB_PASSWORD
PORT
```

## API Endpoints

### Registration
- **POST** `/api/auth/register`
- **Body**: `{ email, password, displayName? }`
- **Response**: `{ message, userId }`

### Login
- **POST** `/api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ accessToken, user: {...} }`
- **Cookie**: Sets `refreshToken`

### Logout
- **POST** `/api/auth/logout`
- **Response**: `{ message }`
- **Effect**: Clears `refreshToken` cookie and database entry

### Refresh Token
- **POST** `/api/auth/refresh`
- **Cookie**: Requires `refreshToken`
- **Response**: `{ accessToken, user: {...} }`
- **Effect**: Rotates refresh token

## Middleware Usage

```javascript
import authMiddleware from './middleware/auth.js';

// Protected routes
app.get('/api/user/profile', authMiddleware, getProfile);
app.post('/api/tasks', authMiddleware, createTask);
```

## Migration Required

Run this migration to add refreshToken field:
```bash
npm run db:migrate
```

## Dependencies to Install

```bash
npm install bcryptjs jsonwebtoken
```

## Summary of Enhancements

| Feature | TaskApp | Grad-App |
|---------|---------|----------|
| User Profile | ❌ | ✅ Multi-table |
| Gamification | ❌ | ✅ Characters, Ranks, XP |
| Activity Logs | ❌ | ✅ Comprehensive |
| Transactions | ❌ | ✅ For data integrity |
| Account Status | ❌ | ✅ isActive field |
| Login Response | Basic | Rich user data |
| Error Handling | Basic | Environment-aware |
| Validation | Basic | Enhanced |

## Mobile App Integration Notes

### For React Native / Flutter:

1. **Token Storage**: Store access token in secure storage (not AsyncStorage)
2. **Refresh Logic**: Implement automatic token refresh on 401 errors
3. **Cookie Handling**: Use axios/fetch with credentials: 'include'
4. **Offline Support**: Cache user data from login response
5. **Profile Sync**: Update character data after XP-earning actions

### Example Mobile Flow:

```javascript
// Login
const { accessToken, user } = await login(email, password);
await SecureStore.setItemAsync('accessToken', accessToken);
await AsyncStorage.setItem('userProfile', JSON.stringify(user));

// Authenticated Request
const response = await fetch('/api/tasks', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include' // Important for cookies
});

// Auto-refresh on 401
if (response.status === 401) {
  const { accessToken: newToken } = await refreshToken();
  await SecureStore.setItemAsync('accessToken', newToken);
  // Retry original request
}
```

## Testing the Auth System

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"hunter@example.com","password":"hunter123","displayName":"Shadow Hunter"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hunter@example.com","password":"hunter123"}' \
  -c cookies.txt

# Refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

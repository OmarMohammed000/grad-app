# Grad-App Backend Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup

#### Create PostgreSQL Database
```bash
# Using psql
psql -U postgres

# Create database
CREATE DATABASE grad_app_db;

# Exit psql
\q
```

#### Or use sequelize-cli
```bash
npm run db:create
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grad_app_db
DB_USERNAME=postgres
DB_PASSWORD=your_actual_password

# Server
PORT=3000

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters_long

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

**Generate Strong JWT Secrets:**
```bash
# In Node.js console or terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run Migrations

```bash
# Run all migrations
npm run db:migrate

# This will create all tables:
# - users
# - ranks (with seed data)
# - user_profiles
# - characters
# - tasks
# - habits
# - task_completions
# - habit_completions
# - group_challenges
# - challenge_tasks
# - challenge_participants
# - challenge_task_completions
# - challenge_progress
# - activity_logs
```

### 5. Verify Database Structure

```bash
# Using psql
psql -U postgres -d grad_app_db

# List all tables
\dt

# Check ranks table (should have 7 default ranks)
SELECT * FROM ranks ORDER BY "orderIndex";
```

Expected ranks:
1. E-Rank (Level 1-10)
2. D-Rank (Level 11-20)
3. C-Rank (Level 21-35)
4. B-Rank (Level 36-50)
5. A-Rank (Level 51-70)
6. S-Rank (Level 71-99)
7. National Level (Level 100+)

### 6. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on: `http://localhost:3000`

### 7. Test the API

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hunter@example.com",
    "password": "hunter123",
    "displayName": "Shadow Hunter"
  }'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "userId": "uuid-here"
}
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hunter@example.com",
    "password": "hunter123"
  }' \
  -c cookies.txt
```

Expected response:
```json
{
  "accessToken": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "hunter@example.com",
    "displayName": "Shadow Hunter",
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

#### Get User Profile (Protected Route)
```bash
# Save the accessToken from login response
TOKEN="your_access_token_here"

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -b cookies.txt
```

#### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## Project Structure

```
backend/
├── config/
│   ├── config.js          # Database configuration
│   └── config.json        # Sequelize config
├── controllers/
│   └── Auth/
│       ├── register.js    # User registration
│       ├── login.js       # User login
│       ├── logout.js      # User logout
│       └── refreshToken.js # Token refresh
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── migrations/            # Database migrations
├── models/                # Sequelize models
│   ├── index.js
│   ├── User.js
│   ├── UserProfile.js
│   ├── Character.js
│   ├── Rank.js
│   ├── Task.js
│   ├── Habit.js
│   ├── TaskCompletion.js
│   ├── HabitCompletion.js
│   ├── GroupChallenge.js
│   ├── ChallengeTask.js
│   ├── ChallengeParticipant.js
│   ├── ChallengeTaskCompletion.js
│   ├── ChallengeProgress.js
│   └── ActivityLog.js
├── seeders/               # Database seeders
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment template
├── index.js               # Old server entry point
├── server.js              # New server entry point (use this)
├── package.json
└── AUTH_DOCUMENTATION.md  # Detailed auth documentation
```

## API Endpoints

### Public Routes
- `GET /health` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Protected Routes (require Authorization header)
- `GET /api/auth/me` - Get current user profile with full data

## Mobile App Integration

### React Native Example

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://your-server:3000/api';

// Register
export const register = async (email, password, displayName) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName })
  });
  return response.json();
};

// Login
export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include' // Important for cookies
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Store access token securely
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    // Cache user profile
    await AsyncStorage.setItem('userProfile', JSON.stringify(data.user));
  }
  
  return data;
};

// Authenticated API call
export const apiCall = async (endpoint, options = {}) => {
  const token = await SecureStore.getItemAsync('accessToken');
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    credentials: 'include'
  });
  
  // Auto-refresh on 401
  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      await SecureStore.setItemAsync('accessToken', accessToken);
      
      // Retry original request
      return apiCall(endpoint, options);
    } else {
      // Refresh failed, redirect to login
      await logout();
      // Navigate to login screen
    }
  }
  
  return response.json();
};

// Logout
export const logout = async () => {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  
  await SecureStore.deleteItemAsync('accessToken');
  await AsyncStorage.removeItem('userProfile');
};
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Check connection
psql -U postgres -d grad_app_db -c "SELECT 1;"
```

### Migration Issues
```bash
# Undo last migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all

# Re-run migrations
npm run db:migrate
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### JWT Secret Issues
Make sure your JWT secrets are:
- At least 32 characters long
- Different from each other
- Stored securely (never commit .env file)

## Next Steps

1. ✅ Auth system is complete
2. 🔄 Add task management endpoints
3. 🔄 Add habit tracking endpoints
4. 🔄 Add challenge system endpoints
5. 🔄 Add leaderboard functionality
6. 🔄 Add WebSocket for real-time updates

## Security Best Practices

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with expiration
- ✅ Refresh token rotation
- ✅ HttpOnly cookies for refresh tokens
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Environment variables for secrets
- 🔄 Rate limiting (TODO)
- 🔄 HTTPS in production (TODO)

## Support

For issues or questions, check:
- AUTH_DOCUMENTATION.md - Detailed auth documentation
- Migration files - Database schema reference
- Model files - Data structure reference

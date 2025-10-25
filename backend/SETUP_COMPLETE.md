# WebSocket & Controllers Setup - Complete ✅

## Summary

All backend controllers, routes, and WebSocket infrastructure have been successfully set up for real-time gamification features.

## ✅ What's Been Created

### 1. **Habits System** (Full CRUD + Completion)
**Controllers:** `backend/controllers/Habits/`
- ✅ `createHabit.js` - Create new habits with difficulty, frequency, target days
- ✅ `getHabits.js` - List all user habits with filters (difficulty, frequency, tags, search, pagination)
- ✅ `getHabit.js` - Get single habit with completion history
- ✅ `updateHabit.js` - Update habit settings
- ✅ `completeHabit.js` - Mark habit complete with:
  - Streak tracking (CAPPED at +30% max bonus)
  - XP calculation with bonuses
  - First completion bonus (+50%)
  - Weekly consistency bonus (+15%)
  - Automatic level-up handling
  - **WebSocket events emitted**: `habit:completed`, `streak:milestone`

- ✅ `deleteHabit.js` - Soft/hard delete habits

**Routes:** `backend/route/Habit.js`
- POST `/habits` - Create habit
- GET `/habits` - List habits (with filters)
- GET `/habits/:id` - Get single habit
- PUT `/habits/:id` - Update habit
- POST `/habits/:id/complete` - Complete habit (awards XP)
- DELETE `/habits/:id` - Delete habit

### 2. **Leaderboard System** (Real-time Rankings)
**Controllers:** `backend/controllers/Leaderboard/`
- ✅ `getGlobalLeaderboard.js` - Global rankings with:
  - Timeframe filters (all-time, weekly, monthly)
  - Pagination support
  - User's current rank included
  - Privacy-aware (respects isPublicProfile)

- ✅ `getUserStats.js` - Comprehensive user statistics:
  - Task stats (total, completed, active, pending)
  - Habit stats (total, avg streak, max streak, completions)
  - XP breakdown (total, weekly, monthly)
  - Character info (level, rank, attributes)
  - Privacy protection

**Routes:** `backend/route/leaderboard.js`
- GET `/leaderboard?timeframe=all-time&limit=50&offset=0` - Global leaderboard
- GET `/leaderboard/users/me/stats` - Current user stats
- GET `/leaderboard/users/:id/stats` - Specific user stats (if public)

### 3. **WebSocket Service** (Real-time Updates)
**Service:** `backend/services/websocketService.js`

**Features:**
- ✅ JWT authentication for all connections
- ✅ User-specific rooms (`user:{userId}`)
- ✅ Leaderboard subscription rooms (`leaderboard:{timeframe}`)
- ✅ Connection health checks (ping/pong)
- ✅ Automatic reconnection handling
- ✅ Error logging and monitoring

**Events Emitted:**
- `progress:update` - XP gains (emitted on every XP award)
- `user:levelup` - Level up notifications (with level details)
- `user:rankup` - Rank promotions (e.g., Bronze → Silver)
- `task:completed` - Task completion with XP and bonuses
- `habit:completed` - Habit completion with streak info
- `streak:milestone` - Significant streaks (7, 14, 30, 100 days)
- `leaderboard:update` - Rank changes and milestones
- `notification:broadcast` - Global announcements

**Client Events:**
- `subscribe:leaderboard` - Subscribe to leaderboard updates
- `unsubscribe:leaderboard` - Unsubscribe from leaderboard
- `subscribe:friends` - (Future) Friend activity feed
- `ping` - Connection health check

### 4. **Updated XP Service** (WebSocket-Enabled)
**Service:** `backend/services/xpService.js`

**Changes:**
- ✅ Imports WebSocket emitters (`emitUserProgress`, `emitLevelUp`, `emitRankUp`)
- ✅ Emits `progress:update` on every XP gain
- ✅ Emits `user:levelup` on level-up (with old/new level)
- ✅ Emits `user:rankup` on rank promotion
- ✅ Includes user profile data in events (displayName, avatarUrl)
- ✅ Broadcasts milestone achievements to leaderboard room

**Functions:**
- `calculateTaskXP()` - Task XP with priority, early/late, subtask bonuses
- `calculateHabitXP()` - Habit XP with CAPPED streak bonus (max +30%)
- `awardXP()` - Awards XP, handles level-ups, emits WebSocket events
- `calculateXPForNextLevel()` - Moderate growth curve (15% per level)
- `getDefaultXP()` - Default XP lookup by type/difficulty

### 5. **Updated Controllers** (WebSocket-Enabled)

**Task Completion:** `backend/controllers/Task/completeTask.js`
- ✅ Emits `task:completed` event with XP, early/late status, level-up info

**Habit Completion:** `backend/controllers/Habits/completeHabit.js`
- ✅ Emits `habit:completed` event with XP, streak, level-up info
- ✅ Emits `streak:milestone` for significant streaks (7, 14, 30, 100 days)

### 6. **Main Server** (WebSocket-Ready)
**File:** `backend/index.js`

**Changes:**
- ✅ Upgraded to HTTP server (using `http.createServer(app)`)
- ✅ Initialized WebSocket via `initializeWebSocket(server)`
- ✅ Added Habit routes (`/habits`)
- ✅ Added Leaderboard routes (`/leaderboard`)
- ✅ Changed `app.listen()` to `server.listen()` for WebSocket support
- ✅ Added WebSocket URL to startup logs

## 🔧 Technology Stack

### Dependencies Installed
- ✅ `socket.io` - WebSocket server library (v4.x)

### Existing Dependencies
- Express.js - REST API framework
- Sequelize - ORM for PostgreSQL
- JWT - Authentication
- bcrypt - Password hashing
- CORS - Cross-origin support

## 📊 Real-Time Flow Example

### Task Completion Flow:
1. **User completes task** → `POST /tasks/:id/complete`
2. **Controller calculates XP** → `calculateTaskXP()`
3. **Award XP** → `awardXP()` → Updates Character in DB
4. **Check level-up** → If leveled up, update level/rank
5. **Emit WebSocket events**:
   - `progress:update` → All user's connected devices
   - `task:completed` → All user's connected devices
   - `user:levelup` → (if leveled up) All user's devices
   - `leaderboard:update` → (if milestone) All leaderboard subscribers
6. **Return response** → HTTP response with completion data
7. **Frontend receives**:
   - HTTP response → Update task list
   - WebSocket events → Show XP animation, level-up modal, update progress bar

### Habit Completion Flow:
1. **User completes habit** → `POST /habits/:id/complete`
2. **Controller updates streak** → Checks if consecutive day
3. **Calculate XP with bonuses** → `calculateHabitXP()` (streak capped at +30%)
4. **Award XP** → `awardXP()` → Updates Character
5. **Emit WebSocket events**:
   - `progress:update` → XP gain notification
   - `habit:completed` → Habit completion with streak
   - `streak:milestone` → (if 7, 14, 30, 100 days) Special celebration
   - `user:levelup` → (if leveled up) Level-up notification
6. **Return response** → HTTP response with habit data

## 🚀 Next Steps for Frontend

### 1. Install Socket.IO Client
```bash
cd frontend
npm install socket.io-client
```

### 2. Create WebSocket Service
- Follow guide in `WEBSOCKET_GUIDE.md`
- Create `frontend/services/websocket.ts`
- Connect on app mount
- Subscribe to events in components

### 3. Build UI Components
- Level-up modal/animation
- Rank-up celebration
- XP gain toast notifications
- Streak milestone badges
- Real-time leaderboard updates

### 4. Testing
- Test task/habit completion → Check WebSocket events
- Test level-up → Verify animation triggers
- Test leaderboard → Check real-time rank updates
- Test multi-device → Complete task on one device, see update on another

## 📝 API Endpoints Summary

### Authentication Required (All Routes)

**Habits:**
- POST `/habits` - Create
- GET `/habits?difficulty=medium&frequency=daily&page=1&limit=20` - List
- GET `/habits/:id` - Get single
- PUT `/habits/:id` - Update
- POST `/habits/:id/complete` - Complete (awards XP) ⚡
- DELETE `/habits/:id?permanent=true` - Delete

**Tasks:**
- POST `/tasks` - Create
- GET `/tasks?status=active&priority=high&page=1&limit=20` - List
- GET `/tasks/:id` - Get single
- PUT `/tasks/:id` - Update
- POST `/tasks/:id/complete` - Complete (awards XP) ⚡
- DELETE `/tasks/:id?permanent=true` - Delete

**Leaderboard:**
- GET `/leaderboard?timeframe=all-time&limit=50&offset=0` - Global rankings ⚡
- GET `/leaderboard/users/me/stats` - My stats ⚡
- GET `/leaderboard/users/:id/stats` - User stats (if public) ⚡

**Users:**
- GET `/users/me` - Get my profile
- PUT `/users/me` - Update my profile
- PUT `/users/me/password` - Change password
- DELETE `/users/me` - Delete account
- GET `/users/:id/profile` - Get user profile (if public)

**Admin:**
- GET `/admin/users` - List all users
- POST `/admin/users` - Create user
- GET `/admin/users/:id` - Get user
- PUT `/admin/users/:id` - Update user
- DELETE `/admin/users/:id` - Delete user

**Auth:**
- POST `/auth/register` - Register
- POST `/auth/login` - Login
- POST `/auth/logout` - Logout
- POST `/auth/refresh` - Refresh token
- POST `/auth/google` - Google OAuth

⚡ = Emits WebSocket events

## 🎮 XP & Progression Rules

### Task XP Calculation
- Base XP by difficulty: Easy (10), Medium (25), Hard (50), Extreme (100)
- Priority multiplier: Low (0.9x), Medium (1.0x), High (1.2x), Critical (1.4x)
- Early completion: Up to +30% (50% early), +20% (25% early), +10% (any early)
- Late completion: -10% to -30% penalty (based on how late)
- Subtask bonus: +10% if all subtasks completed

### Habit XP Calculation
- Base XP by difficulty: Easy (5), Medium (15), Hard (30), Extreme (60)
- **Streak bonus: +2% per week, CAPPED at +30% (15 weeks max)** 🔒
- First completion: +50% one-time bonus
- Weekly consistency: +15% if hit all target days

### Level-Up Requirements
- Base: 100 XP for level 1→2
- Growth: 15% per level (moderate curve)
- Level 10: ~400 XP
- Level 50: ~12,000 XP
- Level 100: ~150,000 XP

### Rank System
- Checked on every level-up
- Based on `Ranks` table (minLevel thresholds)
- Rank-up triggers separate WebSocket event

## 🔒 Security Features

- ✅ JWT authentication for WebSocket connections
- ✅ User-specific rooms (can't see other users' events)
- ✅ Privacy checks on leaderboard/stats
- ✅ All task/habit operations scoped to userId
- ✅ Admin role checks for sensitive operations

## 📖 Documentation

- `WEBSOCKET_GUIDE.md` - Complete WebSocket integration guide
- Frontend code examples included
- Event payload schemas documented
- Testing instructions provided

---

**Status: Ready for Frontend Integration! 🚀**

All backend infrastructure is complete. Frontend can now:
1. Connect to WebSocket
2. Subscribe to events
3. Show real-time XP gains, level-ups, and leaderboard updates
4. Build engaging gamification UI

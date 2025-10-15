# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy and edit .env
cp .env.example .env

# Add your database credentials and generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Setup Database
```bash
# Create database and run migrations
npm run db:create
npm run db:migrate
```

### 4. Start Server
```bash
npm run dev
```

Server runs on: **http://localhost:3000**

---

## 🧪 Test the API

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","displayName":"Test Hunter"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -c cookies.txt
```

### Get Profile (use token from login)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

---

## 📂 Key Files

- `server.js` - Main server file
- `controllers/Auth/` - Authentication logic
- `middleware/auth.js` - JWT verification
- `models/` - Database models
- `.env` - Environment variables (create this!)

---

## 🔑 Environment Variables

Required in `.env`:
```env
JWT_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=your_32_char_refresh_secret
DB_PASSWORD=your_postgres_password
```

---

## 📖 Full Documentation

- `SETUP_GUIDE.md` - Complete setup instructions
- `AUTH_DOCUMENTATION.md` - Detailed auth documentation
- `DIFFERENCES_SUMMARY.md` - Comparison with taskApp

---

## ❓ Common Issues

**Database connection failed?**
- Check PostgreSQL is running
- Verify credentials in `.env`

**Port 3000 in use?**
- Change `PORT` in `.env`
- Or kill process: `lsof -i :3000`

**Migration errors?**
- Drop and recreate: `npm run db:drop && npm run db:create && npm run db:migrate`

---

## 📱 Mobile App Integration

Use these endpoints with `credentials: 'include'` for cookies:
- POST `/api/auth/register`
- POST `/api/auth/login` 
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me` (requires Bearer token)

---

## ✨ What You Get

After registration, users have:
- ✅ Account with email/password
- ✅ Profile with display name
- ✅ Character at E-Rank, Level 1
- ✅ 0 XP, needs 100 XP for Level 2
- ✅ Activity log entry

After login, mobile app gets:
- ✅ Access token (15 min)
- ✅ Refresh token (7 days, in cookie)
- ✅ Full user profile
- ✅ Character data (level, XP, rank)
- ✅ All stats (tasks, habits, challenges)

Perfect for immediate UI rendering!

---

Need help? Check the full documentation files!

import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './route/Auth.js';
import userRoutes from './route/User.js';
import adminRoutes from './route/Admin.js';
import taskRoutes from './route/Task.js';
import habitRoutes from './route/Habit.js';
import leaderboardRoutes from './route/leaderboard.js';
import challengeRoutes from './route/Challenge.js';
import uploadRoutes from './route/Upload.js';
import notificationRoutes from './route/Notification.js';
import { initializeWebSocket } from './services/websocketService.js';
import notificationScheduler from './services/notificationScheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
// Use random port in test environment, otherwise use configured PORT
const PORT = process.env.NODE_ENV === 'test' ? 0 : (process.env.PORT || 4000);

// Initialize WebSocket
const io = initializeWebSocket(server);

// CORS Configuration - Allow all origins in development
// CORS Configuration - Allow all origins in development
app.use(cors({
  origin: true, // Reflects the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['X-New-Access-Token'], // Expose custom header for auto-refreshed tokens
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/tasks', taskRoutes);
app.use('/habits', habitRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/challenges', challengeRoutes);
app.use('/upload', uploadRoutes);
app.use('/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.1.100:${PORT} (use this from mobile)`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://192.168.1.100:${PORT}`);
  console.log('✅ Listening on all network interfaces (0.0.0.0)');
  
  // Initialize notification scheduler
  console.log('📅 Initializing notification scheduler...');
  notificationScheduler.init();
});

export default app;
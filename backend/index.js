import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './route/Auth.js';
import userRoutes from './route/User.js';
import adminRoutes from './route/Admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS Configuration - Allow all origins in development
app.use(cors({
  origin: true, // Reflects the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`� Network: http://192.168.1.100:${PORT} (use this from mobile)`);
  console.log(`�🔗 Health: http://localhost:${PORT}/health`);
  console.log('✅ Listening on all network interfaces (0.0.0.0)');
});

export default app;
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ WebSocket connection rejected: No token provided');
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      console.log(`✅ WebSocket authenticated: User ${socket.userId}`);
      next();
    } catch (error) {
      console.log('❌ WebSocket connection rejected: Invalid token');
      return next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId} (Socket ID: ${socket.id})`);

    // Join user's personal room for private updates
    socket.join(`user:${socket.userId}`);
    console.log(`📍 User ${socket.userId} joined personal room`);

    // Subscribe to leaderboard updates
    socket.on('subscribe:leaderboard', (data) => {
      const timeframe = data?.timeframe || 'all-time';
      socket.join(`leaderboard:${timeframe}`);
      console.log(`📊 User ${socket.userId} subscribed to leaderboard:${timeframe}`);
      
      socket.emit('subscribed', {
        room: `leaderboard:${timeframe}`,
        message: 'Successfully subscribed to leaderboard updates'
      });
    });

    // Unsubscribe from leaderboard
    socket.on('unsubscribe:leaderboard', (data) => {
      const timeframe = data?.timeframe || 'all-time';
      socket.leave(`leaderboard:${timeframe}`);
      console.log(`📊 User ${socket.userId} unsubscribed from leaderboard:${timeframe}`);
    });

    // Subscribe to friend updates (future feature)
    socket.on('subscribe:friends', () => {
      socket.join(`friends:${socket.userId}`);
      console.log(`👥 User ${socket.userId} subscribed to friend updates`);
    });

    // Ping-pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.userId} (Reason: ${reason})`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`❌ WebSocket error for user ${socket.userId}:`, error);
    });
  });

  console.log('🌐 WebSocket server initialized');
  return io;
}

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO server instance
 */
export function getIO() {
  if (!io) {
    throw new Error('WebSocket server not initialized. Call initializeWebSocket() first.');
  }
  return io;
}

/**
 * Emit user progress update (XP gain, level, etc.)
 * @param {string} userId - User ID
 * @param {Object} data - Progress data
 */
export function emitUserProgress(userId, data) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('progress:update', {
      timestamp: new Date().toISOString(),
      ...data
    });
    console.log(`📈 Emitted progress update to user ${userId}`);
  } catch (error) {
    console.error('Error emitting user progress:', error);
  }
}

/**
 * Emit level up notification
 * @param {string} userId - User ID
 * @param {Object} data - Level up data
 */
export function emitLevelUp(userId, data) {
  try {
    const io = getIO();
    
    // Send to user
    io.to(`user:${userId}`).emit('user:levelup', {
      timestamp: new Date().toISOString(),
      ...data
    });
    
    console.log(`🎉 Emitted level up to user ${userId}: Level ${data.newLevel}`);
    
    // Broadcast to leaderboard if significant milestone
    if (data.newLevel % 10 === 0 || data.newLevel === 50 || data.newLevel === 100) {
      emitLeaderboardUpdate('all-time', {
        type: 'milestone',
        userId,
        displayName: data.user?.displayName || 'Someone',
        level: data.newLevel,
        message: `${data.user?.displayName || 'Someone'} reached level ${data.newLevel}!`
      });
    }
  } catch (error) {
    console.error('Error emitting level up:', error);
  }
}

/**
 * Emit rank up notification
 * @param {string} userId - User ID
 * @param {Object} data - Rank up data
 */
export function emitRankUp(userId, data) {
  try {
    const io = getIO();
    
    // Send to user
    io.to(`user:${userId}`).emit('user:rankup', {
      timestamp: new Date().toISOString(),
      ...data
    });
    
    console.log(`👑 Emitted rank up to user ${userId}: ${data.newRank?.name}`);
    
    // Broadcast to leaderboard
    emitLeaderboardUpdate('all-time', {
      type: 'rank_up',
      userId,
      displayName: data.user?.displayName || 'Someone',
      rankName: data.newRank?.name,
      message: `${data.user?.displayName || 'Someone'} advanced to ${data.newRank?.name}!`
    });
  } catch (error) {
    console.error('Error emitting rank up:', error);
  }
}

/**
 * Emit leaderboard update
 * @param {string} timeframe - Timeframe ('all-time', 'weekly', 'monthly')
 * @param {Object} data - Update data
 */
export function emitLeaderboardUpdate(timeframe = 'all-time', data) {
  try {
    const io = getIO();
    io.to(`leaderboard:${timeframe}`).emit('leaderboard:update', {
      timestamp: new Date().toISOString(),
      timeframe,
      ...data
    });
    console.log(`📊 Emitted leaderboard update to ${timeframe}`);
  } catch (error) {
    console.error('Error emitting leaderboard update:', error);
  }
}

/**
 * Emit task completion notification
 * @param {string} userId - User ID
 * @param {Object} data - Task completion data
 */
export function emitTaskCompleted(userId, data) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('task:completed', {
      timestamp: new Date().toISOString(),
      ...data
    });
    console.log(`✅ Emitted task completion to user ${userId}`);
  } catch (error) {
    console.error('Error emitting task completion:', error);
  }
}

/**
 * Emit habit completion notification
 * @param {string} userId - User ID
 * @param {Object} data - Habit completion data
 */
export function emitHabitCompleted(userId, data) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('habit:completed', {
      timestamp: new Date().toISOString(),
      ...data
    });
    console.log(`✅ Emitted habit completion to user ${userId}`);
  } catch (error) {
    console.error('Error emitting habit completion:', error);
  }
}

/**
 * Emit streak milestone notification
 * @param {string} userId - User ID
 * @param {Object} data - Streak data
 */
export function emitStreakMilestone(userId, data) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('streak:milestone', {
      timestamp: new Date().toISOString(),
      ...data
    });
    console.log(`🔥 Emitted streak milestone to user ${userId}: ${data.streak} days`);
  } catch (error) {
    console.error('Error emitting streak milestone:', error);
  }
}

/**
 * Broadcast notification to all connected users
 * @param {Object} data - Notification data
 */
export function broadcastNotification(data) {
  try {
    const io = getIO();
    io.emit('notification:broadcast', {
      timestamp: new Date().toISOString(),
      ...data
    });
    console.log('📢 Broadcasted notification to all users');
  } catch (error) {
    console.error('Error broadcasting notification:', error);
  }
}

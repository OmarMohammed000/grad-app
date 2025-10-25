# WebSocket Integration Guide

## Overview
The backend now supports real-time updates via WebSocket for:
- **User Progress**: XP gains, level ups, rank ups
- **Task & Habit Completions**: Real-time completion notifications
- **Leaderboard Updates**: Live rank changes and milestones
- **Streak Milestones**: Significant habit streaks

## Server Setup ✅

The WebSocket server is initialized in `backend/index.js` and uses Socket.IO for WebSocket communication.

### Available Events

#### Client → Server (Subscribe/Unsubscribe)
- `subscribe:leaderboard` - Subscribe to leaderboard updates
- `unsubscribe:leaderboard` - Unsubscribe from leaderboard
- `subscribe:friends` - Subscribe to friend updates (future feature)
- `ping` - Health check

#### Server → Client (Real-time Updates)
- `progress:update` - XP gain notification
- `user:levelup` - Level up notification
- `user:rankup` - Rank promotion notification
- `task:completed` - Task completion notification
- `habit:completed` - Habit completion notification
- `streak:milestone` - Streak milestone notification
- `leaderboard:update` - Leaderboard position change
- `notification:broadcast` - Global announcements

## Frontend Integration (React Native/Expo)

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Create WebSocket Service

Create `frontend/services/websocket.ts`:

```typescript
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect() {
    try {
      // Get auth token
      const token = await SecureStore.getItemAsync('accessToken');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      // Connect to WebSocket server
      this.socket = io('http://192.168.1.100:4000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupListeners();
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Subscribe to all events
    this.socket.on('progress:update', (data) => {
      console.log('📈 Progress update:', data);
      // Update UI state, show toast notification
    });

    this.socket.on('user:levelup', (data) => {
      console.log('🎉 Level up!', data);
      // Show level up animation/modal
    });

    this.socket.on('user:rankup', (data) => {
      console.log('👑 Rank up!', data);
      // Show rank up animation/modal
    });

    this.socket.on('task:completed', (data) => {
      console.log('✅ Task completed:', data);
      // Update task list, show XP gained
    });

    this.socket.on('habit:completed', (data) => {
      console.log('✅ Habit completed:', data);
      // Update habit list, show streak
    });

    this.socket.on('streak:milestone', (data) => {
      console.log('🔥 Streak milestone:', data);
      // Show streak celebration
    });

    this.socket.on('leaderboard:update', (data) => {
      console.log('📊 Leaderboard update:', data);
      // Refresh leaderboard
    });
  }

  subscribeToLeaderboard(timeframe: 'all-time' | 'weekly' | 'monthly' = 'all-time') {
    this.socket?.emit('subscribe:leaderboard', { timeframe });
  }

  unsubscribeFromLeaderboard(timeframe: 'all-time' | 'weekly' | 'monthly' = 'all-time') {
    this.socket?.emit('unsubscribe:leaderboard', { timeframe });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listener methods
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }
}

export default new WebSocketService();
```

### 3. Usage in React Native Components

#### App-wide Setup (App.tsx or _layout.tsx)

```typescript
import { useEffect } from 'react';
import WebSocketService from './services/websocket';

export default function App() {
  useEffect(() => {
    // Connect on app mount
    WebSocketService.connect();

    // Disconnect on unmount
    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  return <YourApp />;
}
```

#### Leaderboard Component

```typescript
import { useEffect, useState } from 'react';
import WebSocketService from '../services/websocket';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Subscribe to leaderboard updates
    WebSocketService.subscribeToLeaderboard('all-time');

    // Listen for updates
    WebSocketService.on('leaderboard:update', (data) => {
      console.log('Leaderboard updated:', data);
      // Refresh leaderboard data or update specific rank
      fetchLeaderboard();
    });

    // Cleanup
    return () => {
      WebSocketService.unsubscribeFromLeaderboard('all-time');
      WebSocketService.off('leaderboard:update');
    };
  }, []);

  return (
    <View>
      {/* Leaderboard UI */}
    </View>
  );
}
```

#### Task/Habit Completion with Live Feedback

```typescript
import { useState } from 'react';
import WebSocketService from '../services/websocket';

export default function TaskScreen() {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);

  useEffect(() => {
    // Listen for level up events
    WebSocketService.on('user:levelup', (data) => {
      setLevelUpData(data);
      setShowLevelUpModal(true);
      // Play celebration animation/sound
    });

    return () => {
      WebSocketService.off('user:levelup');
    };
  }, []);

  const completeTask = async (taskId: string) => {
    try {
      const response = await api.post(\`/tasks/\${taskId}/complete\`);
      // Task completion response includes XP
      // WebSocket will send live update to all devices
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <View>
      {/* Task UI */}
      {showLevelUpModal && (
        <LevelUpModal data={levelUpData} onClose={() => setShowLevelUpModal(false)} />
      )}
    </View>
  );
}
```

## Event Payload Examples

### progress:update
```json
{
  "timestamp": "2025-10-25T12:34:56.789Z",
  "xpEarned": 50,
  "currentXP": 450,
  "totalXP": 1250,
  "level": 8,
  "xpToNextLevel": 500,
  "source": "task_completion",
  "metadata": { "taskId": "123" }
}
```

### user:levelup
```json
{
  "timestamp": "2025-10-25T12:34:56.789Z",
  "user": {
    "id": "user-uuid",
    "displayName": "JohnDoe"
  },
  "oldLevel": 7,
  "newLevel": 8,
  "levelUpDetails": [
    { "level": 8, "xpToNextLevel": 500 }
  ],
  "currentXP": 100,
  "xpToNextLevel": 500
}
```

### leaderboard:update
```json
{
  "timestamp": "2025-10-25T12:34:56.789Z",
  "timeframe": "all-time",
  "type": "milestone",
  "userId": "user-uuid",
  "displayName": "JohnDoe",
  "level": 50,
  "message": "JohnDoe reached level 50!"
}
```

## Testing WebSocket Connection

Use a tool like [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/) or create a test script:

```javascript
const io = require('socket.io-client');

const socket = io('http://192.168.1.100:4000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('subscribe:leaderboard', { timeframe: 'all-time' });
});

socket.on('progress:update', (data) => {
  console.log('Progress:', data);
});
```

## Security Notes

- ✅ JWT authentication required for all WebSocket connections
- ✅ Users can only receive events for their own data (user-specific rooms)
- ✅ Leaderboard updates are public but require authentication
- ✅ Connection is encrypted in production (WSS)

## Next Steps

1. ✅ Backend WebSocket server set up
2. ✅ All controllers emit WebSocket events
3. ⏳ Frontend: Install socket.io-client
4. ⏳ Frontend: Create WebSocket service
5. ⏳ Frontend: Connect on app mount
6. ⏳ Frontend: Subscribe to events in components
7. ⏳ Frontend: Build UI for level-up/rank-up animations

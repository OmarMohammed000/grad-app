import api from './api';
import Toast from 'react-native-toast-message';

export interface UserStats {
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  character: {
    level: number;
    currentXp: number;
    totalXp: number;
    rankId?: string;
    rank?: {
      name: string;
    };
  } | null;
  stats: {
    tasks: {
      total: number;
      completed: number;
      active: number;
      pending: number;
    };
    habits: {
      total: number;
      avgStreak: number;
      maxStreak: number;
      totalCompletions: number;
    };
    xp: {
      total: number;
      weekly: number;
      monthly: number;
    };
  };
}

export interface ActivityPoint {
  label: string;
  tasks: number;
  habits: number;
  xp: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  currentXp: number;
  totalXp: number;
}

class LeaderboardService {
  static async getUserStats(userId: string = 'me'): Promise<UserStats> {
    try {
      const response = await api.get(`/leaderboard/users/${userId}/stats`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load user stats';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  static async getUserActivity(
    period: 'weekly' | 'monthly' | 'yearly' = 'weekly',
    userId: string = 'me'
  ): Promise<{ period: string; activity: ActivityPoint[] }> {
    try {
      const response = await api.get(`/leaderboard/users/${userId}/activity`, {
        params: { period },
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load activity data';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  static async getGlobalLeaderboard(
    timeframe: 'all-time' | 'monthly' | 'weekly' = 'all-time',
    limit: number = 10
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    userRank: any;
    timeframe: string;
    total: number;
  }> {
    try {
      const response = await api.get('/leaderboard', {
        params: { timeframe, limit },
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load leaderboard';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }
}

export default LeaderboardService;


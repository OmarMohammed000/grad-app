import api from './api';
import Toast from 'react-native-toast-message';

export interface UserProfile {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isPublicProfile?: boolean;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  soundEnabled?: boolean;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface Rank {
  name: string;
  color: string;
  minLevel?: number;
  maxLevel?: number;
}

export interface Character {
  id: string;
  level: number;
  totalXp: number;
  currentXp: number;
  xpToNextLevel: number;
  streakDays: number;
  longestStreak: number;
  rank?: Rank;
}

export interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  profile?: UserProfile;
  character?: Character;
}

export interface UserResponse {
  user: User;
}

export class UserService {
  /**
   * Get current user profile with character data
   */
  static async getMe(): Promise<UserResponse> {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      const message = error.response?.data?.message || 'Failed to fetch user data';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateMe(data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    isPublicProfile?: boolean;
    notificationsEnabled?: boolean;
    emailNotifications?: boolean;
    soundEnabled?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  }): Promise<UserResponse> {
    try {
      const response = await api.put('/users/me', data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully!',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Calculate current XP and max XP for progress bar
   * Uses currentXp and xpToNextLevel directly from character
   */
  static calculateXPProgress(character: Character | undefined): {
    currentXP: number;
    maxXP: number;
    level: number;
    rank: string;
  } {
    if (!character) {
      return {
        currentXP: 0,
        maxXP: 1000,
        level: 1,
        rank: 'E-Rank',
      };
    }

    const level = character.level || 1;
    // Use currentXp and xpToNextLevel directly from character (matches backend)
    const currentXP = Number(character.currentXp) || 0;
    const maxXP = Number(character.xpToNextLevel) || 1000;

    // Get rank name
    const rankName = character.rank?.name || 'E-Rank';

    return {
      currentXP: Math.max(0, currentXP), // Ensure non-negative
      maxXP: Math.max(1, maxXP), // Ensure at least 1 to avoid division by zero
      level: level,
      rank: rankName,
    };
  }

  /**
   * Get user display name
   */
  static getUserDisplayName(user: User | undefined): string {
    if (!user) {
      return 'User';
    }
    return user.profile?.displayName || user.email.split('@')[0] || 'User';
  }
}

export default UserService;


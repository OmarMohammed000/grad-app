import api from './api';
import Toast from 'react-native-toast-message';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  frequency: 'daily' | 'weekly' | 'custom';
  targetDays?: number[];
  targetCount?: number;
  reminderTime?: string;
  isPublic: boolean;
  isActive: boolean;
  xpReward?: number;
  tags?: string[];
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate?: string;
  createdAt: string;
  updatedAt: string;
  completedToday?: boolean;
  completionsThisWeek?: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedDate: string;
  completionTime?: string;
  xpEarned: number;
  streakCount: number;
  habitSnapshot?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHabitData {
  title: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  frequency?: 'daily' | 'weekly' | 'custom';
  targetDays?: number[];
  reminderTime?: string;
  isPublic?: boolean;
  xpReward?: number;
  tags?: string[];
}

export interface UpdateHabitData {
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  frequency?: 'daily' | 'weekly' | 'custom';
  targetDays?: number[];
  reminderTime?: string;
  isPublic?: boolean;
  isActive?: boolean;
  xpReward?: number;
  tags?: string[];
}

export interface GetHabitsParams {
  difficulty?: string;
  frequency?: string;
  isActive?: boolean;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export class HabitService {
  /**
   * Get all habits for the current user
   */
  static async getHabits(params?: GetHabitsParams): Promise<{ habits: Habit[]; pagination: any }> {
    try {
      const response = await api.get('/habits', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching habits:', error);
      const message = error.response?.data?.message || 'Failed to fetch habits';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Get a single habit by ID
   */
  static async getHabit(id: string): Promise<{ habit: Habit }> {
    try {
      const response = await api.get(`/habits/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching habit:', error);
      const message = error.response?.data?.message || 'Failed to fetch habit';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Create a new habit
   */
  static async createHabit(data: CreateHabitData): Promise<{ message: string; habit: Habit }> {
    try {
      const response = await api.post('/habits', data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Habit created successfully!',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating habit:', error);
      const message = error.response?.data?.message || 'Failed to create habit';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Update a habit
   */
  static async updateHabit(id: string, data: UpdateHabitData): Promise<{ message: string; habit: Habit }> {
    try {
      const response = await api.put(`/habits/${id}`, data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Habit updated successfully!',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating habit:', error);
      const message = error.response?.data?.message || 'Failed to update habit';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Delete a habit (soft delete by default)
   */
  static async deleteHabit(id: string, permanent: boolean = false): Promise<{ message: string }> {
    try {
      console.log('HabitService.deleteHabit called with id:', id, 'permanent:', permanent);
      const response = await api.delete(`/habits/${id}`, {
        params: { permanent: permanent ? 'true' : 'false' },
      });
      console.log('Delete habit response:', response.data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: permanent ? 'Habit permanently deleted' : 'Habit deactivated',
        visibilityTime: 2000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting habit:', error);
      const message = error.response?.data?.message || 'Failed to delete habit';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
        visibilityTime: 3000,
      });
      throw error;
    }
  }

  /**
   * Complete a habit
   */
  static async completeHabit(
    id: string,
    notes?: string,
    completedAt?: Date
  ): Promise<{
    message: string;
    completion: HabitCompletion;
    habit: Habit;
    xpEarned: number;
    leveledUp?: boolean;
    newLevel?: number;
  }> {
    try {
      const response = await api.post(`/habits/${id}/complete`, {
        notes,
        completedAt: completedAt?.toISOString(),
      });
      Toast.show({
        type: 'success',
        text1: 'Habit Completed!',
        text2: `+${response.data.xpEarned} XP earned!`,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error completing habit:', error);
      const message = error.response?.data?.message || 'Failed to complete habit';
      
      // Don't show error toast if habit was already completed today
      if (error.response?.status === 400 && message.includes('already completed')) {
        Toast.show({
          type: 'info',
          text1: 'Already Completed',
          text2: 'This habit has already been completed today',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: message,
        });
      }
      throw error;
    }
  }

  /**
   * Uncomplete a habit (remove today's completion)
   */
  static async uncompleteHabit(
    id: string,
    completedDate?: string
  ): Promise<{
    message: string;
    habit: Habit;
    xpRemoved: number;
  }> {
    try {
      const response = await api.delete(`/habits/${id}/complete`, {
        data: { completedDate },
      });
      Toast.show({
        type: 'success',
        text1: 'Completion Removed',
        text2: 'Habit completion has been removed',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uncompleting habit:', error);
      const message = error.response?.data?.message || 'Failed to remove completion';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Check if habit is completed today
   */
  static isHabitCompletedToday(habit: Habit): boolean {
    if (!habit.lastCompletedDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Handle DATEONLY strings (YYYY-MM-DD) from backend
    const lastCompletedDate = new Date(habit.lastCompletedDate + 'T00:00:00');
    lastCompletedDate.setHours(0, 0, 0, 0);
    
    return lastCompletedDate.getTime() === today.getTime();
  }

  /**
   * Calculate completions this week (helper function)
   */
  static calculateCompletionsThisWeek(completions: HabitCompletion[]): number {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return completions.filter((completion) => {
      // Handle DATEONLY format (YYYY-MM-DD)
      const completedDate = new Date(completion.completedDate + 'T00:00:00');
      return completedDate >= weekAgo && completedDate <= now;
    }).length;
  }
}

export default HabitService;


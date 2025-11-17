import api from './api';
import Toast from 'react-native-toast-message';

// ============================================
// Challenge Types
// ============================================

export interface Challenge {
  id: string;
  createdBy: string;
  title: string;
  description?: string;
  challengeType: 'competitive' | 'collaborative';
  goalType: 'task_count' | 'total_xp' | 'habit_streak' | 'custom';
  goalTarget: number;
  goalDescription?: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  isPublic: boolean;
  inviteCode?: string;
  maxParticipants?: number;
  currentParticipants: number;
  xpReward: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  tags: string[];
  rules?: string;
  prizeDescription?: string;
  requiresVerification: boolean;
  isTeamBased: boolean;
  teamSize?: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  completedAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    profile: {
      displayName: string;
      avatarUrl?: string;
    };
  };
  hasJoined?: boolean; // computed
  canJoin?: boolean; // computed
  userParticipation?: ChallengeParticipant; // user's participation info
}

export interface ChallengeTask {
  id: string;
  challengeId: string;
  title: string;
  description?: string;
  taskType: 'required' | 'optional' | 'bonus';
  pointValue: number;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  isRepeatable: boolean;
  maxCompletions?: number;
  orderIndex: number;
  tags: string[];
  requiresProof: boolean;
  proofInstructions?: string;
  estimatedDuration?: number; // minutes
  availableFrom?: string; // ISO date
  availableUntil?: string; // ISO date
  prerequisites: string[]; // task IDs
  isActive: boolean;
  completionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  status: 'active' | 'completed' | 'dropped_out' | 'disqualified';
  role?: 'member' | 'team_leader' | 'moderator';
  currentProgress: number;
  totalPoints: number;
  totalXpEarned: number;
  rank?: number;
  completedTasksCount: number;
  streakDays: number;
  longestStreak: number;
  lastActivityDate?: string; // DATEONLY format
  joinedAt: string;
  completedAt?: string;
  droppedAt?: string;
  badges?: any[];
  teamId?: string;
  user?: {
    id: string;
    profile: {
      displayName: string;
      avatarUrl?: string;
    };
  };
}

export interface ChallengeTaskCompletion {
  id: string;
  challengeTaskId: string;
  participantId: string;
  userId: string;
  pointsEarned: number;
  xpEarned: number;
  completedAt: string;
  proof?: string;
  proofImageUrl?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  durationMinutes?: number;
  completionNumber: number;
  challengeTask?: ChallengeTask;
}

export interface ChallengeProgress {
  id: string;
  participantId: string;
  challengeId: string;
  userId: string;
  date: string; // DATEONLY format (YYYY-MM-DD)
  progressValue: number;
  tasksCompleted: number;
  xpEarned: number;
  pointsEarned: number;
  cumulativeProgress: number;
  streakCount: number;
  rankOnDate?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Request/Response Types
// ============================================

export interface CreateChallengeData {
  title: string;
  description?: string;
  challengeType?: 'competitive' | 'collaborative';
  goalType: 'task_count' | 'total_xp' | 'habit_streak' | 'custom';
  goalTarget: number;
  goalDescription?: string;
  isPublic?: boolean;
  maxParticipants?: number;
  xpReward?: number;
  startDate: string;
  endDate: string;
  tags?: string[];
  rules?: string;
  prizeDescription?: string;
  requiresVerification?: boolean;
  isTeamBased?: boolean;
  teamSize?: number;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface UpdateChallengeData {
  title?: string;
  description?: string;
  goalTarget?: number;
  goalDescription?: string;
  maxParticipants?: number;
  xpReward?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  rules?: string;
  prizeDescription?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status?: 'active' | 'completed' | 'cancelled';
}

export interface JoinChallengeData {
  inviteCode?: string;
  teamId?: string;
}

export interface AddChallengeTaskData {
  title: string;
  description?: string;
  taskType?: 'required' | 'optional' | 'bonus';
  pointValue?: number;
  xpReward?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  isRepeatable?: boolean;
  maxCompletions?: number;
  orderIndex?: number;
  tags?: string[];
  requiresProof?: boolean;
  proofInstructions?: string;
  estimatedDuration?: number;
  availableFrom?: string;
  availableUntil?: string;
  prerequisites?: string[];
}

export interface CompleteChallengeTaskData {
  proof?: string;
  proofImageUrl?: string;
  durationMinutes?: number;
}

export interface GetChallengesParams {
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  challengeType?: 'competitive' | 'collaborative';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isPublic?: boolean;
  tags?: string;
  search?: string;
  myChallenges?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'startDate' | 'endDate' | 'createdAt' | 'currentParticipants' | 'difficultyLevel';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ChallengeStats {
  totalPoints: number;
  currentProgress: number;
  goalTarget: number;
  progressPercentage: string;
  completedTasksCount: number;
  totalXpEarned: number;
  streakDays: number;
  longestStreak: number;
  rank?: number;
  status: 'active' | 'completed' | 'dropped_out' | 'disqualified';
  joinedAt: string;
  daysInChallenge: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  totalPoints: number;
  currentProgress: number;
  completedTasksCount: number;
  totalXpEarned: number;
  streakDays: number;
  status: string;
  badges?: any[];
}

export interface ChallengeSummary {
  activeCount: number;
  completedThisMonth: number;
}

// ============================================
// Challenge Service
// ============================================

export class ChallengeService {
  /**
   * Get all challenges with filters
   */
  static async getChallenges(params: GetChallengesParams = {}): Promise<{
    challenges: Challenge[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await api.get(`/challenges?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching challenges:', error);
      const message = error.response?.data?.message || 'Failed to fetch challenges';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Get single challenge by ID
   */
  static async getChallenge(id: string): Promise<{ 
    challenge: Challenge & {
      challengeTasks: ChallengeTask[];
      participants: ChallengeParticipant[];
      userParticipation?: ChallengeParticipant;
      hasJoined: boolean;
      canJoin: boolean;
    };
  }> {
    try {
      const response = await api.get(`/challenges/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching challenge:', error);
      const message = error.response?.data?.message || 'Failed to fetch challenge';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Create a new challenge
   */
  static async createChallenge(data: CreateChallengeData): Promise<{
    message: string;
    challenge: Challenge;
    inviteCode?: string;
  }> {
    try {
      const response = await api.post('/challenges', data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Challenge created successfully!',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      const message = error.response?.data?.message || 'Failed to create challenge';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Update challenge
   */
  static async updateChallenge(
    id: string,
    data: UpdateChallengeData
  ): Promise<{ message: string; challenge: Challenge }> {
    try {
      const response = await api.put(`/challenges/${id}`, data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Challenge updated successfully!',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating challenge:', error);
      const message = error.response?.data?.message || 'Failed to update challenge';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Delete challenge
   */
  static async deleteChallenge(
    id: string,
    permanent: boolean = false
  ): Promise<{ message: string; challenge?: Challenge }> {
    try {
      const response = await api.delete(`/challenges/${id}`, {
        params: { permanent: permanent ? 'true' : 'false' },
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: permanent ? 'Challenge deleted' : 'Challenge cancelled',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting challenge:', error);
      const message = error.response?.data?.message || 'Failed to delete challenge';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(
    id: string,
    data?: JoinChallengeData
  ): Promise<{
    message: string;
    participant: ChallengeParticipant;
    challenge: Challenge;
  }> {
    try {
      const response = await api.post(`/challenges/${id}/join`, data || {});
      Toast.show({
        type: 'success',
        text1: 'Joined!',
        text2: `You've joined ${response.data.challenge.title}`,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      const message = error.response?.data?.message || 'Failed to join challenge';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Leave a challenge
   */
  static async leaveChallenge(id: string): Promise<{
    message: string;
    participant: ChallengeParticipant;
  }> {
    try {
      const response = await api.post(`/challenges/${id}/leave`);
      Toast.show({
        type: 'success',
        text1: 'Left Challenge',
        text2: 'You have left the challenge',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error leaving challenge:', error);
      const message = error.response?.data?.message || 'Failed to leave challenge';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Add task to challenge
   */
  static async addChallengeTask(
    challengeId: string,
    data: AddChallengeTaskData
  ): Promise<{ message: string; task: ChallengeTask }> {
    try {
      const response = await api.post(`/challenges/${challengeId}/tasks`, data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Task added successfully!',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding task:', error);
      const message = error.response?.data?.message || 'Failed to add task';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Complete a challenge task
   */
  static async completeChallengeTask(
    challengeId: string,
    taskId: string,
    data?: CompleteChallengeTaskData
  ): Promise<{
    message: string;
    completion: ChallengeTaskCompletion;
    participant: ChallengeParticipant;
    challengeCompleted: boolean;
  }> {
    try {
      const response = await api.post(
        `/challenges/${challengeId}/tasks/${taskId}/complete`,
        data || {}
      );
      
      if (response.data.challengeCompleted) {
        Toast.show({
          type: 'success',
          text1: 'Challenge Completed!',
          text2: 'Congratulations! You completed the challenge!',
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Task Completed!',
          text2: `+${response.data.completion.xpEarned} XP earned`,
        });
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error completing task:', error);
      const message = error.response?.data?.message || 'Failed to complete task';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Get challenge progress
   */
  static async getChallengeProgress(
    id: string,
    days: number = 30
  ): Promise<{
    participant: ChallengeParticipant;
    stats: ChallengeStats;
    dailyProgress: ChallengeProgress[];
    recentCompletions: ChallengeTaskCompletion[];
    incompleteTasks: ChallengeTask[];
    challenge: {
      id: string;
      title: string;
      status: string;
      startDate: string;
      endDate: string;
      daysRemaining: number;
    };
  }> {
    try {
      const response = await api.get(`/challenges/${id}/progress`, {
        params: { days },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching progress:', error);
      const message = error.response?.data?.message || 'Failed to fetch progress';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Get challenge leaderboard
   */
  static async getChallengeLeaderboard(
    id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    userRank?: LeaderboardEntry;
    challenge: {
      id: string;
      title: string;
      goalTarget: number;
      goalType: string;
      status: string;
    };
    total: number;
  }> {
    try {
      const response = await api.get(`/challenges/${id}/leaderboard`, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      const message = error.response?.data?.message || 'Failed to fetch leaderboard';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Helper: Calculate days remaining
   */
  static calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Helper: Get challenge color based on difficulty/type
   */
  static getChallengeColor(
    difficulty: string,
    challengeType: string
  ): string {
    if (challengeType === 'collaborative') return '#06D6A0'; // Green
    if (difficulty === 'expert') return '#D946EF'; // Purple
    if (difficulty === 'advanced') return '#F59E0B'; // Orange
    if (difficulty === 'intermediate') return '#3B82F6'; // Blue
    return '#10B981'; // Green (beginner)
  }

  /**
   * Helper: Get challenge icon based on goalType/tags
   */
  static getChallengeIcon(goalType: string, tags: string[]): string {
    if (tags.includes('fitness') || tags.includes('workout')) return 'fitness';
    if (tags.includes('reading') || tags.includes('book')) return 'book';
    if (tags.includes('meditation') || tags.includes('mindfulness')) return 'leaf';
    if (goalType === 'habit_streak') return 'flame';
    if (goalType === 'total_xp') return 'star';
    return 'trophy';
  }

  /**
   * Helper: Format participant count
   */
  static formatParticipantCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }
}

export default ChallengeService;


import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  level?: number;
  totalXp?: number;
  rank?: {
    name: string;
    color: string;
  };
}

export interface UserStats {
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLogin: string | null;
    displayName: string;
    avatarUrl?: string;
    isPublicProfile?: boolean;
  };
  character: {
    id: string;
    level: number;
    currentXp: number;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    rank?: {
      name: string;
      color: string;
      minXp: number;
    };
  };
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

export interface ActivityData {
  period: 'weekly' | 'monthly' | 'yearly';
  activity: {
    label: string;
    tasks: number;
    habits: number;
    xp: number;
  }[];
}

export interface UserChallenge {
  id: string;
  title: string;
  description: string;
  status: string;
  challengeType: string;
  isGlobal: boolean;
  startDate: string;
  endDate: string;
  creatorName: string;
  isCreator: boolean;
  participation: {
    joinedAt: string;
    status: string;
    role: string;
    currentProgress: number;
    totalPoints: number;
    totalXpEarned: number;
    rank: number | null;
    completedTasksCount: number;
    completedAt: string | null;
    streakDays: number;
    longestStreak: number;
  };
  totalTasks: number;
  goalType: string;
  goalTarget: number;
}

export interface SearchUsersParams {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ChallengeTask {
  id?: string;
  title: string;
  description?: string;
  taskType: 'required' | 'optional' | 'bonus';
  pointValue: number;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  requiresProof: boolean;
  proofInstructions?: string;
  isRepeatable?: boolean;
  maxCompletions?: number;
  orderIndex?: number;
}

export interface ChallengeCreateData {
  title: string;
  description?: string;
  challengeType: 'competitive' | 'collaborative';
  goalType: 'task_count' | 'total_xp';
  goalTarget: number;
  goalDescription?: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  xpReward: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verificationType: 'none' | 'manual' | 'ai';
  isPublic: boolean;
  isGlobal: boolean;
  tags?: string[];
  rules?: string;
  prizeDescription?: string;
}

class AdminService {
  // User Management
  async searchUsers(params: SearchUsersParams = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const response = await api.get(`/admin/users/${userId}/stats`);
    return response.data;
  }

  async getUserActivity(userId: string, period: 'weekly' | 'monthly' | 'yearly' = 'weekly'): Promise<ActivityData> {
    const response = await api.get(`/admin/users/${userId}/activity`, {
      params: { period }
    });
    return response.data;
  }

  async getUserChallenges(userId: string) {
    const response = await api.get(`/admin/users/${userId}/challenges`);
    return response.data;
  }

  async updateUserRole(userId: string, role: string) {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  }

  async deactivateUser(userId: string) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  // Challenge Management
  async getGlobalChallenges(params: any = {}) {
    const response = await api.get('/challenges', {
      params: {
        ...params,
        isGlobal: true
      }
    });
    return response.data;
  }

  async getAllChallenges(params: any = {}) {
    const response = await api.get('/challenges', { params });
    return response.data;
  }

  async createGlobalChallenge(data: ChallengeCreateData) {
    // Force isGlobal and isPublic to true
    const challengeData = {
      ...data,
      isGlobal: true,
      isPublic: true
    };
    const response = await api.post('/challenges', challengeData);
    return response.data;
  }

  async updateGlobalChallenge(challengeId: string, data: Partial<ChallengeCreateData>) {
    const response = await api.put(`/challenges/${challengeId}`, data);
    return response.data;
  }

  async deleteGlobalChallenge(challengeId: string) {
    const response = await api.delete(`/challenges/${challengeId}`);
    return response.data;
  }

  async addChallengeTask(challengeId: string, task: ChallengeTask) {
    const response = await api.post(`/challenges/${challengeId}/tasks`, task);
    return response.data;
  }

  async getChallengeDetails(challengeId: string) {
    const response = await api.get(`/challenges/${challengeId}`);
    return response.data;
  }
}

export default new AdminService();

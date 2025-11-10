import api from './api';
import Toast from 'react-native-toast-message';

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deleted';
  xpReward?: number;
  tags?: string[];
  dueDate?: string;
  reminderTime?: string;
  estimatedDuration?: number;
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: any;
  parentTaskId?: string;
  orderIndex?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  subtasks?: Todo[];
  parentTask?: Todo;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  xpReward?: number;
  tags?: string[];
  dueDate?: string;
  reminderTime?: string;
  estimatedDuration?: number;
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: any;
  parentTaskId?: string;
  orderIndex?: number;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  xpReward?: number;
  tags?: string[];
  dueDate?: string;
  reminderTime?: string;
  estimatedDuration?: number;
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: any;
  parentTaskId?: string;
  orderIndex?: number;
}

export interface GetTodosParams {
  status?: string;
  priority?: string;
  difficulty?: string;
  tags?: string;
  dueDate?: string;
  parentTaskId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TodoCompletion {
  id: string;
  taskId: string;
  userId: string;
  completedAt: string;
  xpEarned: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class TodoService {
  /**
   * Get all todos
   */
  static async getTodos(params: GetTodosParams = {}): Promise<{
    tasks: Todo[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.dueDate) queryParams.append('dueDate', params.dueDate);
      if (params.parentTaskId) queryParams.append('parentTaskId', params.parentTaskId);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await api.get(`/tasks?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching todos:', error);
      const message = error.response?.data?.message || 'Failed to fetch todos';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Get a single todo
   */
  static async getTodo(id: string): Promise<{ task: Todo }> {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching todo:', error);
      const message = error.response?.data?.message || 'Failed to fetch todo';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Create a new todo
   */
  static async createTodo(data: CreateTodoData): Promise<{ message: string; task: Todo }> {
    try {
      const response = await api.post('/tasks', data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Todo created successfully',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating todo:', error);
      const message = error.response?.data?.message || 'Failed to create todo';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Update a todo
   */
  static async updateTodo(
    id: string,
    data: UpdateTodoData
  ): Promise<{ message: string; task: Todo }> {
    try {
      const response = await api.put(`/tasks/${id}`, data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Todo updated successfully',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating todo:', error);
      const message = error.response?.data?.message || 'Failed to update todo';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Delete a todo (soft delete by default)
   */
  static async deleteTodo(id: string, permanent: boolean = false): Promise<{ message: string }> {
    try {
      console.log('TodoService.deleteTodo called with id:', id, 'permanent:', permanent);
      const response = await api.delete(`/tasks/${id}`, {
        params: { permanent: permanent ? 'true' : 'false' },
      });
      console.log('Delete todo response:', response.data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: permanent ? 'Todo permanently deleted' : 'Todo deleted',
        visibilityTime: 2000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      const message = error.response?.data?.message || 'Failed to delete todo';
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
   * Complete a todo
   */
  static async completeTodo(id: string, notes?: string): Promise<{
    message: string;
    completion: TodoCompletion;
    character?: any;
  }> {
    try {
      const response = await api.post(`/tasks/${id}/complete`, { notes });
      Toast.show({
        type: 'success',
        text1: 'Task Completed!',
        text2: `You earned ${response.data.completion.xpEarned} XP`,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error completing todo:', error);
      const message = error.response?.data?.message || 'Failed to complete todo';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Uncomplete a todo (by updating status back to pending/in_progress)
   */
  static async uncompleteTodo(id: string): Promise<{
    message: string;
    task: Todo;
  }> {
    try {
      // Update status to pending to uncomplete
      const response = await TodoService.updateTodo(id, { status: 'pending' });
      Toast.show({
        type: 'success',
        text1: 'Completion Removed',
        text2: 'Todo completion has been removed',
      });
      return {
        message: 'Todo uncompleted successfully',
        task: response.task,
      };
    } catch (error: any) {
      console.error('Error uncompleting todo:', error);
      const message = error.response?.data?.message || 'Failed to uncomplete todo';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      throw error;
    }
  }

  /**
   * Check if a todo is completed
   */
  static isTodoCompleted(todo: Todo): boolean {
    return todo.status === 'completed';
  }

  /**
   * Get active todos (not completed, not cancelled, not deleted)
   */
  static getActiveTodos(todos: Todo[]): Todo[] {
    return todos.filter(
      (todo) => {
        // Exclude completed todos
        if (todo.status === 'completed') return false;
        // Exclude cancelled todos that are marked as deleted
        if (todo.status === 'cancelled' && todo.metadata?.isDeleted) return false;
        // Include all other todos
        return true;
      }
    );
  }
}

export default TodoService;


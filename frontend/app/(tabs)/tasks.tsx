import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  TasksHeader,
  TabSelector,
  HabitCard,
  TodoCard,
  EmptyState,
} from '@/components/tasks';
import { HabitFormModal } from '@/components/tasks/HabitFormModal';
import { TodoFormModal } from '@/components/tasks/TodoFormModal';
import { ConfirmDialog } from '@/components/tasks/ConfirmDialog';
import HabitService, { Habit, CreateHabitData, UpdateHabitData } from '@/services/habits';
import TodoService, { Todo, CreateTodoData, UpdateTodoData } from '@/services/todos';
import UserService, { User } from '@/services/user';

// Types - Todo is now imported from TodoService

export default function TasksScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'habits' | 'todos'>('habits');
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState({
    level: 1,
    currentXP: 0,
    maxXP: 1000,
    rank: 'E-Rank',
  });
  
  // Modal state
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  // Todo modal state
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showDeleteTodoConfirm, setShowDeleteTodoConfirm] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const response = await UserService.getMe();
      setUser(response.user);
      const progress = UserService.calculateXPProgress(response.user.character);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  // Fetch habits
  const fetchHabits = useCallback(async () => {
    try {
      const response = await HabitService.getHabits({
        isActive: true,
        limit: 100,
      });
      
      // Transform habits to include completedToday and completionsThisWeek
      const transformedHabits = response.habits.map((habit) => ({
        ...habit,
        completedToday: HabitService.isHabitCompletedToday(habit),
        completionsThisWeek: 0, // Will be calculated if we have completions
      }));
      
      setHabits(transformedHabits);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  }, []);

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    try {
      const response = await TodoService.getTodos({
        status: 'pending,in_progress,completed', // Get active and completed todos (to allow uncompleting)
        limit: 100,
      });
      
      // Filter out deleted todos on the frontend (check status and metadata)
      setTodos(response.tasks.filter((todo) => {
        // Exclude if status is cancelled AND has isDeleted flag in metadata
        if (todo.status === 'cancelled' && todo.metadata?.isDeleted) {
          return false;
        }
        return true;
      }));
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUserData(), fetchHabits(), fetchTodos()]);
      setLoading(false);
    };
    loadData();
  }, [fetchUserData, fetchHabits, fetchTodos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchHabits(), fetchTodos()]);
    setRefreshing(false);
  }, [fetchUserData, fetchHabits, fetchTodos]);

  const handleHabitToggle = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    try {
      const isCompleted = HabitService.isHabitCompletedToday(habit);

      if (isCompleted) {
        // Uncomplete the habit
        const result = await HabitService.uncompleteHabit(habitId);
        
        // Update local state
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  completedToday: false,
                  currentStreak: result.habit.currentStreak,
                  totalCompletions: result.habit.totalCompletions,
                  lastCompletedDate: result.habit.lastCompletedDate,
                }
              : h
          )
        );

        // Refresh user data to update XP/level
        await fetchUserData();
      } else {
        // Complete the habit
        const result = await HabitService.completeHabit(habitId);
        
        // Update local state
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  completedToday: true,
                  currentStreak: result.habit.currentStreak,
                  longestStreak: result.habit.longestStreak,
                  totalCompletions: result.habit.totalCompletions,
                  lastCompletedDate: result.habit.lastCompletedDate,
                }
              : h
          )
        );

        // Refresh user data to update XP/level
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Error toast is already shown by HabitService
    }
  };

  const handleTodoToggle = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    try {
      const isCompleted = TodoService.isTodoCompleted(todo);

      if (isCompleted) {
        // Uncomplete the todo
        const result = await TodoService.uncompleteTodo(todoId);
        // Update local state
        setTodos((prev) =>
          prev.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  status: result.task.status,
                }
              : t
          )
        );
        await fetchUserData();
      } else {
        // Complete the todo
        const result = await TodoService.completeTodo(todoId);
        // Update local state
        setTodos((prev) =>
          prev.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  status: 'completed',
                }
              : t
          )
        );
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      // Error toast is already shown by TodoService
    }
  };

  const handleAddPress = () => {
    if (activeTab === 'habits') {
      setEditingHabit(null);
      setShowHabitModal(true);
    } else {
      setEditingTodo(null);
      setShowTodoModal(true);
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowHabitModal(true);
  };

  const handleDeleteHabit = (habitId: string) => {
    console.log('handleDeleteHabit called with habitId:', habitId);
    setHabitToDelete(habitId);
    setShowDeleteConfirm(true);
    console.log('Delete confirmation dialog should now be visible');
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;

    console.log('Delete confirmed by user, proceeding with deletion...', habitToDelete);
    
    try {
      // Close modals first for immediate feedback
      setShowDeleteConfirm(false);
      setShowHabitModal(false);
      setEditingHabit(null);
      
      // Delete the habit
      console.log('Calling HabitService.deleteHabit...');
      await HabitService.deleteHabit(habitToDelete, false);
      console.log('Habit deleted successfully, refreshing habits list...');
      
      // Refresh habits list
      await fetchHabits();
      console.log('Habits list refreshed');
      
      setHabitToDelete(null);
    } catch (error: any) {
      console.error('Error deleting habit:', error);
      // Error toast is already shown by HabitService
      // Reopen modal if delete failed so user can try again
      const habitToReopen = habits.find(h => h.id === habitToDelete);
      if (habitToReopen) {
        setEditingHabit(habitToReopen);
        setShowHabitModal(true);
      }
      setHabitToDelete(null);
    }
  };

  const cancelDeleteHabit = () => {
    console.log('Delete cancelled by user');
    setShowDeleteConfirm(false);
    setHabitToDelete(null);
  };

  // Todo handlers
  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowTodoModal(true);
  };

  const handleDeleteTodo = (todoId: string) => {
    console.log('handleDeleteTodo called with todoId:', todoId);
    setTodoToDelete(todoId);
    setShowDeleteTodoConfirm(true);
    console.log('Delete confirmation dialog should now be visible');
  };

  const confirmDeleteTodo = async () => {
    if (!todoToDelete) return;

    console.log('Delete confirmed by user, proceeding with deletion...', todoToDelete);
    
    try {
      // Close modals first for immediate feedback
      setShowDeleteTodoConfirm(false);
      setShowTodoModal(false);
      setEditingTodo(null);
      
      // Delete the todo
      console.log('Calling TodoService.deleteTodo...');
      await TodoService.deleteTodo(todoToDelete, false);
      console.log('Todo deleted successfully, refreshing todos list...');
      
      // Refresh todos list
      await fetchTodos();
      console.log('Todos list refreshed');
      
      setTodoToDelete(null);
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      // Error toast is already shown by TodoService
      // Reopen modal if delete failed so user can try again
      const todoToReopen = todos.find((t) => t.id === todoToDelete);
      if (todoToReopen) {
        setEditingTodo(todoToReopen);
        setShowTodoModal(true);
      }
      setTodoToDelete(null);
    }
  };

  const cancelDeleteTodo = () => {
    console.log('Delete cancelled by user');
    setShowDeleteTodoConfirm(false);
    setTodoToDelete(null);
  };

  const handleSubmitTodo = async (data: CreateTodoData | UpdateTodoData) => {
    try {
      if (editingTodo) {
        await TodoService.updateTodo(editingTodo.id, data);
      } else {
        await TodoService.createTodo(data as CreateTodoData);
      }
      await fetchTodos();
      setShowTodoModal(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Error submitting todo:', error);
      // Error toast is already shown by TodoService
    }
  };

  const handleSubmitHabit = async (data: CreateHabitData | UpdateHabitData) => {
    try {
      if (editingHabit) {
        await HabitService.updateHabit(editingHabit.id, data);
      } else {
        await HabitService.createHabit(data as CreateHabitData);
      }
      await fetchHabits();
      setShowHabitModal(false);
      setEditingHabit(null);
    } catch (error) {
      console.error('Error saving habit:', error);
      throw error; // Let modal handle the error
    }
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
    // TODO: Implement search
  };

  const activeHabits = habits.filter((h) => h.isActive);
  // Show all todos (pending, in_progress, and completed) so users can uncomplete completed ones
  // Filter out cancelled todos that are marked as deleted
  const activeTodos = todos.filter((t) => {
    // Exclude cancelled todos that have isDeleted flag in metadata
    if (t.status === 'cancelled' && t.metadata?.isDeleted) {
      return false;
    }
    return true;
  });
  const pendingTodos = activeTodos.filter((t) => t.status !== 'completed');

  const userName = UserService.getUserDisplayName(user || undefined);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TasksHeader
        userName={userName}
        level={userProgress.level}
        currentXP={userProgress.currentXP}
        maxXP={userProgress.maxXP}
        rank={userProgress.rank}
        onSearchPress={handleSearchPress}
        onAddPress={handleAddPress}
      />

      <TabSelector
        activeTab={activeTab}
        onTabChange={setActiveTab}
        habitCount={activeHabits.length}
        todoCount={pendingTodos.length}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activeTab === 'habits' ? (
          loading ? (
            <View style={styles.loadingContainer}>
              {/* Loading indicator could be added here */}
            </View>
          ) : activeHabits.length > 0 ? (
            activeHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                id={habit.id}
                title={habit.title}
                description={habit.description}
                frequency={habit.frequency}
                targetCount={habit.targetCount || (habit.frequency === 'daily' ? 7 : 1)}
                currentStreak={habit.currentStreak}
                completedToday={habit.completedToday || false}
                completionsThisWeek={habit.completionsThisWeek || 0}
                onPress={() => handleEditHabit(habit)}
                onToggle={handleHabitToggle}
              />
            ))
          ) : (
            <EmptyState type="habits" onAddPress={handleAddPress} />
          )
        ) : activeTodos.length > 0 ? (
          activeTodos.map((todo) => (
            <TodoCard
              key={todo.id}
              id={todo.id}
              title={todo.title}
              description={todo.description}
              dueDate={todo.dueDate ? new Date(todo.dueDate) : undefined}
              priority={todo.priority}
              status={todo.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'}
              onPress={() => handleEditTodo(todo)}
              onToggle={handleTodoToggle}
            />
          ))
        ) : (
          <EmptyState type="todos" onAddPress={handleAddPress} />
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Habit Form Modal */}
      <HabitFormModal
        visible={showHabitModal}
        habit={editingHabit}
        onClose={() => {
          setShowHabitModal(false);
          setEditingHabit(null);
        }}
        onSubmit={handleSubmitHabit}
        onDelete={handleDeleteHabit}
      />

      {/* Delete Confirmation Dialog for Habits */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Habit"
        message="Are you sure you want to delete this habit? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={confirmDeleteHabit}
        onCancel={cancelDeleteHabit}
      />

      {/* Todo Form Modal */}
      <TodoFormModal
        visible={showTodoModal}
        todo={editingTodo}
        onClose={() => {
          setShowTodoModal(false);
          setEditingTodo(null);
        }}
        onSubmit={handleSubmitTodo}
        onDelete={handleDeleteTodo}
      />

      {/* Delete Confirmation Dialog for Todos */}
      <ConfirmDialog
        visible={showDeleteTodoConfirm}
        title="Delete Todo"
        message="Are you sure you want to delete this todo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={confirmDeleteTodo}
        onCancel={cancelDeleteTodo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

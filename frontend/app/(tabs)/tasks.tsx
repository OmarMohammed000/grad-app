import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  TasksHeader,
  TabSelector,
  HabitCard,
  TodoCard,
  EmptyState,
} from '@/components/tasks';

// Types
interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  currentStreak: number;
  completedToday: boolean;
  completionsThisWeek: number;
}

interface Todo {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

// Mock data for demonstration
const MOCK_USER = {
  name: 'Hunter',
  level: 5,
  currentXP: 750,
  maxXP: 1000,
  rank: 'Bronze',
};

const MOCK_HABITS: Habit[] = [
  {
    id: '1',
    title: 'Morning Workout',
    description: '30 minutes',
    frequency: 'daily',
    targetCount: 7,
    currentStreak: 3,
    completedToday: true,
    completionsThisWeek: 3,
  },
  {
    id: '2',
    title: 'Read 20 Pages',
    description: 'Daily reading',
    frequency: 'daily',
    targetCount: 7,
    currentStreak: 27,
    completedToday: false,
    completionsThisWeek: 2,
  },
  {
    id: '3',
    title: 'Sleep 8 Hours',
    description: '11 PM - 7 AM',
    frequency: 'daily',
    targetCount: 7,
    currentStreak: 5,
    completedToday: true,
    completionsThisWeek: 5,
  },
];

const MOCK_TODOS: Todo[] = [
  {
    id: '1',
    title: 'Complete project proposal',
    description: 'Marketing department review',
    dueDate: new Date(),
    priority: 'high',
    status: 'in_progress',
  },
  {
    id: '2',
    title: 'Team meeting',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    priority: 'medium',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Review code changes',
    description: 'Pull request #234',
    dueDate: new Date(Date.now() + 172800000), // In 2 days
    priority: 'critical',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Update documentation',
    dueDate: new Date(Date.now() + 604800000), // In a week
    priority: 'low',
    status: 'completed',
  },
];

export default function TasksScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'habits' | 'todos'>('habits');
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [todos, setTodos] = useState(MOCK_TODOS);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleHabitToggle = (habitId: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === habitId
          ? { ...habit, completedToday: !habit.completedToday }
          : habit
      )
    );
  };

  const handleTodoToggle = (todoId: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              status: todo.status === 'completed' ? 'pending' : 'completed',
            }
          : todo
      )
    );
  };

  const handleAddPress = () => {
    console.log('Add new', activeTab);
    // Navigate to create screen
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
    // Navigate to search screen
  };

  const activeHabits = habits.filter((h) => h);
  const activeTodos = todos;
  const pendingTodos = activeTodos.filter((t) => t.status !== 'completed');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TasksHeader
        userName={MOCK_USER.name}
        level={MOCK_USER.level}
        currentXP={MOCK_USER.currentXP}
        maxXP={MOCK_USER.maxXP}
        rank={MOCK_USER.rank}
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
          activeHabits.length > 0 ? (
            activeHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                {...habit}
                onPress={() => console.log('Habit pressed:', habit.id)}
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
              {...todo}
              onPress={() => console.log('Todo pressed:', todo.id)}
              onToggle={handleTodoToggle}
            />
          ))
        ) : (
          <EmptyState type="todos" onAddPress={handleAddPress} />
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
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
});

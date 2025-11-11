import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Header, 
  UserProgressBar, 
  QuickActions, 
  TodaysQuests, 
  ActiveChallenges,
  Quest,
  Challenge
} from '@/components/home';
import { TodoFormModal } from '@/components/tasks/TodoFormModal';
import UserService, { User } from '@/services/user';
import TodoService, { CreateTodoData, Todo } from '@/services/todos';

export default function HomeScreen() {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState({
    level: 1,
    currentXP: 0,
    maxXP: 1000,
    rank: 'E-Rank',
  });
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);

  // Mock challenges data - replace with actual data from backend later
  // Set to empty array [] to see the empty state
  const [challenges] = useState<Challenge[]>([
    {
      id: '1',
      title: '30-Day Fitness Challenge',
      progress: 12,
      total: 30,
      daysLeft: 18,
      participants: 3,
      reward: 250,
      color: '#D946EF',
      icon: 'fitness',
    },
    {
      id: '2',
      title: 'Weekly Reading Goal',
      progress: 5,
      total: 7,
      daysLeft: 2,
      participants: 5,
      reward: 150,
      color: '#06D6A0',
      icon: 'book',
    },
  ]);

  // Transform Todo to Quest format
  const transformTodoToQuest = (todo: Todo): Quest => {
    // Map difficulty from todo to quest format
    const difficultyMap: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
      'easy': 'Easy',
      'medium': 'Medium',
      'hard': 'Hard',
      'extreme': 'Hard', // Map extreme to Hard for quest display
    };

    return {
      id: todo.id,
      title: todo.title,
      xp: todo.xpReward || 25, // Use xpReward or default to 25
      difficulty: difficultyMap[todo.difficulty] || 'Medium',
      completed: todo.status === 'completed',
    };
  };

  // Fetch todos with today's deadline
  const fetchTodaysQuests = useCallback(async () => {
    try {
      // Use backend's 'today' filter which handles date range properly
      const response = await TodoService.getTodos({
        dueDate: 'today', // Backend handles 'today' as a special filter
        status: 'pending,in_progress,completed', // Include all statuses to show completed ones too
        limit: 100,
      });

      // Transform todos to quests
      const transformedQuests = response.tasks.map(transformTodoToQuest);
      setQuests(transformedQuests);
    } catch (error) {
      console.error('Error fetching today\'s quests:', error);
      setQuests([]);
    }
  }, []);

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

  // Initial load
  useEffect(() => {
    fetchUserData();
    fetchTodaysQuests();
  }, [fetchUserData, fetchTodaysQuests]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchTodaysQuests()]);
    setRefreshing(false);
  };

  const handleToggleQuest = async (id: string) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest) return;

    try {
      if (quest.completed) {
        // Uncomplete the todo
        await TodoService.uncompleteTodo(id);
      } else {
        // Complete the todo
        await TodoService.completeTodo(id);
      }
      
      // Refresh quests and user data
      await Promise.all([fetchTodaysQuests(), fetchUserData()]);
    } catch (error) {
      console.error('Error toggling quest:', error);
      // Error toast is already shown by TodoService
    }
  };

  const handleAddTask = () => {
    setShowTodoModal(true);
  };

  const handleSubmitTodo = async (data: CreateTodoData) => {
    try {
      await TodoService.createTodo(data);
      setShowTodoModal(false);
      // Refresh quests and user data
      await Promise.all([fetchTodaysQuests(), fetchUserData()]);
    } catch (error) {
      console.error('Error creating todo:', error);
      // Error toast is already shown by TodoService
    }
  };

  const handleJoinChallenge = () => {
    console.log('Join Challenge pressed');
    // TODO: Navigate to challenges screen
  };

  const handlePressChallenge = (id: string) => {
    console.log('Challenge pressed:', id);
    // TODO: Navigate to challenge details screen
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Header 
        userName={UserService.getUserDisplayName(user || undefined)} 
        userAvatar={user?.profile?.avatarUrl} 
      />
      
      <UserProgressBar
        level={userProgress.level}
        currentXP={userProgress.currentXP}
        maxXP={userProgress.maxXP}
        rank={userProgress.rank}
      />

      <QuickActions
        onAddTask={handleAddTask}
        onJoinChallenge={handleJoinChallenge}
      />

      <TodaysQuests quests={quests} onToggleQuest={handleToggleQuest} />

      <ActiveChallenges
        challenges={challenges}
        onPressChallenge={handlePressChallenge}
      />

      {/* Todo Form Modal */}
      <TodoFormModal
        visible={showTodoModal}
        todo={null}
        onClose={() => setShowTodoModal(false)}
        onSubmit={handleSubmitTodo}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});

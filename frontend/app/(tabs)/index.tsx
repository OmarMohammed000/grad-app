import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Header,
  UserProgressBar,
  QuickActions,
  TodaysQuests,
  ActiveChallenges,

  Quest
} from '@/components/home';
import { TodoFormModal } from '@/components/tasks/TodoFormModal';
import UserService, { User } from '@/services/user';
import TodoService, { CreateTodoData, Todo } from '@/services/todos';
import { ChallengeService, Challenge } from '@/services/challenges';
import LeaderboardService, { LeaderboardEntry } from '@/services/leaderboard';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<any>(null);

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


  // Fetch active challenges
  const fetchChallenges = useCallback(async () => {
    try {
      const response = await ChallengeService.getChallenges({
        status: 'active',
        myChallenges: true,
        limit: 5,
      });

      // Transform backend challenges to UI format if needed, 
      // but the ActiveChallenges component likely expects the backend Challenge type
      // or a compatible interface. Let's check the type in ActiveChallenges.
      // Assuming it accepts the backend Challenge type for now.
      setChallenges(response.challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await LeaderboardService.getGlobalLeaderboard('all-time', 10);
      setLeaderboard(response.leaderboard || []);
      setUserRank(response.userRank);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUserData();
    fetchTodaysQuests();
    fetchChallenges();
    fetchLeaderboard();
  }, [fetchUserData, fetchTodaysQuests, fetchChallenges, fetchLeaderboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserData(),
      fetchTodaysQuests(),
      fetchChallenges(),
      fetchLeaderboard()
    ]);
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

  const handleSubmitTodo = async (data: CreateTodoData | any) => {
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
    // Navigate to challenges tab
    router.push('/(tabs)/challenges');
  };

  const handlePressChallenge = (id: string) => {
    router.push({
      pathname: '/challenge-detail',
      params: { id }
    });
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

      {/* Leaderboard Section */}
      <View style={[styles.section, { paddingHorizontal: 20, marginBottom: 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Players</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/stats')}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.leaderboardCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
          {/* User Rank (if available and not in top 10) */}
          {userRank && userRank.rank > 10 && (
            <View style={[styles.leaderboardItem, styles.userRankItem, { backgroundColor: theme.colors.primary + '15', borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
              <View style={styles.rankBadge}>
                <Text style={[styles.rankText, { color: theme.colors.primary, fontWeight: 'bold' }]}>#{userRank.rank}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: theme.colors.text, fontWeight: 'bold' }]}>You</Text>
                <Text style={[styles.playerLevel, { color: theme.colors.textSecondary }]}>Lvl {userRank.character.level}</Text>
              </View>
              <Text style={[styles.playerScore, { color: theme.colors.primary, fontWeight: 'bold' }]}>{userRank.character.totalXp} XP</Text>
            </View>
          )}

          {/* Top 10 List */}
          {leaderboard.map((entry, index) => {
            const isCurrentUser = user?.id === entry.userId;
            return (
              <View
                key={entry.userId}
                style={[
                  styles.leaderboardItem,
                  isCurrentUser && { backgroundColor: theme.colors.primary + '10' },
                  index !== leaderboard.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }
                ]}
              >
                <View style={[styles.rankBadge, index < 3 && { backgroundColor: index === 0 ? '#FFD70020' : index === 1 ? '#C0C0C020' : '#CD7F3220' }]}>
                  <Text style={[
                    styles.rankText,
                    { color: theme.colors.text },
                    index === 0 && { color: '#FFD700' },
                    index === 1 && { color: '#C0C0C0' },
                    index === 2 && { color: '#CD7F32' }
                  ]}>
                    #{entry.rank}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { color: theme.colors.text }, isCurrentUser && { fontWeight: 'bold' }]}>
                    {isCurrentUser ? 'You' : entry.displayName}
                  </Text>
                  <Text style={[styles.playerLevel, { color: theme.colors.textSecondary }]}>Lvl {entry.level}</Text>
                </View>
                <Text style={[styles.playerScore, { color: theme.colors.text }]}>{entry.totalXp} XP</Text>
              </View>
            );
          })}

          {leaderboard.length === 0 && (
            <View style={styles.emptyLeaderboard}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No players yet</Text>
            </View>
          )}
        </View>
      </View>

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
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  leaderboardCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userRankItem: {
    // Special styling for user rank when pinned
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  playerLevel: {
    fontSize: 12,
  },
  playerScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyLeaderboard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

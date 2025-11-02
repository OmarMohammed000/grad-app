import React, { useState } from 'react';
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

export default function HomeScreen() {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Mock user data - replace with actual data from backend later
  const [userData] = useState({
    name: 'Hunter Alex',
    avatar: undefined,
    level: 12,
    currentXP: 2840,
    maxXP: 3000,
    rank: 'Hunter',
  });

  // Mock quests data - replace with actual data from backend later
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: '1',
      title: 'Morning Workout',
      xp: 50,
      difficulty: 'Easy',
      completed: true,
    },
    {
      id: '2',
      title: 'Read 30 minutes',
      xp: 30,
      difficulty: 'Medium',
      completed: false,
    },
    {
      id: '3',
      title: 'Complete project milestone',
      xp: 100,
      difficulty: 'Hard',
      completed: false,
    },
  ]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch fresh data from backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleToggleQuest = (id: string) => {
    setQuests(prevQuests =>
      prevQuests.map(quest =>
        quest.id === id ? { ...quest, completed: !quest.completed } : quest
      )
    );
  };

  const handleAddTask = () => {
    console.log('Add Task pressed');
    // TODO: Navigate to add task screen
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
      <Header userName={userData.name} userAvatar={userData.avatar} />
      
      <UserProgressBar
        level={userData.level}
        currentXP={userData.currentXP}
        maxXP={userData.maxXP}
        rank={userData.rank}
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

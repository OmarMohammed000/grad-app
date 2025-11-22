import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import UserService, { User } from '@/services/user';
import LeaderboardService, { UserStats } from '@/services/leaderboard';
import {
  ProfileEditModal,
  ProfileHeader,
  ProfileStats,
  ProfileInfo,
} from '@/components/profile';
import { UserProgressBar } from '@/components/home';

export default function ProfileScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await UserService.getMe();
      setUser(response.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await LeaderboardService.getUserStats('me');
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchStats()]);
    setLoading(false);
  }, [fetchUserData, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchStats()]);
    setRefreshing(false);
  }, [fetchUserData, fetchStats]);

  const handleSaveProfile = useCallback(
    async (data: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      isPublicProfile?: boolean;
      notificationsEnabled?: boolean;
      emailNotifications?: boolean;
      soundEnabled?: boolean;
    }) => {
      try {
        await UserService.updateMe(data);
        await fetchUserData();
      } catch (error) {
        // Error is already handled by UserService
        throw error;
      }
    },
    [fetchUserData]
  );

  const userProgress = user?.character
    ? UserService.calculateXPProgress(user.character)
    : {
        level: 1,
        currentXP: 0,
        maxXP: 1000,
        rank: 'E-Rank',
      };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          user={user}
          onEditPress={() => setShowEditModal(true)}
        />

        <View style={styles.progressSection}>
          <UserProgressBar
            level={userProgress.level}
            currentXP={userProgress.currentXP}
            maxXP={userProgress.maxXP}
            rank={userProgress.rank}
          />
        </View>

        {stats && <ProfileStats stats={stats} />}

        <ProfileInfo user={user} />
      </ScrollView>

      <ProfileEditModal
        visible={showEditModal}
        user={user}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressSection: {
    marginTop: 20,
    marginHorizontal: 20,
  },
});

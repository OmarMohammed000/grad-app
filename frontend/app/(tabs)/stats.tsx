import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import LeaderboardService, {
  UserStats,
  ActivityPoint,
  LeaderboardEntry,
} from '@/services/leaderboard';
import {
  SummaryCards,
  SegmentedControl as StatsSegmentedControl,
  ActivityChart,
  LeaderboardList,
} from '@/components/stats';

type ActivityPeriod = 'weekly' | 'monthly' | 'yearly';
type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly';

export default function StatsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>('weekly');
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] =
    useState<LeaderboardPeriod>('all-time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const loadStats = useCallback(async () => {
    const response = await LeaderboardService.getUserStats('me');
    setStats(response);
  }, []);

  const loadActivity = useCallback(
    async (period: ActivityPeriod) => {
      const response = await LeaderboardService.getUserActivity(period, 'me');
      setActivity(response.activity);
    },
    []
  );

  const loadLeaderboard = useCallback(
    async (period: LeaderboardPeriod) => {
      const response = await LeaderboardService.getGlobalLeaderboard(period, 10);
      setLeaderboard(response.leaderboard);
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadActivity(activityPeriod),
        loadLeaderboard(leaderboardPeriod),
      ]);
    } finally {
      setLoading(false);
    }
  }, [activityPeriod, leaderboardPeriod, loadStats, loadActivity, loadLeaderboard]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleChangeActivityPeriod = async (period: ActivityPeriod) => {
    setActivityPeriod(period);
    try {
      await loadActivity(period);
    } catch (error) {
      // already handled in service
    }
  };

  const handleChangeLeaderboardPeriod = async (period: LeaderboardPeriod) => {
    setLeaderboardPeriod(period);
    try {
      await loadLeaderboard(period);
    } catch (error) {
      // handled
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Insights</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Track your progress & see where you stand
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="analytics" size={20} color={theme.colors.primary} />
          </View>
        </View>

        {stats && (
          <SummaryCards
            cards={[
              {
                icon: 'checkmark-circle',
                label: 'Tasks Completed',
                value: Number(stats.stats.tasks.completed) || 0,
                accentColor: theme.colors.success,
              },
              {
                icon: 'flame',
                label: 'Longest Streak',
                value: `${Math.round(Number(stats.stats.habits.maxStreak) || 0)} days`,
                accentColor: theme.colors.warning,
              },
              {
                icon: 'sparkles',
                label: 'XP Earned (Monthly)',
                value: `${Number(stats.stats.xp.monthly) || 0} XP`,
                accentColor: theme.colors.primary,
              },
            ]}
            backgroundColor={theme.colors.card}
            textColor={theme.colors.text}
            subTextColor={theme.colors.textSecondary}
          />
        )}

        <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Completion Trends
            </Text>
            <StatsSegmentedControl
              value={activityPeriod}
              options={[
                { label: 'Week', value: 'weekly' },
                { label: 'Month', value: 'monthly' },
                { label: 'Year', value: 'yearly' },
              ]}
              onChange={(value) => handleChangeActivityPeriod(value as ActivityPeriod)}
              backgroundColor={`${theme.colors.text}10`}
              activeColor={`${theme.colors.text}22`}
              textColor={theme.colors.textSecondary}
              activeTextColor={theme.colors.text}
            />
          </View>

          <ActivityChart
            data={activity}
            primaryColor={theme.colors.primary}
            secondaryColor={theme.colors.success}
            textColor={theme.colors.text}
            mutedTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Global Leaderboard
            </Text>
            <StatsSegmentedControl
              value={leaderboardPeriod}
              options={[
                { label: 'All', value: 'all-time' },
                { label: 'Month', value: 'monthly' },
                { label: 'Week', value: 'weekly' },
              ]}
              onChange={(value) =>
                handleChangeLeaderboardPeriod(value as LeaderboardPeriod)
              }
              backgroundColor={`${theme.colors.text}10`}
              activeColor={`${theme.colors.text}22`}
              textColor={theme.colors.textSecondary}
              activeTextColor={theme.colors.text}
            />
          </View>

          <LeaderboardList
            entries={leaderboard}
            textColor={theme.colors.text}
            subTextColor={theme.colors.textSecondary}
            borderColor={`${theme.colors.text}15`}
            iconColor={theme.colors.textSecondary}
          />
        </View>
      </ScrollView>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});



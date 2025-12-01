import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { LineChart } from 'react-native-chart-kit';
import adminService, { UserStats, ActivityData, UserChallenge } from '@/services/admin';
import Toast from 'react-native-toast-message';

interface UserDetailModalProps {
  userId: string | null;
  isVisible: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export default function UserDetailModal({ userId, isVisible, onClose, onUserUpdated }: UserDetailModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [activeTab, setActiveTab] = useState<'stats' | 'activity' | 'challenges'>('stats');

  useEffect(() => {
    if (isVisible && userId) {
      loadUserData();
    }
  }, [isVisible, userId, selectedPeriod]);

  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [statsData, activityData, challengesData] = await Promise.all([
        adminService.getUserStats(userId),
        adminService.getUserActivity(userId, selectedPeriod),
        adminService.getUserChallenges(userId)
      ]);

      setUserStats(statsData);
      setActivity(activityData);
      setChallenges(challengesData.challenges || []);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load user data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!userId) return;

    try {
      await adminService.updateUserRole(userId, newRole);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'User role updated successfully'
      });
      onUserUpdated?.();
      loadUserData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update role'
      });
    }
  };

  const handleDeactivate = async () => {
    if (!userId) return;

    try {
      await adminService.deactivateUser(userId);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'User deactivated successfully'
      });
      onUserUpdated?.();
      onClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to deactivate user'
      });
    }
  };

  const renderStats = () => {
    if (!userStats) return null;

    return (
      <View style={styles.section}>
        {/* User Info */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>User Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userStats.user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Role:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{userStats.user.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Status:</Text>
            <Text style={[styles.infoValue, { color: userStats.user.isActive ? theme.colors.success : theme.colors.danger }]}>
              {userStats.user.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Joined:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {new Date(userStats.user.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {userStats.user.lastLogin && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Last Login:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {new Date(userStats.user.lastLogin).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Character Info */}
        {userStats.character && (
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Character</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {userStats.character.level}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Level</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {userStats.character.totalXp}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total XP</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {userStats.character.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Streak</Text>
              </View>
              {userStats.character.rank && (
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: userStats.character.rank.color }]}>
                    {userStats.character.rank.name}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Rank</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tasks & Habits Stats */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Statistics</Text>

          <Text style={[styles.subTitle, { color: theme.colors.text }]}>Tasks</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {userStats.stats.tasks.total}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {userStats.stats.tasks.completed}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                {userStats.stats.tasks.active}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active</Text>
            </View>
          </View>

          <Text style={[styles.subTitle, { color: theme.colors.text, marginTop: 16 }]}>Habits</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {userStats.stats.habits.total}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {Math.round(userStats.stats.habits.avgStreak)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {userStats.stats.habits.maxStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Max Streak</Text>
            </View>
          </View>

          <Text style={[styles.subTitle, { color: theme.colors.text, marginTop: 16 }]}>XP Earned</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {userStats.stats.xp.weekly}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Weekly</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {userStats.stats.xp.monthly}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Monthly</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderActivity = () => {
    if (!activity || !activity.activity.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No activity data available
          </Text>
        </View>
      );
    }

    const screenWidth = Dimensions.get('window').width - 80;

    return (
      <View style={styles.section}>
        <View style={styles.periodSelector}>
          {(['weekly', 'monthly', 'yearly'] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodText,
                { color: selectedPeriod === period ? '#fff' : theme.colors.text }
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Activity Chart</Text>
          <LineChart
            data={{
              labels: activity.activity.map(a => a.label),
              datasets: [{
                data: activity.activity.map(a => a.xp),
                color: () => theme.colors.primary,
                strokeWidth: 2
              }]
            }}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.card,
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              labelColor: () => theme.colors.textSecondary,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: theme.colors.primary
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Activity Summary</Text>
          {activity.activity.map((item, index) => (
            <View key={index} style={styles.activityRow}>
              <Text style={[styles.activityLabel, { color: theme.colors.text }]}>{item.label}</Text>
              <View style={styles.activityStats}>
                <Text style={[styles.activityStat, { color: theme.colors.textSecondary }]}>
                  {item.tasks} tasks
                </Text>
                <Text style={[styles.activityStat, { color: theme.colors.textSecondary }]}>
                  {item.habits} habits
                </Text>
                <Text style={[styles.activityStat, { color: theme.colors.primary }]}>
                  {item.xp} XP
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderChallenges = () => {
    if (!challenges.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            User hasn't joined any challenges yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        {challenges.map(challenge => (
          <View key={challenge.id} style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.challengeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>
                  {challenge.title}
                </Text>
                {challenge.isGlobal && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.primary + '22' }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Global</Text>
                  </View>
                )}
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(challenge.status, theme) + '22' }
              ]}>
                <Text style={[styles.statusText, { color: getStatusColor(challenge.status, theme) }]}>
                  {challenge.status}
                </Text>
              </View>
            </View>

            <View style={styles.challengeStats}>
              <View style={styles.challengeStat}>
                <Text style={[styles.challengeStatLabel, { color: theme.colors.textSecondary }]}>
                  Progress
                </Text>
                <Text style={[styles.challengeStatValue, { color: theme.colors.text }]}>
                  {challenge.participation.currentProgress}/{challenge.goalTarget}
                </Text>
              </View>
              <View style={styles.challengeStat}>
                <Text style={[styles.challengeStatLabel, { color: theme.colors.textSecondary }]}>
                  Tasks Done
                </Text>
                <Text style={[styles.challengeStatValue, { color: theme.colors.text }]}>
                  {challenge.participation.completedTasksCount}/{challenge.totalTasks}
                </Text>
              </View>
              <View style={styles.challengeStat}>
                <Text style={[styles.challengeStatLabel, { color: theme.colors.textSecondary }]}>
                  XP Earned
                </Text>
                <Text style={[styles.challengeStatValue, { color: theme.colors.primary }]}>
                  {challenge.participation.totalXpEarned}
                </Text>
              </View>
              {challenge.participation.rank && (
                <View style={styles.challengeStat}>
                  <Text style={[styles.challengeStatLabel, { color: theme.colors.textSecondary }]}>
                    Rank
                  </Text>
                  <Text style={[styles.challengeStatValue, { color: theme.colors.text }]}>
                    #{challenge.participation.rank}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.challengeInfo}>
              <Text style={[styles.challengeInfoText, { color: theme.colors.textSecondary }]}>
                Role: {challenge.participation.role}
              </Text>
              <Text style={[styles.challengeInfoText, { color: theme.colors.textSecondary }]}>
                Joined: {new Date(challenge.participation.joinedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const getStatusColor = (status: string, theme: any) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'upcoming':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {userStats?.user.displayName || 'User Details'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[
              styles.tabText,
              { color: theme.colors.text },
              activeTab === 'stats' && { color: theme.colors.primary }
            ]}>
              Stats
            </Text>
            {activeTab === 'stats' && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[
              styles.tabText,
              { color: theme.colors.text },
              activeTab === 'activity' && { color: theme.colors.primary }
            ]}>
              Activity
            </Text>
            {activeTab === 'activity' && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
            onPress={() => setActiveTab('challenges')}
          >
            <Text style={[
              styles.tabText,
              { color: theme.colors.text },
              activeTab === 'challenges' && { color: theme.colors.primary }
            ]}>
              Challenges
            </Text>
            {activeTab === 'challenges' && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              {activeTab === 'stats' && renderStats()}
              {activeTab === 'activity' && renderActivity()}
              {activeTab === 'challenges' && renderChallenges()}
            </>
          )}
        </ScrollView>

        {/* Actions */}
        {userStats && !loading && (
          <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleChangeRole(userStats.user.role === 'admin' ? 'user' : 'admin')}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {userStats.user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
              </Text>
            </TouchableOpacity>
            {userStats.user.isActive && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
                onPress={handleDeactivate}
              >
                <Ionicons name="ban" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Deactivate</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 36,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  section: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  activityStat: {
    fontSize: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  challengeStat: {
    flex: 1,
    minWidth: '40%',
  },
  challengeStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  challengeStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  challengeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  challengeInfoText: {
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

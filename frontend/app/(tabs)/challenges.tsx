import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ChallengeService, Challenge, ChallengeSummary } from '@/services/challenges';
import {
  ChallengeCard,
  ChallengeSummaryCard,
  ChallengeFilterTabs,
  ChallengeSection,
  EmptyState,
  ChallengeFormModal,
} from '@/components/challenges';

type FilterTab = 'my' | 'group' | 'global';

export default function ChallengesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('my');
  const [summary, setSummary] = useState<ChallengeSummary>({
    activeCount: 0,
    completedThisMonth: 0,
  });
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [featuredChallenges, setFeaturedChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load summary stats
  const loadSummary = useCallback(async () => {
    try {
      const myChallenges = await ChallengeService.getChallenges({
        myChallenges: true,
        status: 'active',
      });
      const completed = await ChallengeService.getChallenges({
        myChallenges: true,
        status: 'completed',
        limit: 100,
      });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const completedThisMonth = completed.challenges.filter((c) => {
        const completedDate = c.completedAt ? new Date(c.completedAt) : new Date(c.endDate);
        return completedDate >= thisMonth;
      });

      setSummary({
        activeCount: myChallenges.challenges.length,
        completedThisMonth: completedThisMonth.length,
      });
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }, []);

  // Load challenges by filter
  const loadChallenges = useCallback(async () => {
    try {
      const params: any = {
        myChallenges: activeTab === 'my',
        page: 1,
        limit: 50,
      };

      // Don't send status parameter - backend defaults to showing 'upcoming' and 'active'
      // when status is not provided. For 'my' challenges, we want all statuses anyway.

      const response = await ChallengeService.getChallenges(params);

      // Categorize challenges
      const active = response.challenges.filter(
        (c) => c.status === 'active' && c.hasJoined
      );
      const featured = response.challenges.filter(
        (c) =>
          (c.status === 'upcoming' || c.status === 'active') &&
          !c.hasJoined &&
          c.isPublic
      );
      const completed = response.challenges
        .filter((c) => c.status === 'completed' && c.hasJoined)
        .slice(0, 10);

      setActiveChallenges(active);
      setFeaturedChallenges(featured);
      setCompletedChallenges(completed);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  }, [activeTab]);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadSummary(), loadChallenges()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadSummary, loadChallenges]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSummary(), loadChallenges()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadSummary, loadChallenges]);

  // Handle join challenge
  const handleJoinChallenge = useCallback(
    async (challengeId: string) => {
      if (joinLoading) return;

      setJoinLoading(challengeId);
      try {
        await ChallengeService.joinChallenge(challengeId);
        // Reload challenges after joining
        await loadChallenges();
        await loadSummary();
      } catch (error) {
        // Error is already handled by the service
      } finally {
        setJoinLoading(null);
      }
    },
    [joinLoading, loadChallenges, loadSummary]
  );

  // Handle challenge press
  const handleChallengePress = useCallback(
    (challengeId: string) => {
      router.push({
        pathname: '/challenge-detail',
        params: { id: challengeId },
      });
    },
    [router]
  );

  // Handle create challenge
  const handleCreateChallenge = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  // Handle submit challenge creation
  const handleSubmitChallenge = useCallback(
    async (data: any) => {
      try {
        await ChallengeService.createChallenge(data);
        // Reload challenges after creating
        await loadChallenges();
        await loadSummary();
        setShowCreateModal(false);
      } catch (error) {
        // Error is already handled by the service
        throw error;
      }
    },
    [loadChallenges, loadSummary]
  );

  // Load data on mount and when tab changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle tab change
  useEffect(() => {
    loadChallenges();
  }, [activeTab, loadChallenges]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Challenges
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleCreateChallenge}>
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Challenges
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCreateChallenge}>
            <Ionicons name="add" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <ChallengeSummaryCard
            icon="flame"
            label="Active Challenges"
            value={summary.activeCount}
            color="#D946EF"
          />
          <View style={styles.summarySpacer} />
          <ChallengeSummaryCard
            icon="trophy"
            label="Completed This Month"
            value={summary.completedThisMonth}
            color="#06D6A0"
          />
        </View>

        {/* Filter Tabs */}
        <ChallengeFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Active Challenges Section */}
        {activeChallenges.length > 0 && (
          <ChallengeSection title="🔥 Active Challenges" icon="flame">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={handleChallengePress}
              />
            ))}
          </ChallengeSection>
        )}

        {/* Featured Challenges Section */}
        {featuredChallenges.length > 0 && (
          <ChallengeSection title="👑 Featured Challenges" icon="star">
            {featuredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={handleChallengePress}
                onJoin={handleJoinChallenge}
                showJoinButton={true}
              />
            ))}
          </ChallengeSection>
        )}

        {/* Completed Challenges Section */}
        {completedChallenges.length > 0 && activeTab === 'my' && (
          <ChallengeSection title="✅ Recently Completed" icon="checkmark-circle">
            {completedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={handleChallengePress}
              />
            ))}
          </ChallengeSection>
        )}

        {/* Empty States */}
        {activeTab === 'my' &&
          activeChallenges.length === 0 &&
          featuredChallenges.length === 0 &&
          completedChallenges.length === 0 && (
            <EmptyState
              icon="trophy-outline"
              title="No Challenges Yet"
              message="Join a challenge or create your own to get started!"
            />
          )}

        {activeTab !== 'my' &&
          featuredChallenges.length === 0 &&
          activeChallenges.length === 0 && (
            <EmptyState
              icon="search-outline"
              title="No Challenges Found"
              message="There are no challenges available in this category right now."
            />
          )}
      </ScrollView>

      {/* Create Challenge Modal */}
      <ChallengeFormModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitChallenge}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  summarySpacer: {
    width: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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
  const [inviteCode, setInviteCode] = useState('');
  const [joinByCodeLoading, setJoinByCodeLoading] = useState(false);
  const [foundChallenge, setFoundChallenge] = useState<Challenge | null>(null);

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

      if (activeTab === 'global') {
        params.isGlobal = true;
      } else if (activeTab === 'group') {
        params.isPublic = true;
        params.isGlobal = false; // Exclude global challenges from "Group" tab
      }

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

  const handleViewHistory = useCallback(() => {
    router.push('/challenge-history');
  }, [router]);

  // Handle find challenge by code
  const handleFindByCode = useCallback(async () => {
    if (!inviteCode.trim()) {
      return;
    }

    setJoinByCodeLoading(true);
    try {
      const response = await ChallengeService.findChallengeByCode(inviteCode.trim());
      setFoundChallenge(response.challenge);
    } catch (error) {
      setFoundChallenge(null);
      // Error handled by service
    } finally {
      setJoinByCodeLoading(false);
    }
  }, [inviteCode]);

  // Handle join found challenge
  const handleJoinFoundChallenge = useCallback(async () => {
    if (!foundChallenge || joinByCodeLoading) return;

    setJoinByCodeLoading(true);
    try {
      await ChallengeService.joinChallenge(foundChallenge.id, {
        inviteCode: inviteCode.trim(),
      });
      // Reload challenges after joining
      await loadChallenges();
      await loadSummary();
      setInviteCode('');
      setFoundChallenge(null);
    } catch (error) {
      // Error handled by service
    } finally {
      setJoinByCodeLoading(false);
    }
  }, [foundChallenge, inviteCode, joinByCodeLoading, loadChallenges, loadSummary]);

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
            onPress={handleViewHistory}
          />
        </View>

        {/* Join by Code Section */}
        <View style={[styles.joinByCodeSection, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
          <View style={styles.joinByCodeHeader}>
            <Ionicons name="key-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.joinByCodeTitle, { color: theme.colors.text }]}>
              Join by Invite Code
            </Text>
          </View>
          <View style={styles.joinByCodeInputRow}>
            <View style={[styles.joinByCodeInputContainer, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.joinByCodeInput, { color: theme.colors.text }]}
                value={inviteCode}
                onChangeText={(text) => {
                  setInviteCode(text);
                  // Clear found challenge when code changes
                  if (foundChallenge) {
                    setFoundChallenge(null);
                  }
                }}
                placeholder="Enter invite code"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleFindByCode}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.joinByCodeButton,
                { backgroundColor: theme.colors.primary },
                (!inviteCode.trim() || joinByCodeLoading) && styles.joinByCodeButtonDisabled
              ]}
              onPress={handleFindByCode}
              disabled={!inviteCode.trim() || joinByCodeLoading}
              activeOpacity={0.7}
            >
              {joinByCodeLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="search" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          {foundChallenge && (
            <View style={[styles.foundChallengeCard, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '40' }]}>
              <View style={styles.foundChallengeHeader}>
                <Text style={[styles.foundChallengeTitle, { color: theme.colors.text }]}>
                  {foundChallenge.title}
                </Text>
                {foundChallenge.description && (
                  <Text style={[styles.foundChallengeDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {foundChallenge.description}
                  </Text>
                )}
              </View>
              <View style={styles.foundChallengeInfo}>
                <View style={styles.foundChallengeInfoItem}>
                  <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.foundChallengeInfoText, { color: theme.colors.textSecondary }]}>
                    {foundChallenge.currentParticipants}
                    {foundChallenge.maxParticipants ? `/${foundChallenge.maxParticipants}` : ''} participants
                  </Text>
                </View>
                <View style={styles.foundChallengeInfoItem}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.foundChallengeInfoText, { color: theme.colors.textSecondary }]}>
                    {ChallengeService.calculateDaysRemaining(foundChallenge.endDate)}d left
                  </Text>
                </View>
              </View>
              {foundChallenge.hasJoined ? (
                <View style={[styles.alreadyJoinedBadge, { backgroundColor: theme.colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                  <Text style={[styles.alreadyJoinedText, { color: theme.colors.success }]}>
                    Already Joined
                  </Text>
                </View>
              ) : foundChallenge.canJoin ? (
                <TouchableOpacity
                  style={[styles.joinFoundButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleJoinFoundChallenge}
                  disabled={joinByCodeLoading}
                  activeOpacity={0.7}
                >
                  {joinByCodeLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={18} color="#ffffff" />
                      <Text style={styles.joinFoundButtonText}>Join Challenge</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={[styles.cannotJoinBadge, { backgroundColor: theme.colors.danger + '20' }]}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.danger} />
                  <Text style={[styles.cannotJoinText, { color: theme.colors.danger }]}>
                    Cannot Join
                  </Text>
                </View>
              )}
            </View>
          )}
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
  joinByCodeSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  joinByCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  joinByCodeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  joinByCodeInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  joinByCodeInputContainer: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  joinByCodeInput: {
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  joinByCodeButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinByCodeButtonDisabled: {
    opacity: 0.5,
  },
  foundChallengeCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  foundChallengeHeader: {
    marginBottom: 12,
  },
  foundChallengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  foundChallengeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  foundChallengeInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  foundChallengeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foundChallengeInfoText: {
    fontSize: 13,
  },
  alreadyJoinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alreadyJoinedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  joinFoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  joinFoundButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cannotJoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cannotJoinText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

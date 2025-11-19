import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
// @ts-ignore - Clipboard is deprecated but still available in React Native
import { Clipboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ChallengeService,
  Challenge,
  ChallengeTask,
  ChallengeStats,
  LeaderboardEntry,
} from '@/services/challenges';
import { JoinChallengeModal, ChallengeTaskFormModal } from '@/components/challenges';
import Toast from 'react-native-toast-message';

export default function ChallengeDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [tasks, setTasks] = useState<ChallengeTask[]>([]);
  const [progress, setProgress] = useState<ChallengeStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [completeTaskLoading, setCompleteTaskLoading] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loadingInviteCode, setLoadingInviteCode] = useState(false);

  // Set navigation header title and styling to match custom header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.colors.background,
      },
      headerTintColor: theme.colors.text,
      headerTitleAlign: 'left',
      headerBackTitleVisible: false,
    
      headerTitle: () => (
        <View >
          <Text 
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.colors.text,
              flexShrink: 1,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {challenge?.title || 'Challenge'}
          </Text>
        </View>
      ),
    });
  }, [challenge?.title, navigation, theme.colors.background, theme.colors.text]);

  // Load challenge details
  const loadChallenge = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await ChallengeService.getChallenge(id);
      setChallenge(response.challenge);
      setTasks(response.challenge.challengeTasks || []);
      
      // Load invite code if user is creator/moderator and challenge is private
      if (!response.challenge.isPublic && 
          (response.challenge.createdBy === response.challenge.userParticipation?.userId ||
           response.challenge.userParticipation?.role === 'moderator')) {
        try {
          const inviteData = await ChallengeService.getInviteCode(id);
          setInviteCode(inviteData.inviteCode);
        } catch (error) {
          // Silently fail - user might not have permission
          console.log('Could not load invite code:', error);
        }
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    }
  }, [id]);

  // Load progress if user has joined
  const loadProgress = useCallback(async () => {
    if (!id || !challenge?.hasJoined) return;
    
    try {
      const response = await ChallengeService.getChallengeProgress(id);
      setProgress(response.stats);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, [id, challenge?.hasJoined]);

  // Load leaderboard if competitive
  const loadLeaderboard = useCallback(async () => {
    if (!id || challenge?.challengeType !== 'competitive') return;
    
    try {
      const response = await ChallengeService.getChallengeLeaderboard(id);
      setLeaderboard(response.leaderboard);
      setUserRank(response.userRank || null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }, [id, challenge?.challengeType]);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await loadChallenge();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadChallenge]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadChallenge(),
        challenge?.hasJoined && loadProgress(),
        challenge?.challengeType === 'competitive' && loadLeaderboard(),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadChallenge, loadProgress, loadLeaderboard, challenge]);

  // Load progress and leaderboard when challenge is loaded
  useEffect(() => {
    if (challenge) {
      if (challenge.hasJoined) {
        loadProgress();
      }
      if (challenge.challengeType === 'competitive') {
        loadLeaderboard();
      }
    }
  }, [challenge, loadProgress, loadLeaderboard]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle join challenge
  const handleJoin = useCallback(async () => {
    if (!id || joinLoading) return;
    
    // Show modal for private challenges
    if (challenge && !challenge.isPublic) {
      setShowJoinModal(true);
      return;
    }
    
    setJoinLoading(true);
    try {
      await ChallengeService.joinChallenge(id);
      await loadChallenge();
      await loadProgress();
    } catch (error) {
      // Error handled by service
    } finally {
      setJoinLoading(false);
    }
  }, [id, joinLoading, challenge, loadChallenge, loadProgress]);

  // Handle join success from modal
  const handleJoinSuccess = useCallback(async () => {
    await loadChallenge();
    await loadProgress();
    if (challenge?.challengeType === 'competitive') {
      await loadLeaderboard();
    }
  }, [loadChallenge, loadProgress, loadLeaderboard, challenge]);

  // Handle leave challenge
  const handleLeave = useCallback(async () => {
    if (!id) return;
    
    try {
      await ChallengeService.leaveChallenge(id);
      router.back();
    } catch (error) {
      // Error handled by service
    }
  }, [id, router]);

  // Handle complete task
  const handleCompleteTask = useCallback(async (taskId: string) => {
    if (!id || completeTaskLoading) return;
    
    setCompleteTaskLoading(taskId);
    try {
      await ChallengeService.completeChallengeTask(id, taskId);
      await Promise.all([loadChallenge(), loadProgress(), loadLeaderboard()]);
    } catch (error) {
      // Error handled by service
    } finally {
      setCompleteTaskLoading(null);
    }
  }, [id, completeTaskLoading, loadChallenge, loadProgress, loadLeaderboard]);

  // Handle add task
  const handleAddTask = useCallback(() => {
    setShowTaskModal(true);
  }, []);

  // Handle submit task
  const handleSubmitTask = useCallback(
    async (data: any) => {
      if (!id) return;
      try {
        await ChallengeService.addChallengeTask(id, data);
        await loadChallenge();
        setShowTaskModal(false);
      } catch (error) {
        // Error handled by service
        throw error;
      }
    },
    [id, loadChallenge]
  );

  // Handle copy invite code
  const handleCopyInviteCode = useCallback(async () => {
    if (!inviteCode) return;
    
    try {
      await Clipboard.setString(inviteCode);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Invite code copied to clipboard',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to copy invite code',
      });
    }
  }, [inviteCode]);

  // Handle regenerate invite code
  const handleRegenerateInviteCode = useCallback(async () => {
    if (!id) return;
    
    Alert.alert(
      'Regenerate Invite Code',
      'Are you sure you want to regenerate the invite code? The old code will no longer work.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setLoadingInviteCode(true);
            try {
              const data = await ChallengeService.getInviteCode(id, true);
              setInviteCode(data.inviteCode);
            } catch (error) {
              // Error handled by service
            } finally {
              setLoadingInviteCode(false);
            }
          },
        },
      ]
    );
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Challenge Not Found
          </Text>
        </View>
      </View>
    );
  }

  const daysRemaining = ChallengeService.calculateDaysRemaining(challenge.endDate);
  const color = ChallengeService.getChallengeColor(challenge.difficultyLevel, challenge.challengeType);
  const progressPercentage = progress
    ? parseFloat(progress.progressPercentage)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Info Section */}
        <View style={[styles.challengeInfoSection, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
          {challenge.description && (
            <Text style={[styles.challengeDescription, { color: theme.colors.textSecondary }]}>
              {challenge.description}
            </Text>
          )}

          {/* Invite Code Section (for private challenges, creators/moderators only) */}
          {!challenge.isPublic && inviteCode && 
           (challenge.createdBy === challenge.userParticipation?.userId ||
            challenge.userParticipation?.role === 'moderator') && (
            <View style={[styles.inviteCodeSection, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '40' }]}>
              <View style={styles.inviteCodeHeader}>
                <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.inviteCodeLabel, { color: theme.colors.primary }]}>
                  Invite Code
                </Text>
              </View>
              <View style={styles.inviteCodeRow}>
                <Text style={[styles.inviteCodeText, { color: theme.colors.text }]} selectable>
                  {inviteCode}
                </Text>
                <View style={styles.inviteCodeActions}>
                  <TouchableOpacity
                    style={[styles.inviteCodeButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleCopyInviteCode}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={18} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inviteCodeButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                    onPress={handleRegenerateInviteCode}
                    disabled={loadingInviteCode}
                    activeOpacity={0.7}
                  >
                    {loadingInviteCode ? (
                      <ActivityIndicator size="small" color={theme.colors.text} />
                    ) : (
                      <Ionicons name="refresh-outline" size={18} color={theme.colors.text} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.inviteCodeHint, { color: theme.colors.textSecondary }]}>
                Share this code with others to invite them to your private challenge
              </Text>
            </View>
          )}
          
          <View style={styles.challengeInfoRow}>
            <View style={styles.challengeInfoBadges}>
              <View style={[styles.challengeInfoBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                <Text style={[styles.challengeInfoBadgeText, { color: color }]}>
                  {challenge.status}
                </Text>
              </View>
              <View style={[styles.challengeInfoBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                <Text style={[styles.challengeInfoBadgeText, { color: color }]}>
                  {challenge.difficultyLevel}
                </Text>
              </View>
              <View style={[styles.challengeInfoBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                <Text style={[styles.challengeInfoBadgeText, { color: color }]}>
                  {challenge.challengeType}
                </Text>
              </View>
            </View>
            
            <View style={styles.challengeInfoStats}>
              <View style={styles.challengeInfoStatItem}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.challengeInfoStatText, { color: theme.colors.textSecondary }]}>
                  {daysRemaining}d left
                </Text>
              </View>
              <View style={styles.challengeInfoStatItem}>
                <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.challengeInfoStatText, { color: theme.colors.textSecondary }]}>
                  {challenge.currentParticipants}
                  {challenge.maxParticipants ? `/${challenge.maxParticipants}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Section */}
        {challenge.hasJoined && progress && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {progress.currentProgress} / {progress.goalTarget} ({progress.progressPercentage}%)
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {progress.completedTasksCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Tasks Done
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {progress.totalXpEarned}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  XP Earned
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {progress.streakDays}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
              {progress.rank && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    #{progress.rank}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Rank
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tasks Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tasks</Text>
            <View style={styles.sectionHeaderRight}>
              {tasks.length > 0 && (
                <Text style={[styles.taskCount, { color: theme.colors.textSecondary }]}>
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </Text>
              )}
              {/* Add Task Button (only for creators/moderators) */}
              {challenge.userParticipation && 
               (challenge.userParticipation.role === 'moderator' || challenge.createdBy === challenge.userParticipation.userId) && (
                <TouchableOpacity
                  style={[styles.addTaskButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddTask}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={styles.addTaskButtonText}>Add Task</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {tasks.length === 0 ? (
            <View style={styles.emptyTaskContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No tasks available yet
              </Text>
              {challenge.userParticipation && 
               (challenge.userParticipation.role === 'moderator' || challenge.createdBy === challenge.userParticipation.userId) && (
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Add tasks to get started
                </Text>
              )}
            </View>
          ) : (
            tasks.map((task, index) => {
              const taskTypeColor = task.taskType === 'required' 
                ? theme.colors.primary 
                : task.taskType === 'bonus' 
                ? theme.colors.warning 
                : theme.colors.textSecondary;
              
              const difficultyColor = task.difficulty === 'easy' 
                ? '#10B981' 
                : task.difficulty === 'medium' 
                ? '#3B82F6' 
                : task.difficulty === 'hard' 
                ? '#F59E0B' 
                : '#D946EF';

              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    { 
                      backgroundColor: theme.colors.card,
                      borderLeftWidth: 4,
                      borderLeftColor: taskTypeColor,
                    },
                    theme.shadows.md,
                    index === tasks.length - 1 && styles.lastTaskItem,
                  ]}
                >
                  {/* Task Header */}
                  <View style={styles.taskCardHeader}>
                    <View style={styles.taskCardTitleRow}>
                      <Text style={[styles.taskCardTitle, { color: theme.colors.text }]}>
                        {task.title}
                      </Text>
                      <View style={styles.taskCardBadges}>
                        <View 
                          style={[
                            styles.taskCardBadge, 
                            { backgroundColor: taskTypeColor + '20', borderColor: taskTypeColor + '40' }
                          ]}
                        >
                          <Text style={[styles.taskCardBadgeText, { color: taskTypeColor }]}>
                            {task.taskType}
                          </Text>
                        </View>
                        <View 
                          style={[
                            styles.taskCardBadge, 
                            { backgroundColor: difficultyColor + '20', borderColor: difficultyColor + '40' }
                          ]}
                        >
                          <Text style={[styles.taskCardBadgeText, { color: difficultyColor }]}>
                            {task.difficulty}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {task.description && (
                      <Text style={[styles.taskCardDescription, { color: theme.colors.textSecondary }]}>
                        {task.description}
                      </Text>
                    )}

                    {/* Task Meta Info */}
                    <View style={styles.taskCardMeta}>
                      {task.isRepeatable && (
                        <View style={[styles.taskCardMetaItem, { backgroundColor: theme.colors.primary + '15' }]}>
                          <Ionicons name="repeat" size={14} color={theme.colors.primary} />
                          <Text style={[styles.taskCardMetaText, { color: theme.colors.primary }]}>
                            Repeatable
                          </Text>
                        </View>
                      )}
                      {/* TODO: Verification system not yet implemented */}
                      {/* {task.requiresProof && (
                        <View style={[styles.taskCardMetaItem, { backgroundColor: theme.colors.warning + '15' }]}>
                          <Ionicons name="shield-checkmark" size={14} color={theme.colors.warning} />
                          <Text style={[styles.taskCardMetaText, { color: theme.colors.warning }]}>
                            Proof Required
                          </Text>
                        </View>
                      )} */}
                    </View>
                  </View>

                  {/* Task Rewards & Actions */}
                  <View style={styles.taskCardFooter}>
                    <View style={styles.taskCardRewards}>
                      <View style={[styles.taskCardRewardChip, { backgroundColor: theme.colors.backgroundSecondary }]}>
                        <Ionicons name="trophy" size={16} color={theme.colors.warning} />
                        <Text style={[styles.taskCardRewardText, { color: theme.colors.text }]}>
                          {task.pointValue} pts
                        </Text>
                      </View>
                      <View style={[styles.taskCardRewardChip, { backgroundColor: theme.colors.backgroundSecondary }]}>
                        <Ionicons name="star" size={16} color={theme.colors.warning} />
                        <Text style={[styles.taskCardRewardText, { color: theme.colors.text }]}>
                          {task.xpReward} XP
                        </Text>
                      </View>
                      {task.estimatedDuration && (
                        <View style={[styles.taskCardRewardChip, { backgroundColor: theme.colors.backgroundSecondary }]}>
                          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                          <Text style={[styles.taskCardRewardText, { color: theme.colors.textSecondary }]}>
                            {task.estimatedDuration}m
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {challenge.hasJoined && (
                      <TouchableOpacity
                        style={[
                          styles.taskCardCompleteButton,
                          { backgroundColor: theme.colors.success },
                          completeTaskLoading === task.id && styles.completeButtonDisabled,
                        ]}
                        onPress={() => handleCompleteTask(task.id)}
                        disabled={completeTaskLoading === task.id}
                        activeOpacity={0.8}
                      >
                        {completeTaskLoading === task.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                            <Text style={styles.taskCardCompleteButtonText}>Complete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Leaderboard Section */}
        {challenge.challengeType === 'competitive' && leaderboard.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Leaderboard</Text>
            {userRank && userRank.rank > 10 && (
              <View
                style={[
                  styles.leaderboardItem,
                  styles.userRankItem,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <Text style={[styles.rankText, { color: theme.colors.primary }]}>
                  #{userRank.rank}
                </Text>
                <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>
                  {userRank.displayName} (You)
                </Text>
                <Text style={[styles.leaderboardPoints, { color: theme.colors.textSecondary }]}>
                  {userRank.totalPoints} pts
                </Text>
              </View>
            )}
            {leaderboard.map((entry) => (
              <View
                key={entry.userId}
                style={[
                  styles.leaderboardItem,
                  { backgroundColor: theme.colors.backgroundSecondary },
                ]}
              >
                <Text style={[styles.rankText, { color: theme.colors.textSecondary }]}>
                  #{entry.rank}
                </Text>
                <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>
                  {entry.displayName}
                </Text>
                <Text style={[styles.leaderboardPoints, { color: theme.colors.textSecondary }]}>
                  {entry.totalPoints} pts
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!challenge.hasJoined && challenge.canJoin ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleJoin}
              disabled={joinLoading}
            >
              {joinLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Join Challenge</Text>
                </>
              )}
            </TouchableOpacity>
          ) : challenge.hasJoined ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
              onPress={handleLeave}
            >
              <Ionicons name="exit" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Leave Challenge</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {/* Join Modal for Private Challenges */}
      {challenge && (
        <JoinChallengeModal
          visible={showJoinModal}
          challengeId={challenge.id}
          challengeTitle={challenge.title}
          isPrivate={!challenge.isPublic}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />
      )}

      {/* Add Task Modal */}
      {challenge && (
        <ChallengeTaskFormModal
          visible={showTaskModal}
          challengeId={challenge.id}
          existingTasks={tasks}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleSubmitTask}
        />
      )}
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
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeInfoSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  challengeDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  challengeInfoRow: {
    gap: 12,
  },
  challengeInfoBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  challengeInfoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  challengeInfoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  challengeInfoStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  challengeInfoStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeInfoStatText: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addTaskButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyTaskContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#06D6A0',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  taskCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  lastTaskItem: {
    marginBottom: 0,
  },
  taskCardHeader: {
    padding: 16,
  },
  taskCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  taskCardBadges: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  taskCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  taskCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  taskCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  taskCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  taskCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  taskCardMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  taskCardRewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  taskCardRewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  taskCardRewardText: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskCardCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    minWidth: 110,
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  taskCardCompleteButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userRankItem: {
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  leaderboardPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  inviteCodeSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  inviteCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inviteCodeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  inviteCodeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  inviteCodeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteCodeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteCodeHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});


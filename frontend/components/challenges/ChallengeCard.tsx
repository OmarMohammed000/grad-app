import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Challenge, ChallengeService } from '@/services/challenges';

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: (id: string) => void;
  onJoin?: (id: string) => void;
  showJoinButton?: boolean;
}

export function ChallengeCard({ challenge, onPress, onJoin, showJoinButton }: ChallengeCardProps) {
  const theme = useTheme();
  const daysRemaining = ChallengeService.calculateDaysRemaining(challenge.endDate);
  const color = ChallengeService.getChallengeColor(challenge.difficultyLevel, challenge.challengeType);
  const icon = ChallengeService.getChallengeIcon(challenge.goalType, challenge.tags);
  
  // Calculate progress based on goalType
  let progress = 0;
  let total = challenge.goalTarget;
  let progressLabel = '';
  
  if (challenge.goalType === 'task_count') {
    progressLabel = 'tasks';
  } else if (challenge.goalType === 'total_xp') {
    progressLabel = 'XP';
  } else if (challenge.goalType === 'habit_streak') {
    progressLabel = 'days';
  } else {
    progressLabel = 'progress';
  }

  const progressPercentage = total > 0 ? (challenge.currentParticipants / total) * 100 : 0;

  return (
    <TouchableOpacity
      style={[styles.container, theme.shadows.md]}
      onPress={() => onPress(challenge.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.gradient, { backgroundColor: color }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon as any} size={24} color="#ffffff" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>
              {challenge.description && (
                <Text style={styles.description} numberOfLines={1}>
                  {challenge.description}
                </Text>
              )}
            </View>
          </View>
          {challenge.status === 'active' && challenge.hasJoined && (
            <View style={styles.badgeContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>Goal</Text>
            <Text style={styles.progressValue}>
              {challenge.goalTarget} {progressLabel}
            </Text>
          </View>
          
          <View style={styles.rewardSection}>
            <Text style={styles.rewardText}>+{challenge.xpReward} XP</Text>
            <Text style={styles.daysText}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { width: `${Math.min(progressPercentage, 100)}%` }
            ]} 
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.participantsContainer}>
            <Ionicons name="people" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.participantsText}>
              {ChallengeService.formatParticipantCount(challenge.currentParticipants)}
              {challenge.maxParticipants ? `/${challenge.maxParticipants}` : ''} participants
            </Text>
          </View>
          {showJoinButton && !challenge.hasJoined && challenge.canJoin && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={(e) => {
                e.stopPropagation();
                onJoin?.(challenge.id);
              }}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  badgeContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressSection: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  rewardSection: {
    alignItems: 'flex-end',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  daysText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  participantsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});


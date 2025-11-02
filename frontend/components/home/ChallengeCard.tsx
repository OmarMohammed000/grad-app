import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export interface Challenge {
  id: string;
  title: string;
  progress: number;
  total: number;
  daysLeft: number;
  participants: number;
  reward: number;
  color: string;
  icon: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: (id: string) => void;
}

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const theme = useTheme();
  const progress = (challenge.progress / challenge.total) * 100;

  return (
    <TouchableOpacity
      style={[styles.container, theme.shadows.md]}
      onPress={() => onPress(challenge.id)}
    >
      <View style={[styles.gradient, { backgroundColor: challenge.color }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <Ionicons name={challenge.icon as any} size={24} color="#ffffff" />
            </View>
            <Text style={styles.title}>{challenge.title}</Text>
          </View>
          <View style={styles.crownContainer}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>Progress</Text>
            <Text style={styles.progressValue}>
              {challenge.progress}/{challenge.total} days
            </Text>
          </View>
          
          <View style={styles.rewardSection}>
            <Text style={styles.rewardText}>+{challenge.reward} XP</Text>
            <Text style={styles.daysText}>{challenge.daysLeft} days left</Text>
          </View>
        </View>

        <View style={[styles.progressBarContainer]}>
          <View 
            style={[
              styles.progressBar,
              { width: `${progress}%` }
            ]} 
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.participantsContainer}>
            <Ionicons name="people" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.participantsText}>
              {challenge.participants} guild members participating
            </Text>
          </View>
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
    alignItems: 'center',
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  crownContainer: {
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
  },
  participantsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
});


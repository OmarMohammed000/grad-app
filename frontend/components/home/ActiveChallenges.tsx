import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { Challenge } from '@/services/challenges';
import { EmptyState } from './EmptyState';

interface ActiveChallengesProps {
  challenges: Challenge[];
  onPressChallenge: (id: string) => void;
}

export function ActiveChallenges({ challenges, onPressChallenge }: ActiveChallengesProps) {
  const theme = useTheme();
  const activeChallenges = challenges || [];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Active Challenges
      </Text>

      {activeChallenges.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="No Active Challenges"
          message="Join a challenge to compete with guild members and earn rewards!"
        />
      ) : (
        <View style={styles.challengesList}>
          {activeChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onPress={onPressChallenge}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  challengesList: {
    // No additional styles needed
  },
});


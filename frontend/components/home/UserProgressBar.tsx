import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface UserProgressBarProps {
  level: number;
  currentXP: number;
  maxXP: number;
  rank: string;
}

export function UserProgressBar({ level, currentXP, maxXP, rank }: UserProgressBarProps) {
  const theme = useTheme();
  const progress = (currentXP / maxXP) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
      <View style={styles.header}>
        <Text style={[styles.levelText, { color: theme.colors.text }]}>
          Level {level} {rank}
        </Text>
        <Text style={[styles.xpText, { color: theme.colors.textSecondary }]}>
          {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
        </Text>
      </View>
      
      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${progress}%`,
              backgroundColor: theme.colors.success 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  xpText: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});


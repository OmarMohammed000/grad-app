import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { UserStats } from '@/services/leaderboard';
import { StatCard } from './StatCard';

interface ProfileStatsProps {
  stats: UserStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const theme = useTheme();

  const statCards = [
    {
      icon: 'checkmark-circle' as const,
      value: Number(stats.stats.tasks.completed) || 0,
      label: 'Tasks Completed',
      iconColor: theme.colors.success,
    },
    {
      icon: 'flame' as const,
      value: Math.round(Number(stats.stats.habits.maxStreak) || 0),
      label: 'Longest Streak',
      iconColor: theme.colors.warning,
    },
    {
      icon: 'star' as const,
      value: Number(stats.stats.xp.total) || 0,
      label: 'Total XP',
      iconColor: theme.colors.primary,
    },
    {
      icon: 'trophy' as const,
      value: Number(stats.stats.habits.total) || 0,
      label: 'Active Habits',
      iconColor: theme.colors.secondary,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.card },
        theme.shadows.sm,
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Your Stats
      </Text>
      <View style={styles.grid}>
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            iconColor={stat.iconColor}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});


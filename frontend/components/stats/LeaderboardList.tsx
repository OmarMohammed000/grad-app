import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderboardEntry } from '@/services/leaderboard';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  textColor: string;
  subTextColor: string;
  borderColor: string;
  iconColor: string;
}

export function LeaderboardList({
  entries,
  textColor,
  subTextColor,
  borderColor,
  iconColor,
}: LeaderboardListProps) {
  if (entries.length === 0) {
    return (
      <Text style={[styles.empty, { color: subTextColor }]}>
        Leaderboard is empty.
      </Text>
    );
  }

  return (
    <View>
      {entries.map((entry) => (
        <View
          key={entry.rank}
          style={[styles.row, { borderBottomColor: borderColor }]}
        >
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{entry.rank}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: textColor }]}>
              {entry.displayName}
            </Text>
            <Text style={[styles.meta, { color: subTextColor }]}>
              Level {entry.level} • {entry.totalXp} XP
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={iconColor} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
  },
  empty: {
    fontSize: 14,
  },
});



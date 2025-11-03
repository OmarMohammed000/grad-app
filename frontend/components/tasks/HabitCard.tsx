import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface HabitCardProps {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  currentStreak: number;
  completedToday: boolean;
  completionsThisWeek?: number;
  onPress?: () => void;
  onToggle?: (habitId: string) => void;
}

export function HabitCard({
  id,
  title,
  description,
  frequency,
  targetCount,
  currentStreak,
  completedToday,
  completionsThisWeek = 0,
  onPress,
  onToggle,
}: HabitCardProps) {
  const theme = useTheme();

  const renderCompletionIndicators = () => {
    const indicators = [];
    const total = frequency === 'daily' ? 7 : targetCount;
    const completed = frequency === 'daily' ? completionsThisWeek : completedToday ? 1 : 0;

    for (let i = 0; i < Math.min(total, 7); i++) {
      const isCompleted = i < completed;
      indicators.push(
        <View
          key={i}
          style={[
            styles.indicator,
            {
              backgroundColor: isCompleted
                ? theme.colors.success
                : theme.colors.border,
            },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={12} color="#ffffff" />}
        </View>
      );
    }
    return indicators;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.colors.card },
        theme.shadows.sm,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            {description && (
              <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.checkButton,
              {
                backgroundColor: completedToday
                  ? theme.colors.success
                  : theme.colors.border,
              },
            ]}
            onPress={() => onToggle?.(id)}
          >
            {completedToday && <Ionicons name="checkmark" size={20} color="#ffffff" />}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.indicators}>{renderCompletionIndicators()}</View>
          
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color={theme.colors.warning} />
            <Text style={[styles.streakText, { color: theme.colors.textSecondary }]}>
              {currentStreak} days
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
  },
});


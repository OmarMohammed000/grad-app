import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { UserProgressBar } from '../home/UserProgressBar';

interface TasksHeaderProps {
  userName: string;
  level: number;
  currentXP: number;
  maxXP: number;
  rank: string;
  onSearchPress?: () => void;
  onAddPress?: () => void;
}

export function TasksHeader({
  userName,
  level,
  currentXP,
  maxXP,
  rank,
  onSearchPress,
  onAddPress,
}: TasksHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            Hello, {userName}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Tasks
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}
            onPress={onSearchPress}
          >
            <Ionicons name="search-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: theme.colors.primary },
              theme.shadows.sm,
            ]}
            onPress={onAddPress}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <UserProgressBar
          level={level}
          currentXP={currentXP}
          maxXP={maxXP}
          rank={rank}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
});


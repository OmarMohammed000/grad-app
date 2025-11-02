import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export type QuestDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Quest {
  id: string;
  title: string;
  xp: number;
  difficulty: QuestDifficulty;
  completed: boolean;
}

interface QuestItemProps {
  quest: Quest;
  onToggle: (id: string) => void;
}

export function QuestItem({ quest, onToggle }: QuestItemProps) {
  const theme = useTheme();
  
  const getDifficultyColor = (difficulty: QuestDifficulty) => {
    switch (difficulty) {
      case 'Easy':
        return theme.colors.success;
      case 'Medium':
        return theme.colors.warning;
      case 'Hard':
        return theme.colors.danger;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.card },
        theme.shadows.sm,
      ]}
      onPress={() => onToggle(quest.id)}
    >
      <View style={styles.leftContent}>
        <View 
          style={[
            styles.checkbox,
            { borderColor: theme.colors.primary },
            quest.completed && { backgroundColor: theme.colors.success }
          ]}
        >
          {quest.completed && (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          )}
        </View>
        
        <View style={styles.textContent}>
          <Text 
            style={[
              styles.title,
              { color: theme.colors.text },
              quest.completed && styles.completedText
            ]}
          >
            {quest.title}
          </Text>
          <Text style={[styles.xp, { color: theme.colors.success }]}>
            +{quest.xp} XP
          </Text>
        </View>
      </View>
      
      <View 
        style={[
          styles.badge,
          { backgroundColor: getDifficultyColor(quest.difficulty) + '20' }
        ]}
      >
        <Text style={[styles.badgeText, { color: getDifficultyColor(quest.difficulty) }]}>
          {quest.difficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  xp: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { QuestItem, Quest } from './QuestItem';

interface TodaysQuestsProps {
  quests: Quest[];
  onToggleQuest: (id: string) => void;
}

export function TodaysQuests({ quests, onToggleQuest }: TodaysQuestsProps) {
  const theme = useTheme();
  const remainingQuests = quests.filter(q => !q.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Today's Quests
        </Text>
        {quests.length > 0 && (
          <Text style={[styles.remaining, { color: theme.colors.textSecondary }]}>
            {remainingQuests} remaining
          </Text>
        )}
      </View>
      
      {quests.length === 0 ? (
        <View 
          style={[
            styles.emptyState,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm
          ]}
        >
          <View 
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.success + '20' }
            ]}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={48} 
              color={theme.colors.success} 
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            All Clear! 🎉
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
            No tasks due today. Great job staying on top of things!
          </Text>
        </View>
      ) : (
        <View style={styles.questsList}>
          {quests.map(quest => (
            <QuestItem 
              key={quest.id} 
              quest={quest} 
              onToggle={onToggleQuest}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  remaining: {
    fontSize: 14,
  },
  questsList: {
    // No additional styles needed
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});


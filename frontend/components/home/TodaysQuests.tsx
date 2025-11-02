import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
        <Text style={[styles.remaining, { color: theme.colors.textSecondary }]}>
          {remainingQuests} remaining
        </Text>
      </View>
      
      <View style={styles.questsList}>
        {quests.map(quest => (
          <QuestItem 
            key={quest.id} 
            quest={quest} 
            onToggle={onToggleQuest}
          />
        ))}
      </View>
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
});


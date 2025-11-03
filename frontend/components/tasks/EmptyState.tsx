import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '../form';

interface EmptyStateProps {
  type: 'habits' | 'todos';
  onAddPress?: () => void;
}

export function EmptyState({ type, onAddPress }: EmptyStateProps) {
  const theme = useTheme();

  const config = {
    habits: {
      icon: 'fitness' as const,
      title: 'No Habits Yet',
      description: 'Start building good habits to level up your journey',
      buttonText: 'Create Habit',
    },
    todos: {
      icon: 'checkmark-circle' as const,
      title: 'No Tasks Yet',
      description: 'Add tasks to keep track of what needs to be done',
      buttonText: 'Add Task',
    },
  };

  const { icon, title, description, buttonText } = config[type];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}
      >
        <Ionicons name={icon} size={48} color={theme.colors.textMuted} />
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>

      <Button
        title={buttonText}
        variant="primary"
        onPress={onAddPress}
        icon={<Ionicons name="add" size={20} color="#ffffff" />}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    minWidth: 180,
  },
});


import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface TodoCardProps {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  onPress?: () => void;
  onToggle?: (taskId: string) => void;
}

export function TodoCard({
  id,
  title,
  description,
  dueDate,
  priority,
  status,
  onPress,
  onToggle,
}: TodoCardProps) {
  const theme = useTheme();
  const isCompleted = status === 'completed';

  const getPriorityColor = () => {
    switch (priority) {
      case 'critical':
        return theme.colors.danger;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.primary;
      case 'low':
        return theme.colors.textMuted;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatDueDate = () => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (compareDate < today) {
      return 'Overdue';
    } else {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  };

  const dueDateText = formatDueDate();
  const isOverdue = dueDate && new Date(dueDate) < new Date() && !isCompleted;

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
          <TouchableOpacity
            style={[
              styles.checkButton,
              {
                backgroundColor: isCompleted
                  ? theme.colors.success
                  : 'transparent',
                borderWidth: isCompleted ? 0 : 2,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onToggle?.(id)}
          >
            {isCompleted && <Ionicons name="checkmark" size={20} color="#ffffff" />}
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                { color: theme.colors.text },
                isCompleted && styles.completedTitle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {description && (
              <Text
                style={[styles.description, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {description}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: getPriorityColor() },
            ]}
          />
        </View>

        {dueDateText && (
          <View style={styles.footer}>
            <View style={styles.dueDateContainer}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isOverdue ? theme.colors.danger : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.dueDateText,
                  {
                    color: isOverdue
                      ? theme.colors.danger
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {dueDateText}
              </Text>
            </View>
          </View>
        )}
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
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  description: {
    fontSize: 14,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    marginLeft: 40,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 13,
    fontWeight: '500',
  },
});


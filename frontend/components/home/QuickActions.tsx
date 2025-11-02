import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface QuickActionsProps {
  onAddTask: () => void;
  onJoinChallenge: () => void;
}

export function QuickActions({ onAddTask, onJoinChallenge }: QuickActionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Quick Actions
      </Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: theme.colors.primary },
            theme.shadows.md
          ]}
          onPress={onAddTask}
        >
          <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
          <Text style={styles.buttonText}>Add Task</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: theme.colors.success },
            theme.shadows.md
          ]}
          onPress={onJoinChallenge}
        >
          <Ionicons name="people-outline" size={24} color="#ffffff" />
          <Text style={styles.buttonText}>Join Challenge</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});


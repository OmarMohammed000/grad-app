import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ChallengeSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export function ChallengeSection({ title, icon, children }: ChallengeSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={theme.colors.primary}
            style={styles.icon}
          />
        )}
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});


import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { User } from '@/services/user';
import { InfoRow } from './InfoRow';

interface ProfileInfoProps {
  user: User | null;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.card },
        theme.shadows.sm,
      ]}
    >
      <InfoRow
        icon="shield-checkmark"
        label="Profile Visibility"
        value={user?.profile?.isPublicProfile ? 'Public' : 'Private'}
      />

      {user?.character && (
        <InfoRow
          icon="flame"
          label="Current Streak"
          value={`${user.character.streakDays || 0} days`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
  },
});


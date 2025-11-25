import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { VerificationQueue } from '@/components/challenges/VerificationQueue';
import { useTheme } from '@/contexts/ThemeContext';

export default function VerificationQueueScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Verification Queue',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
        }}
      />
      <VerificationQueue challengeId={challengeId} isModal={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface ThemedCardProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
  elevated?: boolean;
}

export function ThemedCard({ 
  children, 
  style, 
  lightColor, 
  darkColor,
  elevated = true,
  ...props 
}: ThemedCardProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor }, 
    'background'
  );
  
  return (
    <View
      style={[
        styles.card,
        { backgroundColor },
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: theme.colors.primary,
          text: '#ffffff',
          border: theme.colors.primary,
        };
      case 'secondary':
        return {
          background: theme.colors.secondary,
          text: '#ffffff',
          border: theme.colors.secondary,
        };
      case 'outline':
        return {
          background: theme.colors.backgroundSecondary,
          text: theme.colors.text,
          border: theme.colors.border,
        };
      case 'ghost':
        return {
          background: 'transparent',
          text: theme.colors.text,
          border: 'transparent',
        };
    }
  };

  const colors = getButtonColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        variant !== 'ghost' && theme.shadows.sm,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: colors.text }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});


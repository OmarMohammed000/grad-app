import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ThemedButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
}

export function ThemedButton({ 
  title, 
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  ...props
}: ThemedButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const buttonColors = {
    primary: {
      background: '#4285f4',
      text: '#ffffff',
      border: '#4285f4',
    },
    secondary: {
      background: colors.background,
      text: colors.text,
      border: colors.text,
    },
    outline: {
      background: 'transparent',
      text: '#4285f4',
      border: '#4285f4',
    },
    ghost: {
      background: 'transparent',
      text: colors.text,
      border: 'transparent',
    },
    danger: {
      background: '#EF476F',
      text: '#ffffff',
      border: '#EF476F',
    },
  };

  const sizeStyles = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      fontSize: 16,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      fontSize: 18,
    },
  };

  const buttonStyle = buttonColors[variant];
  const size_style = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: buttonStyle.background,
          borderColor: buttonStyle.border,
          paddingVertical: size_style.paddingVertical,
          paddingHorizontal: size_style.paddingHorizontal,
        },
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
        <ActivityIndicator color={buttonStyle.text} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, { color: buttonStyle.text, fontSize: size_style.fontSize }]}>
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Define your theme structure
export const lightTheme = {
  colors: {
    primary: '#4285f4',
    secondary: '#FF6B35',
    success: '#06D6A0',
    danger: '#EF476F',
    warning: '#FFB84D',
    
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    card: '#ffffff',
    
    text: '#11181C',
    textSecondary: '#666666',
    textMuted: '#999999',
    
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    icon: '#687076',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export const darkTheme: typeof lightTheme = {
  colors: {
    primary: '#4285f4',
    secondary: '#FF6B35',
    success: '#06D6A0',
    danger: '#EF476F',
    warning: '#FFB84D',
    
    background: '#0D1117',
    backgroundSecondary: '#161B22',
    card: '#1C2128',
    
    text: '#ECEDEE',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',
    
    border: '#30363D',
    shadow: 'rgba(0, 0, 0, 0.5)',
    icon: '#9BA1A6',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  fontSize: lightTheme.fontSize,
  shadows: lightTheme.shadows,
};

type Theme = typeof lightTheme;

const ThemeContext = createContext<Theme>(lightTheme);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

// Simple hook to access theme anywhere
export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
};


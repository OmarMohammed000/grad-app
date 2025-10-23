/**
 * Design tokens for the Grad Hunter app
 * Customize these to match your brand
 */

import { Platform } from 'react-native';

// Brand colors
const primaryColor = '#4285f4';      // Blue
const secondaryColor = '#FF6B35';    // Orange-red (hunter theme)
const successColor = '#06D6A0';      // Green
const dangerColor = '#EF476F';       // Red
const warningColor = '#FFB84D';      // Yellow/Orange

export const Colors = {
  light: {
    // Text
    text: '#11181C',
    textSecondary: '#666666',
    textMuted: '#999999',
    
    // Backgrounds
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    card: '#ffffff',
    
    // Brand
    primary: primaryColor,
    secondary: secondaryColor,
    success: successColor,
    danger: dangerColor,
    warning: warningColor,
    
    // UI
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
    
    // Ranks (gamification)
    rankE: '#808080',      // Gray
    rankD: '#8B4513',      // Brown
    rankC: '#CD7F32',      // Bronze
    rankB: '#C0C0C0',      // Silver
    rankA: '#FFD700',      // Gold
    rankS: '#E5E4E2',      // Platinum
    rankNational: '#FF4500', // Red-Orange
  },
  dark: {
    // Text
    text: '#ECEDEE',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',
    
    // Backgrounds
    background: '#0D1117',
    backgroundSecondary: '#161B22',
    card: '#1C2128',
    
    // Brand
    primary: primaryColor,
    secondary: secondaryColor,
    success: successColor,
    danger: dangerColor,
    warning: warningColor,
    
    // UI
    border: '#30363D',
    shadow: 'rgba(0, 0, 0, 0.5)',
    tint: primaryColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColor,
    
    // Ranks (gamification)
    rankE: '#808080',
    rankD: '#8B4513',
    rankC: '#CD7F32',
    rankB: '#C0C0C0',
    rankA: '#FFD700',
    rankS: '#E5E4E2',
    rankNational: '#FF4500',
  },
};

// Spacing system (based on 4px grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Font sizes
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

// Font weights
export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Shadows
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
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
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

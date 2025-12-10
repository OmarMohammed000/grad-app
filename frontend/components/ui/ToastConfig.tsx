import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BaseToast, ErrorToast, ToastProps } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

/*
  Custom Toast Configuration
  
  This file defines the look and feel of the app's toasts.
  We use the BaseToast and ErrorToast components but override their styles
  to match our premium design system.
*/

export const toastConfig = {
  /* 
    SUCCESS TOAST
    Used for: Task completion, successful login, saved settings
  */
  success: (props: ToastProps) => {
    // We can't use hooks directly inside the render function of the library in some versions,
    // but we can use a wrapper component if needed. 
    // However, standard practice with this lib is to style directly or use a component.
    // Since we need the theme, we'll assume this config is used where ThemeProvider is active.
    // But `toastConfig` is usually passed to `<Toast />` at the root.
    // To access the theme dynamically, we might need to define this *inside* a component or use a HOC.
    // For simplicity and performance, we'll use a functional component wrapper that uses the hook.
    return <ThemedToast {...props} type="success" icon="checkmark-circle" />;
  },

  /*
    ERROR TOAST
    Used for: Login failures, network errors, validation issues
  */
  error: (props: ToastProps) => {
    return <ThemedToast {...props} type="error" icon="alert-circle" />;
  },

  /*
    INFO TOAST
    Used for: General updates, "Coming Soon" messages
  */
  info: (props: ToastProps) => {
    return <ThemedToast {...props} type="info" icon="information-circle" />;
  }
};

// Helper component to access theme context
const ThemedToast = ({ type, text1, text2, icon }: any) => {
  const theme = useTheme();

  let backgroundColor = theme.colors.card;
  let borderLeftColor = theme.colors.primary;
  let iconColor = theme.colors.primary;

  if (type === 'success') {
    borderLeftColor = theme.colors.success;
    iconColor = theme.colors.success;
  } else if (type === 'error') {
    borderLeftColor = theme.colors.danger;
    iconColor = theme.colors.danger;
  } else if (type === 'info') {
    borderLeftColor = theme.colors.primary;
    iconColor = theme.colors.primary;
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.card,
        borderLeftColor: borderLeftColor,
        shadowColor: theme.colors.shadow,
      }
    ]}>
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          {text1 && (
            <Text style={[styles.title, { color: theme.colors.text }]}>{text1}</Text>
          )}
          {text2 && (
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{text2}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    minHeight: 60,
    borderRadius: 12,
    borderLeftWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 10,

    // Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  }
});

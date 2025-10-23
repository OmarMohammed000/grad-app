import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedCard } from '@/components/themed-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { Spacing } from '@/constants/theme';
import AuthService from '@/services/auth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Auth Hook - Note: this will log but won't auto-trigger
  // The hook must be called unconditionally per React rules
  const { request, response, promptAsync } = useGoogleAuth();

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleAuthSuccess(authentication?.accessToken, authentication?.idToken);
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Error', response.error?.message || 'Failed to sign in');
      setGoogleLoading(false);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (accessToken: string | undefined, idToken: string | undefined) => {
    if (!idToken) {
      Alert.alert('Error', 'No ID token received from Google');
      setGoogleLoading(false);
      return;
    }

    try {
      // Send ID token to backend for verification
      await AuthService.googleSignIn(idToken);
      router.replace('/(tabs)'); // Navigate to main app
    } catch (error: any) {
      Alert.alert('Sign-In Error', error.message || 'Failed to complete Google sign-in');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Validation
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Display name validation
    if (!displayName) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length < 3) {
      newErrors.displayName = 'Display name must be at least 3 characters';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleRegister = async () => {
    console.log('=== HANDLE REGISTER CALLED ===');
    console.log('Email:', email);
    console.log('Display Name:', displayName);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting registration...');
      console.log('API URL:', process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000');
      await AuthService.register(email, password, displayName);
      console.log('Registration successful, logging in...');
      // Auto login after registration
      await AuthService.login(email, password);
      console.log('Login successful, navigating to tabs');
      router.replace('/(tabs)');
    } catch (error: any) {
      // Error handled by AuthService with toast
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('=== HANDLE GOOGLE SIGN-IN CALLED ===');
    setGoogleLoading(true);
    try {
      // Trigger Google Sign-In prompt
      await promptAsync();
    } catch (error) {
      Alert.alert('Error', 'Failed to start Google sign-in');
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Join the Hunt
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Create your Hunter account and begin your journey 🎯
            </ThemedText>
          </ThemedView>

          {/* Registration Form Card */}
          <ThemedCard style={styles.card}>
            <ThemedInput
              label="Display Name"
              placeholder="Hunter Name"
              value={displayName}
              onChangeText={setDisplayName}
              leftIcon="person-outline"
              error={errors.displayName}
              autoCapitalize="words"
            />

            <ThemedInput
              label="Email"
              placeholder="hunter@example.com"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ThemedInput
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              error={errors.password}
              secureTextEntry={!showPassword}
            />

            <ThemedInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
            />

            <ThemedButton
              title="Create Account"
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={googleLoading}
              onPress={handleRegister}
              icon={<Ionicons name="checkmark-circle-outline" size={20} color="white" />}
              style={styles.registerButton}
            />
          </ThemedCard>

          {/* Divider */}
          <ThemedView style={styles.divider}>
            <ThemedView style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>OR</ThemedText>
            <ThemedView style={styles.dividerLine} />
          </ThemedView>

          {/* Google Sign-In */}
          <ThemedButton
            title="Continue with Google"
            variant="outline"
            size="large"
            fullWidth
            loading={googleLoading}
            disabled={loading || !request}
            onPress={handleGoogleSignIn}
            icon={<Ionicons name="logo-google" size={20} color="#4285f4" />}
          />

          {/* Login Link */}
          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Already have an account?{' '}
            </ThemedText>
            <ThemedButton
              title="Sign In"
              variant="ghost"
              size="small"
              onPress={() => router.push('/login')}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: Spacing.md,
  },
  registerButton: {
    marginTop: Spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    opacity: 0.7,
  },
  infoCard: {
    marginTop: Spacing.lg,
    backgroundColor: '#f0f8ff',
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
    fontSize: 16,
  },
  infoText: {
    lineHeight: 24,
    opacity: 0.8,
  },
});
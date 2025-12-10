import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useTheme } from '@/contexts/ThemeContext';
import { Input, Button, Card, Divider } from '@/components/form';
import AuthService from '@/services/auth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function RegisterScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  // Google Auth Hook
  const { request, response, promptAsync } = useGoogleAuth();

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleAuthSuccess(authentication?.accessToken, authentication?.idToken);
    } else if (response?.type === 'error') {
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Error',
        text2: response.error?.message || 'Failed to sign in'
      });
      setGoogleLoading(false);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (accessToken: string | undefined, idToken: string | undefined) => {
    if (!idToken && !accessToken) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No credentials received from Google'
      });
      setGoogleLoading(false);
      return;
    }

    try {
      // Pass both tokens - backend will use whichever is valid (ID token preferred, Access token fallback)
      await AuthService.googleSignIn(idToken, accessToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Sign-In Error',
        text2: error.message || 'Failed to complete Google sign-in'
      });
    } finally {
      setGoogleLoading(false);
    }
  };

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
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await AuthService.register(email, password, displayName);
      // Auto login after registration
      await AuthService.login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      // Error handled by AuthService with toast
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start Google sign-in'
      });
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Ready to rise?
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Create your account and begin your journey 🎯
            </Text>
          </View>

          {/* Registration Form Card */}
          <Card style={styles.card}>
            <Input
              label="Display Name"
              leftIcon="person-outline"
              placeholder="Name"
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              autoCapitalize="words"
            />

            <Input
              label="Email"
              leftIcon="mail-outline"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Input
              label="Confirm Password"
              leftIcon="lock-closed-outline"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              disabled={googleLoading}
              fullWidth
              icon={<Ionicons name="checkmark-circle-outline" size={20} color="white" />}
            />
          </Card>

          <Divider />

          {/* Google Sign-In */}
          <Button
            title="Continue with Google"
            variant="outline"
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={loading || !request}
            fullWidth
            icon={<Ionicons name="logo-google" size={20} color={theme.colors.primary} />}
          />

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  card: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

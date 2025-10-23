import api, { TokenManager } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface User {
  id: string;
  email: string;
  displayName: string;
  level: number;
  currentXp: number;
  totalXp: number;
  rank: {
    name: string;
    color: string;
  };
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

export class AuthService {
  // Email/Password Registration
  static async register(email: string, password: string, displayName?: string): Promise<{ message: string; userId: string }> {
    try {
      console.log('📝 AuthService.register called with:', { email, displayName });
      console.log('📝 About to make API call to:', process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000');
      
      const requestData = {
        email,
        password,
        displayName,
      };
      console.log('📝 Request data:', requestData);
      
      console.log('📝 Calling api.post...');
      const response = await api.post('/auth/register', requestData);
      console.log('📝 API call completed successfully');

      Toast.show({
        type: 'success',
        text1: 'Registration Successful!',
        text2: 'Welcome to Grad Hunter! 🎉',
      });

      return response.data;
    } catch (error: any) {
      console.error('📝 AuthService.register error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let message = 'Registration failed';
      
      if (error.code === 'ECONNABORTED') {
        message = 'Request timeout - Cannot reach server';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        message = 'Network error - Check if backend is running and accessible';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: message,
      });
      throw error;
    }
  }

  // Email/Password Login
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, user } = response.data;

      // Store tokens and user data
      await TokenManager.setAccessToken(accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Level ${user.level} ${user.rank.name} Hunter`,
      });

      return { accessToken, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
      throw error;
    }
  }

  // Google Sign-In using Expo Auth Session
  // Exchanges Google ID token with backend for app tokens
  static async googleSignIn(idToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/google', {
        idToken,
      });

      const { accessToken, user } = response.data;

      // Store tokens and user data
      await TokenManager.setAccessToken(accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: `Signed in as ${user.displayName}`,
      });

      return { accessToken, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google sign-in failed';
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Failed',
        text2: message,
      });
      throw error;
    }
  }

  // Get user info from Google using access token
  static async getUserInfoFromGoogle(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching Google user info:', error);
      throw error;
    }
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      // Call backend logout
      await api.post('/auth/logout');

      // Clear local storage
      await TokenManager.clearAll();

      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'See you later, Hunter!',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if backend call fails
      await TokenManager.clearAll();
    }
  }

  // Refresh Token
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken, user } = response.data;

      await TokenManager.setAccessToken(accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      return { accessToken, user };
    } catch (error) {
      await TokenManager.clearAll();
      throw error;
    }
  }

  // Get Current User
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const token = await TokenManager.getAccessToken();
    const user = await this.getCurrentUser();
    return !!(token && user);
  }
}

export default AuthService;
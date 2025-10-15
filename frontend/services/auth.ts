import api, { TokenManager } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleSignin from '../config/google';
import Toast from 'react-native-toast-message';

export class AuthService {
  // Email/Password Registration
  static async register(email, password, displayName) {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        displayName,
      });

      Toast.show({
        type: 'success',
        text1: 'Registration Successful!',
        text2: 'Welcome to Grad Hunter! 🎉',
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: message,
      });
      throw error;
    }
  }

  // Email/Password Login
  static async login(email, password) {
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
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
      throw error;
    }
  }

  // Google Sign-In
  static async googleSignIn() {
    try {
      // Check if device supports Google Play services
      await GoogleSignin.hasPlayServices();

      // Get user info from Google
      const userInfo = await GoogleSignin.signIn();

      // Send idToken to backend
      const response = await api.post('/auth/google', {
        idToken: userInfo.data.idToken,
      });

      const { accessToken, user } = response.data;

      // Store tokens and user data
      await TokenManager.setAccessToken(accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: `Level ${user.level} ${user.rank.name} Hunter`,
      });

      return { accessToken, user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      let message = 'Google sign-in failed';
      if (error.code === 'SIGN_IN_CANCELLED') {
        message = 'Sign-in was cancelled';
      } else if (error.code === 'IN_PROGRESS') {
        message = 'Sign-in is already in progress';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        message = 'Google Play services not available';
      }

      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Failed',
        text2: message,
      });
      
      throw error;
    }
  }

  // Logout
  static async logout() {
    try {
      // Call backend logout
      await api.post('/auth/logout');

      // Sign out from Google
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }

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
      
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
    }
  }

  // Refresh Token
  static async refreshToken() {
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
  static async getCurrentUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated() {
    const token = await TokenManager.getAccessToken();
    const user = await this.getCurrentUser();
    return !!(token && user);
  }
}

export default AuthService;
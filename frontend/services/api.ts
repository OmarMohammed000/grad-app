import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const TokenManager = {
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('accessToken');
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('accessToken', token);
  },

  async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync('accessToken');
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('refreshToken');
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('refreshToken', token);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync('refreshToken');
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
      AsyncStorage.removeItem('user'),
    ]);
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true, // Include cookies
        });
        
        const { accessToken, user } = response.data;
        await TokenManager.setAccessToken(accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await TokenManager.clearAll();
        // You can dispatch a logout action here or use navigation
        console.log('Session expired, please login again');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
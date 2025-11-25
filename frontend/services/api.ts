import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://fransisca-bloomed-trustingly.ngrok-free.dev';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000');

console.log('🔧 API Configuration:');
console.log('  - Base URL:', API_URL);
console.log('  - Timeout:', API_TIMEOUT, 'ms');
console.log('  - Important: Use your computer\'s IP address (not localhost) when testing on mobile!');

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  // Don't set default Content-Type - let axios auto-detect based on request body
});

// Token management with web fallback
export const TokenManager = {
  async getAccessToken(): Promise<string | null> {
    try {
      // SecureStore is not available on web, use AsyncStorage instead
      if (SecureStore.isAvailableAsync) {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          return await SecureStore.getItemAsync('accessToken');
        }
      }
      // Fallback to AsyncStorage for web
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.warn('Error getting access token:', error);
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      if (SecureStore.isAvailableAsync) {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          await SecureStore.setItemAsync('accessToken', token);
          return;
        }
      }
      await AsyncStorage.setItem('accessToken', token);
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  },

  async removeAccessToken(): Promise<void> {
    try {
      if (SecureStore.isAvailableAsync) {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          await SecureStore.deleteItemAsync('accessToken');
          return;
        }
      }
      await AsyncStorage.removeItem('accessToken');
    } catch (error) {
      console.error('Error removing access token:', error);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (SecureStore.isAvailableAsync) {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          return await SecureStore.getItemAsync('refreshToken');
        }
      }
      return await AsyncStorage.getItem('refreshToken');
    } catch (error) {
      console.warn('Error getting refresh token:', error);
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      if (SecureStore.isAvailableAsync) {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          await SecureStore.setItemAsync('refreshToken', token);
          return;
        }
      }
      await AsyncStorage.setItem('refreshToken', token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  },

  async removeRefreshToken(): Promise<void> {
    try {
      if (SecureStore.isAvailableAsync) {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          await SecureStore.deleteItemAsync('refreshToken');
          return;
        }
      }
      await AsyncStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Error removing refresh token:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.removeAccessToken(),
        this.removeRefreshToken(),
        AsyncStorage.removeItem('user'),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
};

// Request interceptor to add auth token and log requests
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('🔑 Getting access token...');
      const token = await TokenManager.getAccessToken();
      console.log('🔑 Token retrieved:', token ? 'exists' : 'none');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('⚠️  Failed to get access token:', error);
      // Continue without token
    }

    // Set Content-Type if not already set (FormData will set it automatically with boundary)
    if (config.data instanceof FormData) {
      // For FormData, remove Content-Type to let axios set it with boundary
      delete config.headers['Content-Type'];
      console.log('📤 FormData detected - letting axios set Content-Type with boundary');
    } else if (!config.headers['Content-Type']) {
      // Default to JSON for non-FormData requests
      config.headers['Content-Type'] = 'application/json';
    }

    // Log request details
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data instanceof FormData ? 'FormData' : config.data,
      headers: config.headers,
    });

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and log responses
api.interceptors.response.use(
  async (response) => {
    // Check if backend auto-refreshed the token (from middleware)
    const newAccessToken = response.headers['x-new-access-token'];
    if (newAccessToken) {
      console.log('🔄 Auto-refreshed token received from backend');
      await TokenManager.setAccessToken(newAccessToken);
    }

    // Log successful response
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    // Log error response
    console.error('❌ API Error Response:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });

    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Request timeout - Server not reachable');
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('🌐 Network error - Check if backend is running and accessible');
      console.error('   Current API URL:', API_URL);
      console.error('   Are you using the correct IP address for mobile testing?');
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from storage (React Native doesn't handle cookies automatically)
        const refreshToken = await TokenManager.getRefreshToken();

        if (!refreshToken) {
          console.error('❌ No refresh token available');
          await TokenManager.clearAll();
          return Promise.reject(new Error('No refresh token available'));
        }

        // Try to refresh token - send refresh token in body for React Native compatibility
        console.log('🔄 Attempting to refresh access token...');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: refreshToken
        }, {
          withCredentials: true, // Include cookies for web compatibility
        });

        const { accessToken, user } = response.data;

        // Store new access token
        await TokenManager.setAccessToken(accessToken);

        // Update refresh token if a new one is provided (token rotation)
        if (response.data.refreshToken) {
          await TokenManager.setRefreshToken(response.data.refreshToken);
        }

        await AsyncStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Token refreshed successfully');

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        // Refresh failed, clear tokens and redirect to login
        await TokenManager.clearAll();
        // You can dispatch a logout action here or use navigation
        console.log('Session expired, please login again');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const uploadImage = async (uri: string): Promise<string> => {
  try {
    console.log('📤 Starting image upload for URI:', uri);

    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    console.log('📝 Image details:', { filename, type });

    // @ts-ignore - React Native expects this format for FormData
    formData.append('image', { uri, name: filename, type });

    console.log('📦 FormData prepared, sending to /upload endpoint...');

    // Don't set Content-Type - let axios handle it automatically for FormData
    const response = await api.post('/upload', formData);

    console.log('✅ Upload successful! URL:', response.data.url);
    return response.data.url;
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

export default api;
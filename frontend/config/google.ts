// Google OAuth Configuration using Expo Auth Session
import * as WebBrowser from 'expo-web-browser';

// Complete the auth session for proper redirect handling
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth Configuration
 * 
 * To get these values:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Google+ API
 * 4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
 * 5. Create a Web application client ID
 * 
 * Important: Add these redirect URIs in Google Console:
 * - https://auth.expo.io/@YOUR_EXPO_USERNAME/YOUR_APP_SLUG
 * - For local testing: http://localhost:19006
 */

export const GoogleConfig = {
  // Web Client ID - Get this from Google Cloud Console
  // Format: XXXXXXXXXX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
  
  // iOS Client ID (optional, only needed for standalone iOS builds)
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  
  // Android Client ID (optional, only needed for standalone Android builds)
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
};

export default GoogleConfig;
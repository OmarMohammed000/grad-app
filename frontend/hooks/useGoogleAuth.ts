/**
 * Google Sign-In Hook using Expo Auth Session
 * 
 * This hook provides Google OAuth authentication using web-based flow
 * Compatible with Expo Go (no native modules required)
 */

import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleConfig } from '@/config/google';
import { makeRedirectUri } from 'expo-auth-session';

/**
 * Hook for Google OAuth authentication
 * 
 * @returns Object containing:
 * - request: Auth request configuration
 * - response: Auth response after sign-in
 * - promptAsync: Function to trigger Google Sign-In
 */
export const useGoogleAuth = () => {
  const redirectUri = makeRedirectUri({
    scheme: 'frontend',
    path: 'redirect',
  });

  // Only log once on initial mount (commented out to reduce console spam)
  // console.log('Google Auth Redirect URI:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GoogleConfig.webClientId,
    iosClientId: GoogleConfig.iosClientId,
    androidClientId: GoogleConfig.androidClientId,
    redirectUri: redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('Google Sign-In successful:', authentication);
      console.log('Access token:', authentication?.accessToken);
      console.log('ID token:', authentication?.idToken);
      // The access token can be used to get user info from Google
    } else if (response?.type === 'error') {
      console.error('Google Sign-In error:', response.error);
      console.error('Error details:', JSON.stringify(response, null, 2));
    } else if (response?.type === 'dismiss') {
      console.log('User dismissed the auth session');
    }
  }, [response]);

  return {
    request,
    response,
    promptAsync,
  };
};

export default useGoogleAuth;

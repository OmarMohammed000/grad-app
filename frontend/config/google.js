import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Google Sign-In Configuration
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // From Google Cloud Console
  offlineAccess: true, // Get refresh token
  hostedDomain: '', // Optional - specify domain if needed
  forceCodeForRefreshToken: true, // Android
  accountName: '', // Android only
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // Optional - iOS specific client ID
  googleServicePlistPath: '', // iOS only - path to GoogleService-Info.plist
  openIdSupport: false, // Enable if you need OpenID Connect
  profileImageSize: 120, // Size of profile image
});

export default GoogleSignin;
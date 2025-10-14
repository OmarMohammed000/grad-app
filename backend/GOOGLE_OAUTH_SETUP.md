# Google OAuth Setup Guide

## 📋 Overview

This guide explains how to set up Google OAuth for both **web (React)** and **mobile (React Native)** applications.

---

## 🔐 Step 1: Google Cloud Console Setup

### 1.1 Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
5. Configure the consent screen if prompted

### 1.2 Create Web Client ID (for React Web)

1. Application type: **Web application**
2. Name: `Grad App Web Client`
3. Authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:3000` (Create React App)
   - `https://yourdomain.com` (production)
4. Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback`
5. Click **CREATE**
6. Copy your **Client ID** and **Client Secret**

### 1.3 Create Android Client ID (for React Native Android)

1. Application type: **Android**
2. Name: `Grad App Android`
3. Package name: Your app's package name (e.g., `com.gradapp`)
4. SHA-1 certificate fingerprint:
   ```bash
   # Get debug keystore SHA-1
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Click **CREATE**

### 1.4 Create iOS Client ID (for React Native iOS)

1. Application type: **iOS**
2. Name: `Grad App iOS`
3. Bundle ID: Your app's bundle ID (e.g., `com.gradapp`)
4. Click **CREATE**

---

## 🔧 Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd backend
npm install google-auth-library
```

### 2.2 Update .env File

```bash
# Add to your .env file (already configured in .env.example)
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 2.3 Backend Route (Already Created)

The backend route is already set up at:
- **Endpoint**: `POST /auth/google`
- **Controller**: `controllers/Auth/googleAuth.js`
- **Route**: `route/Auth.js`

**Request Body:**
```json
{
  "credential": "google_jwt_token_from_web",
  // OR
  "idToken": "google_id_token_from_mobile"
}
```

**Response:**
```json
{
  "accessToken": "your_jwt_access_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "level": 1,
    "currentXp": 0,
    "totalXp": 0,
    "rank": {
      "name": "E-Rank",
      "color": "#808080"
    }
  }
}
```

---

## 🎨 Step 3: Frontend Setup

### Option A: React Web App

#### 3.1 Install Package

```bash
npm install @react-oauth/google
```

#### 3.2 Wrap App with Provider

```jsx
// src/main.jsx or src/index.jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
```

#### 3.3 Add to .env

```bash
# frontend/.env
VITE_GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:3000
```

#### 3.4 Create Login Component

```jsx
// src/components/GoogleLoginButton.jsx
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function GoogleLoginButton() {
  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/google`,
        { credential: credentialResponse.credential }
      );

      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // Update your app state with user data
      console.log('User:', response.data.user);
      
      // Redirect to dashboard or home
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Failed to login with Google');
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log('Login Failed')}
      useOneTap
      text="signin_with"
      shape="rectangular"
      theme="outline"
      size="large"
    />
  );
}

export default GoogleLoginButton;
```

---

### Option B: React Native Mobile App

#### 3.1 Install Package

```bash
npm install @react-native-google-signin/google-signin
```

#### 3.2 Configure iOS (if using iOS)

```bash
cd ios && pod install && cd ..
```

Add to `ios/YourApp/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

#### 3.3 Configure Android

No additional configuration needed if you created Android Client ID in Google Cloud Console.

#### 3.4 Configure Google Sign-In

```javascript
// src/config/google.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Google Cloud Console
  offlineAccess: true,
  hostedDomain: '', // optional
  forceCodeForRefreshToken: true,
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // optional (iOS only)
});
```

#### 3.5 Create Login Component

```javascript
// src/components/GoogleLoginButton.jsx
import React from 'react';
import { Button, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';

const API_URL = 'http://yourapi.com'; // or use react-native-config

async function signInWithGoogle() {
  try {
    // Check if device supports Google Play services
    await GoogleSignin.hasPlayServices();
    
    // Get user info from Google
    const userInfo = await GoogleSignin.signIn();
    
    // Send idToken to your backend
    const response = await axios.post(`${API_URL}/auth/google`, {
      idToken: userInfo.idToken
    });

    // Store tokens (use AsyncStorage or SecureStore)
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    
    // Update app state with user data
    console.log('User:', response.data.user);
    
    // Navigate to home screen
    navigation.navigate('Home');

  } catch (error) {
    console.error('Google sign-in error:', error);
    Alert.alert('Error', 'Failed to sign in with Google');
  }
}

export default function GoogleLoginButton() {
  return (
    <Button
      title="Sign in with Google"
      onPress={signInWithGoogle}
    />
  );
}
```

---

## 🧪 Step 4: Testing

### Test Backend Endpoint

```bash
# Start your backend
npm run dev

# Test with curl (replace TOKEN with actual Google token)
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"GOOGLE_JWT_TOKEN_HERE"}'
```

### Test Frontend

1. Run your frontend app
2. Click "Sign in with Google" button
3. Complete Google authentication
4. Check if you're redirected and tokens are stored
5. Verify user is created in database

---

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid token" error**
   - Make sure `GOOGLE_CLIENT_ID` in backend matches the one from Google Cloud Console
   - Ensure you're using the **Web Client ID** in backend, not Android/iOS IDs

2. **CORS errors (Web)**
   - Add CORS middleware in backend:
     ```javascript
     import cors from 'cors';
     app.use(cors({
       origin: 'http://localhost:5173',
       credentials: true
     }));
     ```

3. **"Developer Error" in mobile**
   - Double-check package name and SHA-1 fingerprint match in Google Cloud Console
   - Ensure you're using correct `webClientId` (Web Client ID, not Android ID)

4. **Cookie not set**
   - Check cookie path matches your route structure
   - Ensure `credentials: true` in fetch/axios requests
   - Use `sameSite: 'none'` and `secure: true` in production

---

## 🔐 Security Best Practices

1. ✅ **Never expose Client Secret** to frontend
2. ✅ **Always verify tokens on backend** using `google-auth-library`
3. ✅ **Use HTTPS in production**
4. ✅ **Implement rate limiting** on auth endpoints
5. ✅ **Set secure cookie options** (httpOnly, secure, sameSite)
6. ✅ **Validate redirect URIs** in Google Cloud Console

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Docs](https://www.npmjs.com/package/@react-oauth/google)
- [React Native Google Sign-In Docs](https://github.com/react-native-google-signin/google-signin)

---

## ✅ Summary

**Backend:** ✅ Already configured
- Controller: `controllers/Auth/googleAuth.js`
- Route: `POST /auth/google`
- Verifies Google token and creates/logs in user

**Frontend:** Configure based on platform
- **Web:** Use `@react-oauth/google`
- **Mobile:** Use `@react-native-google-signin/google-signin`

**Flow:**
1. User clicks "Sign in with Google"
2. Google handles authentication
3. Frontend receives token from Google
4. Frontend sends token to **your backend** at `POST /auth/google`
5. Backend verifies token, creates/updates user, returns JWT
6. Frontend stores JWT and user is logged in

# 🔧 Google Sign-In Fix for Expo Go

## ❌ **The Problem**

```
ERROR [Invariant Violation: TurboModuleRegistry.getEnforcing(...): 
'RNGoogleSignin' could not be found. Verify that a module by this name 
is registered in the native binary.]
```

This error occurs because **`@react-native-google-signin/google-signin`** is a **native module** that requires custom native code compilation.

## 🚫 **Why It Doesn't Work with Expo Go**

**Expo Go** is a pre-built app that includes common Expo modules but **NOT** custom native modules like Google Sign-In.

### **Two Options:**

1. ✅ **Use Expo Dev Client** (requires building custom native app)
2. ✅ **Remove Google Sign-In** and use email/password only (easier for now)

---

## ✅ **Fix Applied**

I've applied **Option 2** to get your app running quickly:

### **Changes Made:**

1. ✅ **Removed** `@react-native-google-signin/google-signin`
2. ✅ **Updated** `services/auth.ts` - Google Sign-In now shows info message
3. ✅ **Commented out** Google Sign-In button in:
   - `app/login.tsx`
   - `app/register.tsx`
4. ✅ **Updated** `config/google.ts` - Removed native module config

### **What Still Works:**

- ✅ **Email/Password Registration**
- ✅ **Email/Password Login**
- ✅ **Token Management**
- ✅ **Auto Token Refresh**
- ✅ **Logout**

---

## 🚀 **How to Add Google Sign-In Later**

When you're ready to add Google Sign-In, you have **two approaches**:

### **Option A: Expo Auth Session** (Web-Based, No Native Build Required)

Uses browser-based OAuth flow - works with Expo Go!

```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

**Implementation:**
```typescript
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: 'YOUR_GOOGLE_CLIENT_ID',
  // iOS, Android, and Web client IDs
});

// Use it
<Button
  title="Sign in with Google"
  disabled={!request}
  onPress={() => {
    promptAsync();
  }}
/>
```

**Docs:** https://docs.expo.dev/guides/authentication/#google

---

### **Option B: Expo Dev Client** (Native Module Support)

Requires building a custom development app but supports all native modules.

```bash
# Install Expo Dev Client
npx expo install expo-dev-client

# Reinstall Google Sign-In
npm install @react-native-google-signin/google-signin

# Build development client
npx expo run:android  # For Android
npx expo run:ios      # For iOS (Mac only)
```

**Docs:** https://docs.expo.dev/develop/development-builds/introduction/

---

## 📱 **Current Status**

Your app now works with **email/password authentication** using Expo Go:

1. ✅ Start the app: `npm start`
2. ✅ Scan QR code with Expo Go
3. ✅ Register with email/password
4. ✅ Login and access your app

**Google Sign-In is disabled but can be re-enabled later using one of the methods above.**

---

## 🔄 **To Re-enable Google Sign-In (Quick Reference)**

### **Using Expo Auth Session (Recommended for Expo Go):**

1. Install packages:
   ```bash
   npx expo install expo-auth-session expo-crypto expo-web-browser
   ```

2. Update `services/auth.ts`:
   ```typescript
   import * as Google from 'expo-auth-session/providers/google';
   import * as WebBrowser from 'expo-web-browser';

   WebBrowser.maybeCompleteAuthSession();

   static async googleSignIn(): Promise<AuthResponse> {
     // Use expo-auth-session implementation
     // See: https://docs.expo.dev/guides/authentication/#google
   }
   ```

3. Uncomment Google Sign-In buttons in `login.tsx` and `register.tsx`

4. Configure Google OAuth in Google Cloud Console with proper redirect URIs

---

## 🎯 **Summary**

**Before (❌ Broken):**
- Used `@react-native-google-signin/google-signin` (native module)
- Required Expo Dev Client
- Crashed in Expo Go

**After (✅ Working):**
- Email/password authentication works
- Google Sign-In temporarily disabled
- Can use Expo Go for development
- Can add Google Sign-In later when needed

---

## 📚 **Additional Resources**

- **Expo Authentication Guide:** https://docs.expo.dev/guides/authentication/
- **Expo Auth Session:** https://docs.expo.dev/versions/latest/sdk/auth-session/
- **Expo Dev Client:** https://docs.expo.dev/develop/development-builds/introduction/
- **Google OAuth Setup:** https://docs.expo.dev/guides/authentication/#google

---

## 💡 **Recommendation**

For now, **continue development with email/password authentication**. Once you have core features working, you can add Google Sign-In using **Expo Auth Session** (easier) or **Expo Dev Client** (more powerful).
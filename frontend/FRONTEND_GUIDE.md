# 📱 Frontend Architecture Guide - Grad Hunter App

## 🏗️ **How Your Frontend Works**

Your Expo React Native app uses a modern, file-based routing system with a theming architecture. Here's the complete breakdown:

---

## 📂 **1. Project Structure Explained**

```
frontend/
├── app/                      # 🚪 File-based routing (Expo Router)
│   ├── _layout.tsx          # Root layout wrapper (theme, navigation)
│   ├── index.tsx            # Entry point (auth check)
│   ├── login.tsx            # Login screen
│   └── (tabs)/              # Tab navigation group
│       ├── _layout.tsx      # Tab bar configuration
│       ├── index.tsx        # Home tab
│       └── explore.tsx      # Explore tab
│
├── components/              # 🧩 Reusable UI components
│   ├── themed-text.tsx     # Text with automatic theme colors
│   ├── themed-view.tsx     # View with automatic theme colors
│   └── ui/                 # UI-specific components
│
├── constants/              # 🎨 Theme & constants
│   └── theme.ts           # Colors, fonts, spacing
│
├── hooks/                  # 🪝 Custom React hooks
│   ├── use-color-scheme.ts  # Detect light/dark mode
│   └── use-theme-color.ts   # Get theme colors
│
├── services/               # 🔌 API & business logic
│   ├── api.ts             # Axios instance with interceptors
│   └── auth.ts            # Authentication service
│
└── config/                 # ⚙️ App configuration
    └── google.ts          # Google Sign-In setup
```

---

## 🎨 **2. How Styling Works**

### **Method 1: StyleSheet API (Traditional React Native)**

This is what you used in your `login.tsx`:

```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  button: {
    backgroundColor: '#4285f4',
    paddingVertical: 16,
    borderRadius: 12,
  },
});

// Usage
<View style={styles.container}>
  <TouchableOpacity style={styles.button}>
    <Text>Click me</Text>
  </TouchableOpacity>
</View>
```

**Pros:**
- ✅ Type-safe with TypeScript
- ✅ Performance optimized (styles are cached)
- ✅ Similar to CSS but uses camelCase
- ✅ No runtime overhead

**Docs:** https://reactnative.dev/docs/stylesheet

---

### **Method 2: Themed Components (Your App's Approach)**

Your app uses **themed components** that automatically adapt to light/dark mode:

```typescript
// components/themed-text.tsx
import { useThemeColor } from '@/hooks/use-theme-color';

export function ThemedText({ lightColor, darkColor, type, ...props }) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  
  return <Text style={[{ color }, styles[type]]} {...props} />;
}

// Usage
<ThemedText type="title">Welcome!</ThemedText>
<ThemedText lightColor="#000" darkColor="#fff">Custom colors</ThemedText>
```

**How it works:**
1. `useColorScheme()` detects if user prefers light/dark mode
2. `useThemeColor()` selects the right color from `constants/theme.ts`
3. Component automatically applies the color

**Docs:** https://docs.expo.dev/guides/color-schemes/

---

### **Method 3: Inline Styles (Not Recommended)**

```typescript
<View style={{ flex: 1, padding: 20 }}>
  <Text style={{ fontSize: 16, color: '#333' }}>Hello</Text>
</View>
```

❌ **Avoid this:** Creates new style objects on every render (performance issue)

---

## 🎨 **3. Your Theme System Explained**

### **File: `constants/theme.ts`**

```typescript
export const Colors = {
  light: {
    text: '#11181C',           // Dark text for light background
    background: '#fff',        // White background
    tint: '#0a7ea4',          // Primary accent color
    icon: '#687076',          // Icon color
  },
  dark: {
    text: '#ECEDEE',          // Light text for dark background
    background: '#151718',     // Dark background
    tint: '#fff',             // White accent
    icon: '#9BA1A6',          // Icon color
  },
};
```

### **How to Use Theme Colors:**

```typescript
// Option 1: With themed components
<ThemedView style={styles.container}>
  <ThemedText type="title">Title</ThemedText>
</ThemedView>

// Option 2: With useThemeColor hook
function MyComponent() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>Hello</Text>
    </View>
  );
}

// Option 3: Custom override colors
<ThemedText lightColor="#FF5733" darkColor="#33FF57">
  Custom themed text
</ThemedText>
```

---

## 🧭 **4. Navigation & Routing (Expo Router)**

### **File-Based Routing:**

```
app/
├── index.tsx              → / (root)
├── login.tsx              → /login
├── profile.tsx            → /profile
├── (tabs)/                → Tab group (grouped routes)
│   ├── index.tsx          → /(tabs)/ (home tab)
│   └── explore.tsx        → /(tabs)/explore
└── users/
    └── [id].tsx           → /users/:id (dynamic route)
```

### **Navigation Examples:**

```typescript
import { router, Link } from 'expo-router';

// Programmatic navigation
router.push('/login');           // Navigate to login
router.replace('/(tabs)');       // Replace (no back button)
router.back();                   // Go back

// Link component
<Link href="/profile">Go to Profile</Link>

// With parameters
<Link href={{ pathname: '/users/[id]', params: { id: '123' } }}>
  View User
</Link>
```

**Docs:** 
- Expo Router: https://docs.expo.dev/router/introduction/
- Navigation: https://reactnavigation.org/

---

## 🎨 **5. How to Create Your Custom Theme**

### **Step 1: Define Your Brand Colors**

Update `constants/theme.ts`:

```typescript
// Hunter-themed colors
const primaryColor = '#FF6B35';      // Orange-red (hunter theme)
const secondaryColor = '#004E89';    // Deep blue
const successColor = '#06D6A0';      // Green
const dangerColor = '#EF476F';       // Red

export const Colors = {
  light: {
    // Text colors
    text: '#1a1a1a',
    textSecondary: '#666',
    textMuted: '#999',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    card: '#fff',
    
    // Brand colors
    primary: primaryColor,
    secondary: secondaryColor,
    success: successColor,
    danger: dangerColor,
    warning: '#FFB84D',
    
    // UI elements
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
  },
  dark: {
    // Text colors
    text: '#ECEDEE',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',
    
    // Background colors
    background: '#0D1117',
    backgroundSecondary: '#161B22',
    card: '#1C2128',
    
    // Brand colors
    primary: primaryColor,
    secondary: '#0066CC',
    success: successColor,
    danger: dangerColor,
    warning: '#FFB84D',
    
    // UI elements
    border: '#30363D',
    shadow: 'rgba(0, 0, 0, 0.5)',
    tint: primaryColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColor,
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Font sizes
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Font weights
export const FontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
```

---

### **Step 2: Update ThemedText Component**

Add more text variants:

```typescript
// components/themed-text.tsx
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'caption' | 'link' | 'error' | 'success';
};

const styles = StyleSheet.create({
  default: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  caption: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  link: {
    fontSize: FontSizes.md,
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  error: {
    fontSize: FontSizes.sm,
    color: Colors.light.danger,
  },
  success: {
    fontSize: FontSizes.sm,
    color: Colors.light.success,
  },
});
```

---

### **Step 3: Create Themed Button Component**

```typescript
// components/themed-button.tsx
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function ThemedButton({ 
  title, 
  onPress, 
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
}: ThemedButtonProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  
  const buttonStyles = {
    primary: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    secondary: {
      backgroundColor: useThemeColor({}, 'backgroundSecondary'),
      borderColor: useThemeColor({}, 'border'),
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: primaryColor,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };

  const textStyles = {
    primary: { color: '#fff' },
    secondary: { color: textColor },
    outline: { color: primaryColor },
    ghost: { color: primaryColor },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyles[variant],
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textStyles[variant].color} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textStyles[variant]]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  text: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

---

### **Step 4: Create Themed Card Component**

```typescript
// components/themed-card.tsx
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export function ThemedCard({ children, style, ...props }: ViewProps) {
  const backgroundColor = useThemeColor({}, 'card');
  const shadowColor = useThemeColor({}, 'shadow');
  
  return (
    <View
      style={[
        styles.card,
        { backgroundColor, shadowColor },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
```

---

## 🎭 **6. Alternative Styling Solutions**

### **Option 1: NativeWind (Tailwind for React Native)**

```bash
npm install nativewind
npm install --save-dev tailwindcss
```

Usage:
```typescript
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-900">
    Hello World
  </Text>
</View>
```

**Docs:** https://www.nativewind.dev/

---

### **Option 2: Tamagui (Design System)**

```bash
npm install tamagui @tamagui/config
```

Usage:
```typescript
import { Button, Stack, Text } from 'tamagui';

<Stack padding="$4" backgroundColor="$background">
  <Text fontSize="$6" fontWeight="bold">Hello</Text>
  <Button theme="blue">Click me</Button>
</Stack>
```

**Docs:** https://tamagui.dev/

---

### **Option 3: React Native Paper (Material Design)**

```bash
npm install react-native-paper
```

Usage:
```typescript
import { Button, Card, Text } from 'react-native-paper';

<Card>
  <Card.Content>
    <Text variant="titleLarge">Title</Text>
    <Button mode="contained">Press me</Button>
  </Card.Content>
</Card>
```

**Docs:** https://callstack.github.io/react-native-paper/

---

## 📚 **7. Essential Documentation Links**

### **Core Technologies:**
- 📱 **React Native:** https://reactnative.dev/docs/getting-started
- 🚀 **Expo:** https://docs.expo.dev/
- 🧭 **Expo Router:** https://docs.expo.dev/router/introduction/
- ⚛️ **React:** https://react.dev/

### **Navigation:**
- 📍 **React Navigation:** https://reactnavigation.org/
- 🗂️ **File-based Routing:** https://docs.expo.dev/router/create-pages/

### **Styling:**
- 🎨 **StyleSheet API:** https://reactnative.dev/docs/stylesheet
- 🌓 **Color Schemes:** https://docs.expo.dev/guides/color-schemes/
- 🎭 **Theming:** https://reactnavigation.org/docs/themes/

### **Components:**
- 📦 **React Native Components:** https://reactnative.dev/docs/components-and-apis
- 🎯 **Expo Components:** https://docs.expo.dev/versions/latest/
- 💅 **Ionicons:** https://ionic.io/ionicons

### **State Management:**
- 🪝 **Hooks:** https://react.dev/reference/react/hooks
- 🏪 **Context API:** https://react.dev/reference/react/useContext
- 🔄 **Redux Toolkit:** https://redux-toolkit.js.org/ (if needed)

### **Authentication:**
- 🔐 **Google Sign-In:** https://github.com/react-native-google-signin/google-signin
- 🔑 **Secure Store:** https://docs.expo.dev/versions/latest/sdk/securestore/
- 💾 **Async Storage:** https://react-native-async-storage.github.io/async-storage/

---

## 🚀 **8. Quick Start Examples**

### **Create a New Themed Screen:**

```typescript
// app/profile.tsx
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedCard } from '@/components/themed-card';
import { ThemedButton } from '@/components/themed-button';
import { Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Profile</ThemedText>
        
        <ThemedCard style={styles.card}>
          <ThemedText type="subtitle">Hunter Stats</ThemedText>
          <ThemedText>Level: 5</ThemedText>
          <ThemedText>XP: 450/500</ThemedText>
        </ThemedCard>
        
        <ThemedButton
          title="Edit Profile"
          variant="primary"
          onPress={() => {}}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  card: {
    marginVertical: Spacing.md,
  },
});
```

---

## 🎯 **Summary**

**Your app uses:**
1. ✅ **File-based routing** (Expo Router) for navigation
2. ✅ **Themed components** for automatic light/dark mode
3. ✅ **StyleSheet API** for performant styling
4. ✅ **Hooks** (useThemeColor, useColorScheme) for theme logic
5. ✅ **Constants** (theme.ts) for design tokens

**Next steps:**
1. Customize `constants/theme.ts` with your brand colors
2. Create more themed components (Button, Card, Input)
3. Build your app screens using the themed components
4. Add your business logic with services and hooks

Happy coding! 🚀
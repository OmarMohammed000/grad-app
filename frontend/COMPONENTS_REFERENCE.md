# 🚀 Quick Reference Guide - Themed Components

## 📦 Available Components

### 1. ThemedView
Container component that adapts to light/dark mode.

```typescript
import { ThemedView } from '@/components/themed-view';

<ThemedView style={styles.container}>
  {/* Your content */}
</ThemedView>

// With custom colors
<ThemedView 
  lightColor="#f0f0f0" 
  darkColor="#1a1a1a"
  style={styles.container}
>
  {/* Your content */}
</ThemedView>
```

---

### 2. ThemedText
Text component with predefined styles and theme support.

```typescript
import { ThemedText } from '@/components/themed-text';

// Types: 'default' | 'title' | 'subtitle' | 'defaultSemiBold' | 'link'
<ThemedText type="title">Large Title</ThemedText>
<ThemedText type="subtitle">Subtitle</ThemedText>
<ThemedText type="defaultSemiBold">Bold Text</ThemedText>
<ThemedText type="link">Link Text</ThemedText>

// With custom colors
<ThemedText lightColor="#000" darkColor="#fff">
  Custom themed text
</ThemedText>
```

---

### 3. ThemedCard
Card container with shadow and theme support.

```typescript
import { ThemedCard } from '@/components/themed-card';

<ThemedCard style={styles.card}>
  <ThemedText type="subtitle">Card Title</ThemedText>
  <ThemedText>Card content goes here</ThemedText>
</ThemedCard>

// Without shadow
<ThemedCard elevated={false}>
  <ThemedText>Flat card</ThemedText>
</ThemedCard>
```

---

### 4. ThemedButton
Button component with multiple variants and states.

```typescript
import { ThemedButton } from '@/components/themed-button';
import { Ionicons } from '@expo/vector-icons';

// Variants: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
// Sizes: 'small' | 'medium' | 'large'

<ThemedButton
  title="Click Me"
  variant="primary"
  size="medium"
  onPress={() => console.log('Clicked')}
/>

// With icon
<ThemedButton
  title="Save"
  variant="primary"
  icon={<Ionicons name="save-outline" size={20} color="white" />}
  onPress={handleSave}
/>

// Loading state
<ThemedButton
  title="Loading..."
  loading={true}
  variant="primary"
/>

// Full width
<ThemedButton
  title="Full Width Button"
  fullWidth
  variant="primary"
/>

// All variants
<ThemedButton title="Primary" variant="primary" />
<ThemedButton title="Secondary" variant="secondary" />
<ThemedButton title="Outline" variant="outline" />
<ThemedButton title="Ghost" variant="ghost" />
<ThemedButton title="Danger" variant="danger" />
```

---

### 5. ThemedInput
Input field with label, icons, and validation.

```typescript
import { ThemedInput } from '@/components/themed-input';

// Basic input
<ThemedInput
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>

// With left icon
<ThemedInput
  label="Email"
  placeholder="Enter your email"
  leftIcon="mail-outline"
  value={email}
  onChangeText={setEmail}
/>

// Password with toggle
<ThemedInput
  label="Password"
  placeholder="Enter password"
  leftIcon="lock-closed-outline"
  rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
  onRightIconPress={() => setShowPassword(!showPassword)}
  secureTextEntry={!showPassword}
  value={password}
  onChangeText={setPassword}
/>

// With error
<ThemedInput
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error="Please enter a valid email"
/>

// With helper text
<ThemedInput
  label="Username"
  placeholder="Choose a username"
  helperText="Must be 3-20 characters"
  value={username}
  onChangeText={setUsername}
/>
```

---

## 🎨 Using Theme Constants

```typescript
import { 
  Colors, 
  Spacing, 
  BorderRadius, 
  FontSizes, 
  FontWeights,
  Shadows 
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function MyComponent() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={{
      padding: Spacing.md,              // 16px
      borderRadius: BorderRadius.lg,    // 12px
      backgroundColor: colors.primary,   // Theme-aware color
      ...Shadows.md,                    // Medium shadow
    }}>
      <Text style={{
        fontSize: FontSizes.lg,         // 18px
        fontWeight: FontWeights.bold,   // 700
        color: colors.text,             // Theme-aware text color
      }}>
        Hello World
      </Text>
    </View>
  );
}
```

---

## 🪝 Using Theme Hooks

### useColorScheme
Detects the user's system color scheme preference.

```typescript
import { useColorScheme } from '@/hooks/use-color-scheme';

function MyComponent() {
  const colorScheme = useColorScheme(); // 'light' | 'dark'
  
  return (
    <Text>Current theme: {colorScheme}</Text>
  );
}
```

### useThemeColor
Gets a color from the theme based on current color scheme.

```typescript
import { useThemeColor } from '@/hooks/use-theme-color';

function MyComponent() {
  // Get predefined color from theme
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // With custom fallbacks
  const customColor = useThemeColor(
    { light: '#FF0000', dark: '#00FF00' },
    'primary'
  );
  
  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>Hello</Text>
    </View>
  );
}
```

---

## 🎨 Complete Example Screen

```typescript
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedCard } from '@/components/themed-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { Spacing, FontSizes } from '@/constants/theme';

export default function ExampleScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Your logic here
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ThemedView style={styles.container}>
          {/* Header */}
          <ThemedText type="title" style={styles.title}>
            Example Screen
          </ThemedText>
          
          {/* Card with form */}
          <ThemedCard style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              User Information
            </ThemedText>
            
            <ThemedInput
              label="Full Name"
              placeholder="Enter your name"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
            />
            
            <ThemedButton
              title="Submit"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleSubmit}
              icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
            />
          </ThemedCard>

          {/* Stats Cards */}
          <ThemedView style={styles.statsRow}>
            <ThemedCard style={styles.statCard}>
              <ThemedText type="subtitle">Level</ThemedText>
              <ThemedText style={styles.statValue}>5</ThemedText>
            </ThemedCard>
            
            <ThemedCard style={styles.statCard}>
              <ThemedText type="subtitle">XP</ThemedText>
              <ThemedText style={styles.statValue}>450</ThemedText>
            </ThemedCard>
          </ThemedView>

          {/* Button Variants */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Button Variants</ThemedText>
            <ThemedButton title="Primary" variant="primary" fullWidth />
            <ThemedButton title="Secondary" variant="secondary" fullWidth />
            <ThemedButton title="Outline" variant="outline" fullWidth />
            <ThemedButton title="Ghost" variant="ghost" fullWidth />
            <ThemedButton title="Danger" variant="danger" fullWidth />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  title: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    marginTop: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
});
```

---

## 📱 Common Patterns

### Form with Validation
```typescript
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const validateEmail = (text: string) => {
  setEmail(text);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(text)) {
    setError('Please enter a valid email');
  } else {
    setError('');
  }
};

<ThemedInput
  label="Email"
  value={email}
  onChangeText={validateEmail}
  error={error}
  leftIcon="mail-outline"
/>
```

### Loading State
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await someAsyncFunction();
  } finally {
    setLoading(false);
  }
};

<ThemedButton
  title="Submit"
  loading={loading}
  onPress={handleAction}
/>
```

### Conditional Styling
```typescript
import { useColorScheme } from '@/hooks/use-color-scheme';

const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';

<View style={[
  styles.container,
  isDark && styles.containerDark
]}>
  {/* content */}
</View>
```

---

## 🎯 Best Practices

1. ✅ **Always use themed components** for consistent styling
2. ✅ **Use Spacing constants** instead of hardcoded values
3. ✅ **Use Colors from theme** for automatic dark mode support
4. ✅ **Wrap screens in SafeAreaView** for notch/status bar handling
5. ✅ **Use ScrollView** for forms and long content
6. ✅ **Add loading states** to buttons for async actions
7. ✅ **Validate inputs** and show error messages
8. ✅ **Use icons** from Ionicons for consistency

---

## 📚 More Resources

- **Ionicons:** https://ionic.io/ionicons
- **React Native Docs:** https://reactnative.dev/
- **Expo Router:** https://docs.expo.dev/router/
- **TypeScript:** https://www.typescriptlang.org/
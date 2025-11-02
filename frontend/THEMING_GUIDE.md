# 🎨 Theming Guide - The Simple Way

## Why This Approach is Better

### ❌ Old Approach (What You Had)
- Created separate `ThemedView`, `ThemedText`, `ThemedCard`, `ThemedButton`, `ThemedInput`
- Had to import and use special components everywhere
- More files to maintain (5+ themed components)
- Hard to customize individual instances

### ✅ New Approach (React Context + useTheme Hook)
- **ONE** context file with all theme values
- Use regular React Native components (`View`, `Text`, etc.)
- Access theme anywhere with `useTheme()` hook
- Easy to customize and maintain
- Industry standard approach

---

## 📁 File Structure

```
frontend/
├── contexts/
│   └── ThemeContext.tsx          # ✅ ONE file for entire theme
└── app/
    └── _layout.tsx               # Wrap app with ThemeProvider
```

That's it! No more themed components needed.

---

## 🚀 How to Use

### 1. Basic Usage

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function MyScreen() {
  const theme = useTheme(); // Get entire theme object
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        Hello World
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md, // ❌ Can't use theme here (not in component)
  },
  text: {
    fontSize: 16,
  },
});
```

### 2. Using Theme in Styles (Two Methods)

#### Method A: Inline Styles (Simplest)
```typescript
export default function MyScreen() {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,  // ✅ Can use theme here
    }]}>
      <Text style={{ color: theme.colors.text }}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

#### Method B: Create Styles Function
```typescript
export default function MyScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello</Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
  },
});
```

---

## 🎯 Common Patterns

### Card Component
```typescript
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  
  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.colors.card },
      theme.shadows.md
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
});
```

### Button Component
```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline';
}

export default function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  const theme = useTheme();
  
  const backgroundColor = variant === 'primary' 
    ? theme.colors.primary 
    : variant === 'danger'
    ? theme.colors.danger
    : 'transparent';
    
  const textColor = variant === 'outline' ? theme.colors.primary : '#fff';
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor },
        variant === 'outline' && { borderWidth: 2, borderColor: theme.colors.primary },
        theme.shadows.sm
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Input Component
```typescript
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function Input({ label, value, onChangeText, placeholder }: InputProps) {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
});
```

---

## 🔧 Available Theme Properties

```typescript
const theme = useTheme();

// Colors
theme.colors.primary
theme.colors.secondary
theme.colors.success
theme.colors.danger
theme.colors.warning
theme.colors.background
theme.colors.backgroundSecondary
theme.colors.card
theme.colors.text
theme.colors.textSecondary
theme.colors.textMuted
theme.colors.border
theme.colors.shadow
theme.colors.icon

// Spacing (4px grid system)
theme.spacing.xs   // 4px
theme.spacing.sm   // 8px
theme.spacing.md   // 16px
theme.spacing.lg   // 24px
theme.spacing.xl   // 32px
theme.spacing.xxl  // 48px

// Border Radius
theme.borderRadius.sm    // 4px
theme.borderRadius.md    // 8px
theme.borderRadius.lg    // 12px
theme.borderRadius.xl    // 16px
theme.borderRadius.full  // 9999px (pill shape)

// Font Sizes
theme.fontSize.xs    // 12px
theme.fontSize.sm    // 14px
theme.fontSize.md    // 16px
theme.fontSize.lg    // 18px
theme.fontSize.xl    // 20px
theme.fontSize.xxl   // 24px
theme.fontSize.xxxl  // 32px

// Shadows (iOS & Android compatible)
theme.shadows.sm  // Small shadow
theme.shadows.md  // Medium shadow
theme.shadows.lg  // Large shadow
```

---

## 🌓 How Dark Mode Works

**Automatic!** The theme automatically switches based on device settings.

```typescript
// ThemeContext.tsx (already set up for you)
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme(); // React Native hook
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
```

**To test dark mode:**
1. iOS Simulator: Settings → Developer → Dark Appearance
2. Android Emulator: Settings → Display → Dark theme
3. Physical Device: Change system theme

---

## 📚 Alternative Theming Libraries

If you want even more features, consider these libraries:

### 1. **styled-components** (CSS-in-JS)
```bash
npm install styled-components
```

```typescript
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md}px;
`;

const Title = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.xxl}px;
  font-weight: bold;
`;

export default function Screen() {
  return (
    <Container>
      <Title>Hello World</Title>
    </Container>
  );
}
```

**Pros:**
- CSS-like syntax
- Auto-completion
- Less verbose

**Cons:**
- Larger bundle size
- Slightly slower than StyleSheet

---

### 2. **React Native Paper** (Material Design)
```bash
npm install react-native-paper
```

```typescript
import { Provider as PaperProvider, Button, Card, Text } from 'react-native-paper';

export default function App() {
  return (
    <PaperProvider>
      <Card>
        <Card.Content>
          <Text variant="titleLarge">Hello</Text>
        </Card.Content>
        <Card.Actions>
          <Button>OK</Button>
        </Card.Actions>
      </Card>
    </PaperProvider>
  );
}
```

**Pros:**
- Complete UI library
- Material Design
- Built-in theming

**Cons:**
- Opinionated design
- Larger bundle

---

### 3. **NativeWind** (Tailwind for React Native)
```bash
npm install nativewind
npm install --save-dev tailwindcss
```

```typescript
import { View, Text } from 'react-native';

export default function Screen() {
  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        Hello World
      </Text>
    </View>
  );
}
```

**Pros:**
- Tailwind syntax
- Very fast development
- Small bundle

**Cons:**
- Learning curve if new to Tailwind
- Different from web Tailwind

---

## 🎯 Recommendation

**For your project, stick with the Context API approach I just set up:**

✅ **Simple** - Just one hook: `useTheme()`  
✅ **Standard** - Used by React Native, Expo, and major companies  
✅ **Flexible** - Easy to customize  
✅ **Performant** - No overhead  
✅ **TypeScript** - Full type safety  

You can always migrate to styled-components or NativeWind later if needed, but 99% of apps don't need them.

---

## 🔄 Migrating from Your Old Themed Components

### Before (Old):
```typescript
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedCard } from '@/components/themed-card';

export default function Screen() {
  return (
    <ThemedView>
      <ThemedCard elevated>
        <ThemedText type="title">Hello</ThemedText>
      </ThemedCard>
    </ThemedView>
  );
}
```

### After (New):
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function Screen() {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.xxxl, fontWeight: 'bold' }}>
          Hello
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
});
```

---

## 🎓 Learning Resources

- [React Context API](https://react.dev/reference/react/useContext)
- [React Native Appearance](https://reactnative.dev/docs/appearance)
- [Expo Theming Guide](https://docs.expo.dev/develop/user-interface/color-themes/)
- [React Native Styling](https://reactnative.dev/docs/style)

---

## 💡 Pro Tips

1. **Always use `theme.spacing` instead of hardcoded numbers**
   ```typescript
   // ❌ Bad
   padding: 16
   
   // ✅ Good
   padding: theme.spacing.md
   ```

2. **Use semantic color names**
   ```typescript
   // ❌ Bad
   color: '#4285f4'
   
   // ✅ Good
   color: theme.colors.primary
   ```

3. **Combine StyleSheet with theme**
   ```typescript
   // Static styles in StyleSheet (faster)
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       borderRadius: 12,
     },
   });
   
   // Dynamic theme styles inline
   <View style={[styles.container, { backgroundColor: theme.colors.card }]} />
   ```

4. **Extract repeated patterns into components**
   - If you use the same card style 10 times, make a `Card` component
   - Keep it simple - just wrap the pattern, don't overcomplicate

---

## 📝 Summary

**What you should do:**
1. ✅ Use `useTheme()` hook everywhere
2. ✅ Use regular React Native components
3. ✅ Create simple wrapper components for common patterns (Card, Button, etc.)
4. ✅ Keep theme values in `ThemeContext.tsx`

**What you shouldn't do:**
1. ❌ Don't create "themed" versions of every component
2. ❌ Don't hardcode colors/spacing
3. ❌ Don't over-engineer with libraries you don't need

Keep it simple! 🎯


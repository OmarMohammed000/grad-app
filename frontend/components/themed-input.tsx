import React, { useState } from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  type TextInputProps 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  helperText?: string;
}

export function ThemedInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  helperText,
  style,
  ...props
}: ThemedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = error ? '#EF476F' : isFocused ? '#4285f4' : '#e0e0e0';

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        { backgroundColor, borderColor },
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={error ? '#EF476F' : '#666'} 
            style={styles.leftIcon} 
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            { color: textColor },
            style,
          ]}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          error ? styles.errorText : { color: '#666' }
        ]}>
          {error || helperText}
        </Text>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  inputFocused: {
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#EF476F',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    padding: 4,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: '#EF476F',
  },
});
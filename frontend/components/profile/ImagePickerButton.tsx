import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useImagePicker, ImagePickerResult } from '@/hooks/useImagePicker';

interface ImagePickerButtonProps {
  currentImageUri?: string;
  onImageSelected: (result: ImagePickerResult) => void;
  size?: number;
  showLabel?: boolean;
}

export function ImagePickerButton({
  currentImageUri,
  onImageSelected,
  size = 100,
  showLabel = false,
}: ImagePickerButtonProps) {
  const theme = useTheme();
  const { showImagePickerOptions, loading } = useImagePicker();

  const handlePress = async () => {
    const result = await showImagePickerOptions({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result) {
      onImageSelected(result);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.imageContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.backgroundSecondary,
          },
        ]}
        onPress={handlePress}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : currentImageUri ? (
          <Image
            source={{ uri: currentImageUri }}
            style={[
              styles.image,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          />
        ) : (
          <Ionicons
            name="camera"
            size={size * 0.4}
            color={theme.colors.textSecondary}
          />
        )}

        <View
          style={[
            styles.editBadge,
            {
              backgroundColor: theme.colors.primary,
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
            },
          ]}
        >
          <Ionicons name="pencil" size={size * 0.15} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {showLabel && (
        <TouchableOpacity onPress={handlePress} disabled={loading}>
          <Text
            style={[
              styles.label,
              { color: theme.colors.primary },
              loading && styles.labelDisabled,
            ]}
          >
            {loading ? 'Loading...' : 'Change Photo'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  labelDisabled: {
    opacity: 0.5,
  },
});


import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';
import Toast from 'react-native-toast-message';

export interface ImagePickerResult {
  uri: string;
  type?: string;
  name?: string;
  base64?: string;
}

/**
 * Hook for picking images from gallery or camera
 * Works on both mobile (iOS/Android) and web
 */
export function useImagePicker() {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true; // Web doesn't need permissions
    }

    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permissions Required',
        text2: 'Please grant camera and photo library permissions to upload images.'
      });
      return false;
    }

    return true;
  };

  const pickImage = async (
    options: {
      allowsEditing?: boolean;
      aspect?: [number, number];
      quality?: number;
      allowsMultipleSelection?: boolean;
    } = {}
  ): Promise<ImagePickerResult | null> => {
    setLoading(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1], // Square for avatars
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection ?? false,
        base64: true, // Include base64 for easy upload
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        return null;
      }

      return {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        base64: asset.base64 || undefined,
      };
    } catch (error: any) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image. Please try again.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (
    options: {
      allowsEditing?: boolean;
      aspect?: [number, number];
      quality?: number;
    } = {}
  ): Promise<ImagePickerResult | null> => {
    setLoading(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1], // Square for avatars
        quality: options.quality ?? 0.8,
        base64: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        return null;
      }

      return {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        base64: asset.base64 || undefined,
      };
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take photo. Please try again.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const showImagePickerOptions = async (
    options: {
      allowsEditing?: boolean;
      aspect?: [number, number];
      quality?: number;
    } = {}
  ): Promise<ImagePickerResult | null> => {
    if (Platform.OS === 'web') {
      // On web, just use gallery picker
      return pickImage(options);
    }

    // On mobile, show action sheet
    return new Promise((resolve) => {
      // For selecting image source (Camera vs Gallery), we can't easily replace Alert with Toast.
      // A Toast is for notifications, not for user input/selection.
      // We would need a custom Modal or ActionSheet component to replace this Alert.
      // Given the scope is "Rework App Alerts" (notifications), replacing a functional ActionSheet Alert 
      // with a Toast is impossible (Toast doesn't have buttons).
      // I will leave this Alert as is, because it's acting as an ActionSheet, not a notification.
      // However, I can make it clear in the code why I'm keeping it.
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await takePhoto(options);
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await pickImage(options);
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  };

  return {
    pickImage,
    takePhoto,
    showImagePickerOptions,
    loading,
  };
}


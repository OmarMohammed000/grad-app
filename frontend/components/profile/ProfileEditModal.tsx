import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/form';
import { Button } from '@/components/form';
import { ImagePickerButton } from './ImagePickerButton';
import { ImagePickerResult } from '@/hooks/useImagePicker';
import { User, UserProfile } from '@/services/user';

interface ProfileEditModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    isPublicProfile?: boolean;
    notificationsEnabled?: boolean;
    emailNotifications?: boolean;
    soundEnabled?: boolean;
  }) => Promise<void>;
}

export function ProfileEditModal({
  visible,
  user,
  onClose,
  onSave,
}: ProfileEditModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && visible) {
      setDisplayName(user.profile?.displayName || '');
      setBio(user.profile?.bio || '');
      setAvatarUrl(user.profile?.avatarUrl || '');
      setSelectedImage(null); // Reset selected image when modal opens
      setIsPublicProfile(user.profile?.isPublicProfile ?? true);
      setNotificationsEnabled(user.profile?.notificationsEnabled ?? true);
      setEmailNotifications(user.profile?.emailNotifications ?? true);
      setSoundEnabled(user.profile?.soundEnabled ?? true);
      setErrors({});
    }
  }, [user, visible]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelected = (result: ImagePickerResult) => {
    setSelectedImage(result);
    // Convert to data URI for storage (works but not ideal for large images)
    // In production, you'd upload to a server/CDN and get a URL back
    if (result.base64) {
      const dataUri = `data:${result.type || 'image/jpeg'};base64,${result.base64}`;
      setAvatarUrl(dataUri);
    } else {
      // Fallback to URI if base64 not available
      setAvatarUrl(result.uri);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Use selected image if available, otherwise use manual URL
      const finalAvatarUrl = selectedImage
        ? (selectedImage.base64
            ? `data:${selectedImage.type || 'image/jpeg'};base64,${selectedImage.base64}`
            : selectedImage.uri)
        : avatarUrl.trim() || undefined;

      await onSave({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: finalAvatarUrl,
        isPublicProfile,
        notificationsEnabled,
        emailNotifications,
        soundEnabled,
      });
      onClose();
    } catch (error) {
      // Error is handled by onSave
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Edit Profile
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Information */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Profile Information
                </Text>

                {/* Avatar Picker */}
                <View style={styles.avatarSection}>
                  <Text style={[styles.avatarLabel, { color: theme.colors.text }]}>
                    Profile Photo
                  </Text>
                  <ImagePickerButton
                    currentImageUri={
                      selectedImage?.uri || user?.profile?.avatarUrl
                    }
                    onImageSelected={handleImageSelected}
                    size={100}
                    showLabel={true}
                  />
                </View>

                <Input
                  label="Display Name *"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  error={errors.displayName}
                  leftIcon="person"
                />

                <Input
                  label="Avatar URL (optional)"
                  placeholder="Or enter image URL manually"
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  leftIcon="link"
                />

                <Input
                  label="Bio"
                  placeholder="Tell us about yourself (optional)"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  leftIcon="document-text"
                />
              </View>

              {/* Privacy Settings */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Privacy
                </Text>

                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons
                      name="globe-outline"
                      size={20}
                      color={theme.colors.text}
                    />
                    <View style={styles.switchTextContainer}>
                      <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                        Public Profile
                      </Text>
                      <Text
                        style={[
                          styles.switchDescription,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Allow others to view your profile
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isPublicProfile}
                    onValueChange={setIsPublicProfile}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Notification Settings */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Notifications
                </Text>

                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={theme.colors.text}
                    />
                    <View style={styles.switchTextContainer}>
                      <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                        Push Notifications
                      </Text>
                      <Text
                        style={[
                          styles.switchDescription,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Receive push notifications
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.colors.text}
                    />
                    <View style={styles.switchTextContainer}>
                      <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                        Email Notifications
                      </Text>
                      <Text
                        style={[
                          styles.switchDescription,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Receive email notifications
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons
                      name="volume-high-outline"
                      size={20}
                      color={theme.colors.text}
                    />
                    <View style={styles.switchTextContainer}>
                      <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                        Sound Effects
                      </Text>
                      <Text
                        style={[
                          styles.switchDescription,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Play sounds for actions
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={setSoundEnabled}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={styles.cancelButton}
                />
                <Button
                  title="Save Changes"
                  variant="primary"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.saveButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});


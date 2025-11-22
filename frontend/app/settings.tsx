import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useTheme, useThemeMode } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import UserService, { User } from '@/services/user';
import { AuthService } from '@/services/auth';
import { NotificationTestButton } from '@/components/notifications';

export default function SettingsScreen() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPublicProfile, setIsPublicProfile] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await UserService.getMe();
      setUser(response.user);
      setNotificationsEnabled(response.user.profile?.notificationsEnabled ?? true);
      setEmailNotifications(response.user.profile?.emailNotifications ?? true);
      setSoundEnabled(response.user.profile?.soundEnabled ?? true);
      setIsPublicProfile(response.user.profile?.isPublicProfile ?? true);
      
      // Sync theme preference from backend
      const backendTheme = response.user.profile?.theme || 'auto';
      if (backendTheme !== themeMode) {
        await setThemeMode(backendTheme as 'light' | 'dark' | 'auto');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchUserData();
    setLoading(false);
  }, [fetchUserData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, [fetchUserData]);

  const handleToggle = async (
    field: 'notificationsEnabled' | 'emailNotifications' | 'soundEnabled' | 'isPublicProfile',
    value: boolean
  ) => {
    try {
      await UserService.updateMe({ [field]: value });
      await fetchUserData();
    } catch (error) {
      // Error is handled by UserService
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    try {
      // Update theme immediately
      await setThemeMode(newTheme);
      // Save to backend
      await UserService.updateMe({ theme: newTheme });
      Toast.show({
        type: 'success',
        text1: 'Theme Updated',
        text2: 'Theme changed successfully!',
      });
    } catch (error) {
      // Error is handled by UserService
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update theme. Please try again.',
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const handleAdminDashboard = () => {
    router.push('/admin-dashboard');
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Settings
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Notifications
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.colors.text}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Push Notifications
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Receive push notifications
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => handleToggle('notificationsEnabled', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.text} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Email Notifications
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Receive email notifications
                </Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={(value) => handleToggle('emailNotifications', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Notification Testing Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm,
          ]}
        >
          <NotificationTestButton />
        </View>

        {/* App Settings Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            App Settings
          </Text>

          {/* Theme Selection */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="color-palette-outline"
                size={20}
                color={theme.colors.text}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Theme
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Choose your preferred theme
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'auto'] as const).map((themeOption) => (
              <TouchableOpacity
                key={themeOption}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      themeMode === themeOption
                        ? theme.colors.primary + '22'
                        : theme.colors.backgroundSecondary,
                    borderColor:
                      themeMode === themeOption
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
                onPress={() => handleThemeChange(themeOption)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    themeOption === 'light'
                      ? 'sunny-outline'
                      : themeOption === 'dark'
                      ? 'moon-outline'
                      : 'phone-portrait-outline'
                  }
                  size={20}
                  color={
                    themeMode === themeOption
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color:
                        themeMode === themeOption
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                      fontWeight:
                        themeMode === themeOption ? '600' : '400',
                    },
                  ]}
                >
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </Text>
                {themeMode === themeOption && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="volume-high-outline"
                size={20}
                color={theme.colors.text}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Sound Effects
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Play sounds for actions
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={theme.colors.text}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Public Profile
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Allow others to view your profile
                </Text>
              </View>
            </View>
            <Switch
              value={isPublicProfile}
              onValueChange={(value) => handleToggle('isPublicProfile', value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Account Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Account
          </Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="person-outline" size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Edit Profile
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleAdminDashboard}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.settingLabel, { color: theme.colors.primary }]}
                >
                  Admin Dashboard
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Danger Zone */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.danger }]}>
            Danger Zone
          </Text>

          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: theme.colors.danger }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
            <Text style={[styles.dangerButtonText, { color: theme.colors.danger }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  themeOptionText: {
    fontSize: 14,
    flex: 1,
  },
});


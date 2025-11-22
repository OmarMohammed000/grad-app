import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import UserService, { User } from '@/services/user';
import api from '@/services/api';
import Toast from 'react-native-toast-message';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    displayName?: string;
  };
}

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await UserService.getMe();
      setUser(response.user);
      
      // Check if user is admin
      if (response.user.role !== 'admin') {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'You do not have admin privileges.',
        });
        router.back();
        return;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.back();
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { limit: 50, offset: 0 },
      });
      setUsers(response.data.users || []);
      
      // Calculate stats
      const total = response.data.total || 0;
      const active = response.data.users?.filter((u: AdminUser) => u.isActive).length || 0;
      const admins = response.data.users?.filter((u: AdminUser) => u.role === 'admin').length || 0;
      
      setStats({
        totalUsers: total,
        activeUsers: active,
        adminUsers: admins,
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'You do not have admin privileges.',
        });
        router.back();
      }
    }
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchUsers()]);
    setLoading(false);
  }, [fetchUserData, fetchUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchUsers()]);
    setRefreshing(false);
  }, [fetchUserData, fetchUsers]);

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        // Deactivate user
        await api.delete(`/admin/users/${userId}`);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'User deactivated successfully',
        });
      } else {
        // Reactivate user (would need a reactivate endpoint)
        Toast.show({
          type: 'info',
          text1: 'Info',
          text2: 'Reactivate functionality not yet implemented',
        });
      }
      await fetchUsers();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update user status',
      });
    }
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

  if (user?.role !== 'admin') {
    return null; // Will redirect
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Admin Dashboard
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
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.card },
              theme.shadows.sm,
            ]}
          >
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.totalUsers}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Total Users
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.card },
              theme.shadows.sm,
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.activeUsers}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Active Users
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.card },
              theme.shadows.sm,
            ]}
          >
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.warning} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.adminUsers}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Admins
            </Text>
          </View>
        </View>

        {/* Users List */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm,
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Users ({users.length})
          </Text>

          {users.length === 0 ? (
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No users found
            </Text>
          ) : (
            users.map((adminUser) => (
              <View
                key={adminUser.id}
                style={[
                  styles.userRow,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <View style={styles.userInfo}>
                  <View
                    style={[
                      styles.userAvatar,
                      {
                        backgroundColor:
                          adminUser.role === 'admin'
                            ? theme.colors.warning
                            : theme.colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.userAvatarText}>
                      {adminUser.profile?.displayName?.charAt(0).toUpperCase() ||
                        adminUser.email.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>
                      {adminUser.profile?.displayName || adminUser.email}
                    </Text>
                    <Text
                      style={[
                        styles.userEmail,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {adminUser.email}
                    </Text>
                    <View style={styles.userBadges}>
                      {adminUser.role === 'admin' && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: theme.colors.warning + '22' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: theme.colors.warning },
                            ]}
                          >
                            Admin
                          </Text>
                        </View>
                      )}
                      {!adminUser.isActive && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: theme.colors.danger + '22' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: theme.colors.danger },
                            ]}
                          >
                            Inactive
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {adminUser.id !== user?.id && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: adminUser.isActive
                          ? theme.colors.danger + '22'
                          : theme.colors.success + '22',
                      },
                    ]}
                    onPress={() =>
                      Alert.alert(
                        adminUser.isActive ? 'Deactivate User' : 'Activate User',
                        `Are you sure you want to ${
                          adminUser.isActive ? 'deactivate' : 'activate'
                        } this user?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: adminUser.isActive ? 'Deactivate' : 'Activate',
                            style: adminUser.isActive ? 'destructive' : 'default',
                            onPress: () =>
                              handleToggleUserStatus(adminUser.id, adminUser.isActive),
                          },
                        ]
                      )
                    }
                  >
                    <Ionicons
                      name={adminUser.isActive ? 'ban-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color={adminUser.isActive ? theme.colors.danger : theme.colors.success}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    marginBottom: 6,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


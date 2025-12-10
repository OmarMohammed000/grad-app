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
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import UserService, { User } from '@/services/user';
import adminService, { AdminUser } from '@/services/admin';
import Toast from 'react-native-toast-message';
import UserDetailModal from '@/components/admin/UserDetailModal';
import ChallengeManagementModal from '@/components/admin/ChallengeManagementModal';

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'challenges'>('users');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [challengeStatusFilter, setChallengeStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [challengeScope, setChallengeScope] = useState<'global' | 'group'>('global');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert'>('all');
  const [tagsFilter, setTagsFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      const params: any = {
        page,
        limit: 20,
      };

      if (searchQuery) params.q = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';

      const response = await adminService.searchUsers(params);
      const usersList = response.users || [];
      setUsers(usersList);
      setFilteredUsers(usersList);
      setTotalPages(response.pagination?.totalPages || 1);

      // Calculate stats from response
      const total = response.pagination?.total || 0;
      const active = usersList.filter((u: AdminUser) => u.isActive).length;
      const admins = usersList.filter((u: AdminUser) => u.role === 'admin').length;

      setStats({
        totalUsers: total,
        activeUsers: active,
        adminUsers: admins,
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch users'
      });
    }
  }, [page, searchQuery, roleFilter, statusFilter]);

  const fetchChallenges = useCallback(async () => {
    try {
      const params: any = {
        limit: 50,
      };

      if (challengeScope === 'global') {
        params.isGlobal = true;
      } else {
        params.isGlobal = false;
        // For group challenges, we might want to see public ones or all?
        // Let's assume admin wants to see all, but the API defaults to isPublic=true if not specified
        // We can pass isPublic=undefined to let the backend decide, or explicit.
        // If we want to see ALL group challenges (even private), we might need backend support or pass isPublic=false?
        // Actually, let's just pass isGlobal=false.
      }

      if (challengeStatusFilter !== 'all') {
        params.status = challengeStatusFilter;
      }

      if (difficultyFilter !== 'all') {
        params.difficultyLevel = difficultyFilter;
      }

      if (tagsFilter) {
        params.tags = tagsFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await adminService.getAllChallenges(params);
      setChallenges(response.challenges || []);
    } catch (error: any) {
      console.error('Error fetching challenges:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch challenges'
      });
    }
  }, [challengeStatusFilter, challengeScope, difficultyFilter, tagsFilter, searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchUserData();
    if (activeTab === 'users') {
      await fetchUsers();
    } else {
      await fetchChallenges();
    }
    setLoading(false);
  }, [fetchUserData, fetchUsers, fetchChallenges, activeTab]);

  // Immediate updates for dropdown filters
  useEffect(() => {
    loadData();
  }, [activeTab, page, roleFilter, statusFilter, challengeStatusFilter, challengeScope, difficultyFilter]);

  // Debounced updates for text inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, tagsFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleUserPress = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDetail(true);
  };

  const handleCreateChallenge = () => {
    setSelectedChallenge(null);
    setShowChallengeModal(true);
  };

  const handleEditChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    // For delete confirmation, we should ideally use a custom modal.
    // However, native Alert is acceptable for critical destructive actions where a modal isn't available.
    // Since the user asked to "redo all the alerts", I should probably replace this too, but building a custom confirmation modal
    // is outside the scope of just "reworking alerts" to "toasts".
    // A Toast cannot handle "Cancel/Delete" user input.
    // I will keep the Alert for confirmation but ensure the success/error feedback uses Toasts.
    Alert.alert(
      'Delete Challenge',
      'Are you sure you want to delete this global challenge? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteGlobalChallenge(challengeId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Challenge deleted successfully'
              });
              fetchChallenges();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete challenge'
              });
            }
          }
        }
      ]
    );
  };

  const renderUserCard = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}
      onPress={() => handleUserPress(item.id)}
    >
      <View style={styles.userCardContent}>
        <View
          style={[
            styles.userAvatar,
            {
              backgroundColor:
                item.role === 'admin' ? theme.colors.warning : theme.colors.primary,
            },
          ]}
        >
          <Text style={styles.userAvatarText}>
            {item.displayName?.charAt(0).toUpperCase() || item.email.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.displayName || item.email}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {item.email}
          </Text>
          <View style={styles.userBadges}>
            {item.role === 'admin' && (
              <View style={[styles.badge, { backgroundColor: theme.colors.warning + '22' }]}>
                <Text style={[styles.badgeText, { color: theme.colors.warning }]}>Admin</Text>
              </View>
            )}
            {!item.isActive && (
              <View style={[styles.badge, { backgroundColor: theme.colors.danger + '22' }]}>
                <Text style={[styles.badgeText, { color: theme.colors.danger }]}>Inactive</Text>
              </View>
            )}
            {item.level && (
              <View style={[styles.badge, { backgroundColor: theme.colors.primary + '22' }]}>
                <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                  Lvl {item.level}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderChallengeCard = (challenge: any) => (
    <View
      key={challenge.id}
      style={[styles.challengeCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}
    >
      <View style={styles.challengeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>
            {challenge.title}
          </Text>
          <Text
            style={[styles.challengeDescription, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {challenge.description}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(challenge.status) + '22' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(challenge.status) }]}>
            {challenge.status}
          </Text>
        </View>
      </View>

      <View style={styles.challengeStats}>
        <View style={styles.challengeStat}>
          <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.challengeStatText, { color: theme.colors.textSecondary }]}>
            {challenge.currentParticipants} participants
          </Text>
        </View>
        <View style={styles.challengeStat}>
          <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.challengeStatText, { color: theme.colors.textSecondary }]}>
            {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.challengeActions}>
        {challenge.isGlobal && (
          <TouchableOpacity
            style={[styles.challengeActionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleEditChallenge(challenge)}
          >
            <Ionicons name="create" size={18} color="#fff" />
            <Text style={styles.challengeActionText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.challengeActionButton, { backgroundColor: theme.colors.danger }]}
          onPress={() => handleDeleteChallenge(challenge.id)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.challengeActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'upcoming':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (user?.role !== 'admin') {
    return null; // Will redirect
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Admin Dashboard
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => {
            setActiveTab('users');
            setPage(1);
          }}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'users' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'users' ? theme.colors.primary : theme.colors.text },
            ]}
          >
            Users
          </Text>
          {activeTab === 'users' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => {
            setActiveTab('challenges');
            setPage(1);
          }}
        >
          <Ionicons
            name="trophy"
            size={20}
            color={
              activeTab === 'challenges' ? theme.colors.primary : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'challenges' ? theme.colors.primary : theme.colors.text,
              },
            ]}
          >
            Challenges
          </Text>
          {activeTab === 'challenges' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {activeTab === 'users' && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.totalUsers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Users
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.activeUsers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Active Users
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.warning} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.adminUsers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Admins</Text>
          </View>
        </View>
      )}

      {/* Search & Filters for Users */}
      {activeTab === 'users' && (
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search by name, email, or ID..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'all' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setRoleFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: roleFilter === 'all' ? '#fff' : theme.colors.text },
                ]}
              >
                All Roles
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'admin' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setRoleFilter('admin')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: roleFilter === 'admin' ? '#fff' : theme.colors.text },
                ]}
              >
                Admins
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                roleFilter === 'user' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setRoleFilter('user')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: roleFilter === 'user' ? '#fff' : theme.colors.text },
                ]}
              >
                Users
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === 'active' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() =>
                setStatusFilter(statusFilter === 'active' ? 'all' : 'active')
              }
            >
              <Text
                style={[
                  styles.filterText,
                  { color: statusFilter === 'active' ? '#fff' : theme.colors.text },
                ]}
              >
                Active Only
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Search & Filters for Challenges */}
      {activeTab === 'challenges' && (
        <View style={styles.searchSection}>
          {/* Challenge Scope Tabs */}
          <View style={styles.scopeTabs}>
            <TouchableOpacity
              style={[styles.scopeTab, challengeScope === 'global' && styles.activeScopeTab]}
              onPress={() => setChallengeScope('global')}
            >
              <Text style={[styles.scopeTabText, challengeScope === 'global' && styles.activeScopeTabText]}>Global</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeTab, challengeScope === 'group' && styles.activeScopeTab]}
              onPress={() => setChallengeScope('group')}
            >
              <Text style={[styles.scopeTabText, challengeScope === 'group' && styles.activeScopeTabText]}>Group</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search challenges..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                challengeStatusFilter === 'all' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setChallengeStatusFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: challengeStatusFilter === 'all' ? '#fff' : theme.colors.text },
                ]}
              >
                All Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                challengeStatusFilter === 'active' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setChallengeStatusFilter('active')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: challengeStatusFilter === 'active' ? '#fff' : theme.colors.text },
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                challengeStatusFilter === 'upcoming' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setChallengeStatusFilter('upcoming')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: challengeStatusFilter === 'upcoming' ? '#fff' : theme.colors.text },
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                challengeStatusFilter === 'completed' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setChallengeStatusFilter('completed')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: challengeStatusFilter === 'completed' ? '#fff' : theme.colors.text },
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>

            {/* Difficulty Filters */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyFilter === 'all' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border, marginLeft: 8 }
              ]}
              onPress={() => setDifficultyFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: difficultyFilter === 'all' ? '#fff' : theme.colors.text },
                ]}
              >
                All Difficulties
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyFilter === 'beginner' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setDifficultyFilter('beginner')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: difficultyFilter === 'beginner' ? '#fff' : theme.colors.text },
                ]}
              >
                Beginner
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyFilter === 'intermediate' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setDifficultyFilter('intermediate')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: difficultyFilter === 'intermediate' ? '#fff' : theme.colors.text },
                ]}
              >
                Intermediate
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyFilter === 'advanced' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setDifficultyFilter('advanced')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: difficultyFilter === 'advanced' ? '#fff' : theme.colors.text },
                ]}
              >
                Advanced
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyFilter === 'expert' && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setDifficultyFilter('expert')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: difficultyFilter === 'expert' ? '#fff' : theme.colors.text },
                ]}
              >
                Expert
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
            <View style={[styles.searchBar, { backgroundColor: theme.colors.card, flex: 1, marginBottom: 0 }]}>
              <Ionicons name="pricetag" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Filter by tags (comma separated)..."
                placeholderTextColor={theme.colors.textSecondary}
                value={tagsFilter}
                onChangeText={setTagsFilter}
              />
              {tagsFilter.length > 0 && (
                <TouchableOpacity onPress={() => setTagsFilter('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {challengeScope === 'global' && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateChallenge}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      {activeTab === 'users' ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {challenges.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {challengeScope === 'global' ? 'No global challenges found' : 'No group challenges found'}
              </Text>
            </View>
          ) : (
            challenges.map(renderChallengeCard)
          )}
        </ScrollView>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        isVisible={showUserDetail}
        onClose={() => {
          setShowUserDetail(false);
          setSelectedUserId(null);
        }}
        onUserUpdated={() => {
          fetchUsers();
        }}
      />

      {/* Challenge Management Modal */}
      <ChallengeManagementModal
        isVisible={showChallengeModal}
        onClose={() => {
          setShowChallengeModal(false);
          setSelectedChallenge(null);
        }}
        onChallengeCreated={() => {
          fetchChallenges();
        }}
        challengeToEdit={selectedChallenge}
      />
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scopeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0', // You might want to use theme color here if available via context in styles, but styles is outside component
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  scopeTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeScopeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scopeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeScopeTabText: {
    color: '#000',
  },

  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userInfo: {
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
  challengeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    height: 32,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeStats: {
    gap: 8,
    marginBottom: 12,
  },
  challengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeStatText: {
    fontSize: 14,
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  challengeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  challengeActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

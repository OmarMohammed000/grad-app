import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { User } from '@/services/user';
import UserService from '@/services/user';
import { ProfileAvatar } from './ProfileAvatar';

interface ProfileHeaderProps {
  user: User | null;
  onEditPress: () => void;
}

export function ProfileHeader({ user, onEditPress }: ProfileHeaderProps) {
  const theme = useTheme();
  const router = useRouter();

  const getDisplayName = () => {
    return UserService.getUserDisplayName(user || undefined);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.primary },
      ]}
    >
      <View style={styles.content}>
        <ProfileAvatar user={user} onEditPress={onEditPress} />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{getDisplayName()}</Text>
          {user?.profile?.bio && (
            <Text style={styles.userBio}>{user.profile.bio}</Text>
          )}
          <View style={styles.userMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="mail" size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.metaText}>{user?.email || ''}</Text>
            </View>
            {user?.createdAt && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar"
                  size={14}
                  color="rgba(255, 255, 255, 0.8)"
                />
                <Text style={styles.metaText}>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={18} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            onPress={onEditPress}
          >
            <Ionicons name="pencil" size={18} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  content: {
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});


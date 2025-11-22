import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { User } from '@/services/user';
import UserService from '@/services/user';

interface ProfileAvatarProps {
  user: User | null;
  onEditPress: () => void;
}

export function ProfileAvatar({ user, onEditPress }: ProfileAvatarProps) {
  const theme = useTheme();
  const [avatarError, setAvatarError] = useState(false);

  const getInitials = () => {
    const displayName = UserService.getUserDisplayName(user || undefined);
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {user?.profile?.avatarUrl && !avatarError ? (
        <Image
          source={{ uri: user.profile.avatarUrl }}
          style={styles.avatar}
          onError={() => setAvatarError(true)}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
          ]}
        >
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.colors.card }]}
        onPress={onEditPress}
      >
        <Ionicons name="camera" size={16} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});


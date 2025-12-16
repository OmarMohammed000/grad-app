import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

type FilterTab = 'my' | 'group' | 'global';

interface ChallengeFilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}

export function ChallengeFilterTabs({ activeTab, onTabChange }: ChallengeFilterTabsProps) {
  const theme = useTheme();

  const tabs: { key: FilterTab; label: string; icon: string }[] = [
    { key: 'my', label: 'Personal', icon: 'person' },
    { key: 'group', label: 'Group', icon: 'people' },
    { key: 'global', label: 'Global', icon: 'planet' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && [
                styles.tabActive,
                { backgroundColor: theme.colors.primary },
              ],
              !isActive && styles.tabInactive,
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.icon as any : `${tab.icon}-outline` as any}
              size={18}
              color={isActive ? '#ffffff' : theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
                !isActive && { color: theme.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});


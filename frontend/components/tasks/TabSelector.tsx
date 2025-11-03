import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TabSelectorProps {
  activeTab: 'habits' | 'todos';
  onTabChange: (tab: 'habits' | 'todos') => void;
  habitCount?: number;
  todoCount?: number;
}

export function TabSelector({
  activeTab,
  onTabChange,
  habitCount = 0,
  todoCount = 0,
}: TabSelectorProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'habits' && [
            styles.activeTab,
            { backgroundColor: theme.colors.background },
            theme.shadows.sm,
          ],
        ]}
        onPress={() => onTabChange('habits')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === 'habits'
                  ? theme.colors.text
                  : theme.colors.textSecondary,
            },
            activeTab === 'habits' && styles.activeTabText,
          ]}
        >
          Habits
        </Text>
        {habitCount > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: activeTab === 'habits' ? theme.colors.primary : theme.colors.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: activeTab === 'habits' ? '#ffffff' : theme.colors.textSecondary }]}>
              {habitCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'todos' && [
            styles.activeTab,
            { backgroundColor: theme.colors.background },
            theme.shadows.sm,
          ],
        ]}
        onPress={() => onTabChange('todos')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === 'todos'
                  ? theme.colors.text
                  : theme.colors.textSecondary,
            },
            activeTab === 'todos' && styles.activeTabText,
          ]}
        >
          To-Dos
        </Text>
        {todoCount > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: activeTab === 'todos' ? theme.colors.primary : theme.colors.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: activeTab === 'todos' ? '#ffffff' : theme.colors.textSecondary }]}>
              {todoCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    // Styles applied via inline style
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});


# Home Screen Components

This directory contains all the components for the gamified home screen of the Grad Hunter app.

## Component Structure

### Header
- **File**: `Header.tsx`
- **Purpose**: Displays welcome message, user avatar, notifications, and settings
- **Props**:
  - `userName: string` - User's name to display
  - `userAvatar?: string` - Optional avatar URL

### UserProgressBar
- **File**: `UserProgressBar.tsx`
- **Purpose**: Shows user's current level, rank, and XP progress
- **Props**:
  - `level: number` - Current user level
  - `currentXP: number` - Current XP amount
  - `maxXP: number` - XP needed for next level
  - `rank: string` - User's current rank

### QuickActions
- **File**: `QuickActions.tsx`
- **Purpose**: Provides quick access buttons for common actions
- **Props**:
  - `onAddTask: () => void` - Handler for Add Task button
  - `onJoinChallenge: () => void` - Handler for Join Challenge button

### TodaysQuests
- **File**: `TodaysQuests.tsx`
- **Purpose**: Displays list of daily quests/tasks
- **Props**:
  - `quests: Quest[]` - Array of quest items
  - `onToggleQuest: (id: string) => void` - Handler for toggling quest completion

### QuestItem
- **File**: `QuestItem.tsx`
- **Purpose**: Individual quest item component
- **Props**:
  - `quest: Quest` - Quest data object
  - `onToggle: (id: string) => void` - Handler for toggling completion

**Quest Type**:
```typescript
interface Quest {
  id: string;
  title: string;
  xp: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
}
```

### ActiveChallenges
- **File**: `ActiveChallenges.tsx`
- **Purpose**: Displays active challenges or empty state
- **Props**:
  - `challenges: Challenge[]` - Array of challenge items
  - `onPressChallenge: (id: string) => void` - Handler for challenge press

### ChallengeCard
- **File**: `ChallengeCard.tsx`
- **Purpose**: Individual challenge card component
- **Props**:
  - `challenge: Challenge` - Challenge data object
  - `onPress: (id: string) => void` - Handler for card press

**Challenge Type**:
```typescript
interface Challenge {
  id: string;
  title: string;
  progress: number;
  total: number;
  daysLeft: number;
  participants: number;
  reward: number;
  color: string;
  icon: string;
}
```

### EmptyState
- **File**: `EmptyState.tsx`
- **Purpose**: Generic empty state component for when lists are empty
- **Props**:
  - `icon: string` - Ionicons icon name
  - `title: string` - Empty state title
  - `message: string` - Empty state message

## Theme Support

All components support both light and dark modes automatically through the `useTheme` hook from `@/contexts/ThemeContext`.

## Usage Example

```tsx
import {
  Header,
  UserProgressBar,
  QuickActions,
  TodaysQuests,
  ActiveChallenges,
} from '@/components/home';

function HomeScreen() {
  return (
    <ScrollView>
      <Header userName="John Doe" />
      <UserProgressBar level={12} currentXP={2840} maxXP={3000} rank="Hunter" />
      <QuickActions onAddTask={handleAddTask} onJoinChallenge={handleJoinChallenge} />
      <TodaysQuests quests={quests} onToggleQuest={handleToggleQuest} />
      <ActiveChallenges challenges={challenges} onPressChallenge={handlePressChallenge} />
    </ScrollView>
  );
}
```

## Styling

All components use:
- Theme colors from `@/contexts/ThemeContext`
- Spacing from theme constants
- Shadows from theme system
- Ionicons for all icons

## Future Enhancements

- [ ] Connect to backend API for real data
- [ ] Add animations for quest completion
- [ ] Add haptic feedback
- [ ] Add pull-to-refresh functionality
- [ ] Add skeleton loaders for loading states
- [ ] Add toast notifications for actions


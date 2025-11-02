# Component Tree Visualization

## Home Screen Component Hierarchy

```
HomeScreen (app/(tabs)/index.tsx)
│
├─ ScrollView (with RefreshControl)
   │
   ├─ Header
   │  ├─ Avatar (Image or Initial Circle)
   │  ├─ User Info
   │  │  ├─ Welcome Text
   │  │  └─ User Name
   │  └─ Actions
   │     ├─ Notifications Button (with Badge)
   │     └─ Settings Button
   │
   ├─ UserProgressBar
   │  ├─ Level & XP Text
   │  └─ Progress Bar
   │
   ├─ QuickActions
   │  ├─ Add Task Button (Primary Blue)
   │  └─ Join Challenge Button (Success Green)
   │
   ├─ TodaysQuests
   │  ├─ Section Header (with count)
   │  └─ Quest List
   │     └─ QuestItem (for each quest)
   │        ├─ Checkbox
   │        ├─ Quest Title & XP
   │        └─ Difficulty Badge
   │
   └─ ActiveChallenges
      ├─ Section Header
      └─ Challenge List OR EmptyState
         └─ ChallengeCard (for each challenge)
            ├─ Header (Icon + Title + Trophy)
            ├─ Stats (Progress + Reward)
            ├─ Progress Bar
            └─ Participants Info
```

## Tab Navigation Structure

```
TabLayout (app/(tabs)/_layout.tsx)
│
├─ Tab: Home (index.tsx)
│  └─ [Complete Home Screen Implementation]
│
├─ Tab: Tasks (tasks.tsx)
│  └─ [Placeholder - Coming Soon]
│
├─ Tab: Challenges (challenges.tsx)
│  └─ [Placeholder - Coming Soon]
│
└─ Tab: Profile (profile.tsx)
   └─ [Placeholder - Coming Soon]
```

## Data Flow

```
┌─────────────────────────────────────────────┐
│            Home Screen State                │
│                                             │
│  • userData (level, XP, rank, name)        │
│  • quests[] (id, title, xp, difficulty)    │
│  • challenges[] (id, title, progress, etc) │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   User Actions          Refresh Data
   (handlers)           (pull-to-refresh)
        │                       │
        ▼                       ▼
   Update State ◄──────────── Fetch from API
   (setState)                 (backend call)
        │
        ▼
   Re-render Components
   (React updates UI)
```

## Component Props Flow

```
HomeScreen
   │
   ├─→ Header
   │   └─ Props: userName, userAvatar
   │
   ├─→ UserProgressBar
   │   └─ Props: level, currentXP, maxXP, rank
   │
   ├─→ QuickActions
   │   └─ Props: onAddTask, onJoinChallenge
   │
   ├─→ TodaysQuests
   │   ├─ Props: quests[], onToggleQuest
   │   └─→ QuestItem (mapped)
   │       └─ Props: quest, onToggle
   │
   └─→ ActiveChallenges
       ├─ Props: challenges[], onPressChallenge
       ├─→ ChallengeCard (mapped)
       │   └─ Props: challenge, onPress
       └─→ EmptyState (if challenges.length === 0)
           └─ Props: icon, title, message
```

## Theme Context Flow

```
ThemeProvider (app/_layout.tsx)
      │
      └─→ Provides: theme object
           │
           ├─→ colors (primary, secondary, text, background, etc)
           ├─→ spacing (xs, sm, md, lg, xl)
           ├─→ borderRadius (sm, md, lg, xl, full)
           ├─→ fontSize (xs, sm, md, lg, xl)
           └─→ shadows (sm, md, lg)
                │
                └─→ All Components use useTheme() hook
                     to access theme values
```

## Event Flow Examples

### Quest Toggle
```
User taps QuestItem
    ↓
onToggle(questId) triggered
    ↓
QuestItem calls prop: onToggle
    ↓
TodaysQuests receives onToggleQuest
    ↓
HomeScreen handleToggleQuest
    ↓
setQuests updates state
    ↓
React re-renders QuestItem
    ↓
UI shows completed state
```

### Add Task Action
```
User taps "Add Task" button
    ↓
QuickActions onAddTask prop called
    ↓
HomeScreen handleAddTask executed
    ↓
(Future: Navigate to add task screen)
    ↓
(Future: Submit to backend)
    ↓
(Future: Refresh quests list)
```

### Challenge Card Press
```
User taps ChallengeCard
    ↓
onPress(challengeId) triggered
    ↓
ChallengeCard calls prop: onPress
    ↓
ActiveChallenges receives onPressChallenge
    ↓
HomeScreen handlePressChallenge executed
    ↓
(Future: Navigate to challenge details)
```

## State Management

Currently using:
- **Local State**: `useState` for component state
- **Props**: Passing data down component tree
- **Context**: Theme context for theme values

Future considerations:
- **Redux/Zustand**: For global state management
- **React Query**: For server state and caching
- **AsyncStorage**: For local persistence

## Component Reusability

### Highly Reusable
- `EmptyState` - Can be used anywhere
- `QuestItem` - Can be used in other quest lists
- `ChallengeCard` - Can be used in challenge browsing

### Screen-Specific
- `Header` - Specific to home screen
- `UserProgressBar` - Could be reused in profile
- `QuickActions` - Home screen specific

### Composition Pattern
Components follow composition over inheritance:
- Small, focused components
- Clear single responsibility
- Props for customization
- No prop drilling (max 2 levels)


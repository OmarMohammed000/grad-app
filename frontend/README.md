# 🚀 Arise: Gamified Productivity (Frontend)

![Arise Banner](https://via.placeholder.com/800x200?text=Arise+Mobile+App) <!-- Replace with actual banner if available -->

**Arise** is a mobile productivity application that transforms habit formation into an RPG-style game. Unlike traditional to-do lists, Arise combats "productivity boredom" by rewarding users with XP, Levels, and Streaks for completing tasks.

The standout feature of Arise is its **Verified Economy**: users cannot simply "check a box" to complete hard challenges—they must prove it. The app integrates **Google Gemini AI** to act as a "Digital Referee," analyzing photo evidence to verify task completion before awarding points.

---

## 🌟 Key Features

*   **🎮 Gamification Engine:** dynamic XP rewards based on task difficulty (`Easy` to `Extreme`) and consistency streaks.
*   **🤖 AI Verification:** Submit photo proof for challenges (e.g., "Gym Workout"). The integration with **Google Gemini Vision** automatically accepts or rejects the submission based on context.
*   **⚔️ Group Challenges:** Join global quests with other users.
*   **📊 Leaderboards:** Real-time ranking system powered by WebSockets.
*   **Premium UI:** A sleek, "Hunter" themed dark mode application built for focus and aesthetics.

---

## 🛠️ Tech Stack

*   **Framework:** [React Native](https://reactnative.dev/)
*   **Platform:** [Expo](https://expo.dev/) (Managed Workflow)
*   **Routing:** Expo Router (File-based routing)
*   **Styling:** Custom StyleSheet with Theming Context
*   **State Management:** React Context API
*   **Networking:** Axios
*   **Assets:** Expo Vector Icons, Expo Image

---

## 📱 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   Expo Go app on your physical device (Android/iOS) OR an Android Emulator.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/arise-frontend.git
    cd arise-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    npx expo install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root if required (usually for API URL).
    ```env
    EXPO_PUBLIC_API_URL=http://your-backend-ip:3000
    ```

4.  **Run the App:**
    ```bash
    npx expo start
    ```
    *   Scan the QR code with **Expo Go** (Android/iOS).
    *   Press `a` to open in Android Emulator.
    *   Press `w` to run in Web Browser.

---

## 📂 Project Structure

```
frontend/
├── app/                  # Screens & Routes (Expo Router)
│   ├── (auth)/           # Login/Register screens
│   ├── (tabs)/           # Main Tab Navigation (Home, Challenges, Leaderboard)
│   └── ...
├── components/           # Reusable UI Components
│   ├── challenges/       # Challenge-specific cards & lists
│   ├── form/             # Input, Button, Card components
│   └── tasks/            # Todo items & modals
├── contexts/             # Global State (Auth, Theme)
├── services/             # API integration (AuthService, ChallengeService)
└── hooks/                # Custom React Hooks
```

---

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

*Verified Productivity. Gamified Life.*

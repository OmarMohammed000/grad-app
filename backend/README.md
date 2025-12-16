# 🧠 Arise API: Gamified Productivity Backend

**Arise API** is the robust server-side application powering the Arise mobile platform. It handles the complex logic required for a "Verified Productivity Economy," including secure authentication, real-time leaderboard calculations, and—most critically—**AI-powered proof verification**.

Built with a scalable **Node.js** and **PostgreSQL** architecture, it serves as the central authority for user progression, ensuring that every XP point earned is legitimate.

---

## ⚡ Key Features

*   **🔐 Secure Authentication:** JWT-based auth handling Registration, Login, and Google OAuth integration.
*   **🤖 AI Verification Service:** Integrates **Google Gemini 2.5 Flash** to analyze user-uploaded images and verify task completion against text descriptions.
*   **🏆 Gamification Logic:**
    *   Dynamic XP calculation based on difficulty modifiers.
    *   Streak tracking and bonus algorithms.
    *   Level-up threshold management.
*   **📡 Real-Time Updates:** Uses **Socket.io** to push live leaderboard updates to connected clients.
*   **💾 Database Management:** Structured Relational Data (Users, Tasks, Challenges, Proofs) managed via **Sequelize ORM**.

---

## 🛠️ Tech Stack

*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)
*   **ORM:** [Sequelize](https://sequelize.org/)
*   **AI:** [Google Gemini API](https://ai.google.dev/)
*   **Real-time:** [Socket.io](https://socket.io/)
*   **Storage:** Multer (local) / Cloud Integration ready.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL (Local instance or Cloud URL)
*   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/arise-backend.git
    cd arise-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    DB_USERNAME=postgres
    DB_PASSWORD=yourpassword
    DB_NAME=arise_db
    DB_HOST=127.0.0.1
    JWT_SECRET=your_super_secret_jwt_key
    GEMINI_API_KEY=your_google_gemini_api_key
    ```

4.  **Database Migration:**
    Run Sequelize migrations to create the tables.
    ```bash
    npx sequelize-cli db:migrate
    # Optional: Seed data
    npx sequelize-cli db:seed:all
    ```

5.  **Run the Server:**
    ```bash
    npm run dev
    ```
    The server typically starts on `http://localhost:3000`.

---

## 📐 Architecture Overview

The backend follows a **Controller-Service-Model** pattern:

*   **Routes (`/routes`):** Define API endpoints (e.g., `POST /challenge/verify`).
*   **Controllers (`/controllers`):** Handle HTTP requests, input validation, and send responses.
*   **Services (`/services`):** Contain business logic (e.g., `aiVerificationService.js` calls Gemini, `xpService.js` calculates points).
*   **Models (`/models`):** Define Database Schemas (User, Task, Challenge).

---

## 🧪 API Documentation (Snapshots)

### Auth
*   `POST /auth/register` - Create new user.
*   `POST /auth/login` - Authenticate & receive JWT.

### Challenges
*   `GET /challenges` - List available quests.
*   `POST /challenges/verify` - **(Core)** Upload image & verify via AI.

### User
*   `GET /user/profile` - Get stats, level, and XP.

---

*Powered by Node.js & Google Gemini.*

import db from "../../models/index.js";
import bcrypt from "bcryptjs";
import { QueryTypes } from 'sequelize';

/**
 * Register a new user
 * Creates user account and initializes UserProfile and Character
 */
export default async function register(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Request body is missing" });
  }

  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Password validation (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // Check if user already exists
    const existingUser = await db.sequelize.query(
      `SELECT email FROM users WHERE email = $1`,
      {
        bind: [email],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (existingUser && existingUser.length > 0) {
      await transaction.rollback();
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10
    );

    // Create user
    const [newUser] = await db.sequelize.query(
      `INSERT INTO users (email, password, "isActive", "createdAt", "updatedAt") 
       VALUES ($1, $2, true, NOW(), NOW()) 
       RETURNING id, email`,
      {
        bind: [email, hashedPassword],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    const userId = newUser[0].id;

    // Create user profile
    await db.sequelize.query(
      `INSERT INTO user_profiles (
        "userId", 
        "displayName", 
        timezone, 
        language, 
        theme, 
        "notificationsEnabled", 
        "emailNotifications", 
        "soundEnabled", 
        "isPublicProfile",
        "createdAt", 
        "updatedAt"
      ) 
      VALUES ($1, $2, 'UTC', 'en', 'auto', true, true, true, true, NOW(), NOW())`,
      {
        bind: [userId, displayName || 'Hunter'],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Create character (starts at E-Rank, Level 1)
    await db.sequelize.query(
      `INSERT INTO characters (
        "userId",
        "rankId",
        level,
        "currentXp",
        "totalXp",
        "xpToNextLevel",
        "streakDays",
        "longestStreak",
        "totalTasksCompleted",
        "totalHabitsCompleted",
        "totalChallengesJoined",
        "totalChallengesCompleted",
        "createdAt",
        "updatedAt"
      ) 
      VALUES ($1, 1, 1, 0, 0, 100, 0, 0, 0, 0, 0, 0, NOW(), NOW())`,
      {
        bind: [userId],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Log activity
    await db.sequelize.query(
      `INSERT INTO activity_logs (
        "userId",
        "activityType",
        description,
        "xpGained",
        "isPublic",
        importance,
        "createdAt",
        "updatedAt"
      ) 
      VALUES ($1, 'user_registered', 'Welcome to the Hunter System!', 0, true, 'milestone', NOW(), NOW())`,
      {
        bind: [userId],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "User registered successfully",
      userId: userId
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error registering user:", error);
    return res.status(500).json({ 
      message: "An error occurred while registering the user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

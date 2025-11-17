import db from "../../models/index.js";
import bcrypt from "bcryptjs";

/**
 * Create new user (admin only)
 * POST /admin/users
 */
export default async function createUser(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { email, password, displayName, role = 'user' } = req.body;

    if (!email || !password) {
      await transaction.rollback();
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password validation
    if (password.length < 6) {
      await transaction.rollback();
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Role validation
    if (!['user', 'admin'].includes(role)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    // Check if user exists
    const existingUser = await db.User.findOne({
      where: { email },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10
    );

    // Create user
    const newUser = await db.User.create({
      email,
      password: hashedPassword,
      role,
      isActive: true
    }, { transaction });

    // Create user profile
    await db.UserProfile.create({
      userId: newUser.id,
      displayName: displayName || 'Hunter',
      timezone: 'UTC',
      language: 'en',
      theme: 'auto',
      notificationsEnabled: true,
      emailNotifications: true,
      soundEnabled: true,
      isPublicProfile: true
    }, { transaction });

    // Create character
    await db.Character.create({
      userId: newUser.id,
      rankId: 1,
      level: 1,
      currentXp: 0,
      totalXp: 0,
      xpToNextLevel: 100,
      streakDays: 0,
      longestStreak: 0,
      totalTasksCompleted: 0,
      totalHabitsCompleted: 0,
      totalChallengesJoined: 0,
      totalChallengesCompleted: 0
    }, { transaction });

    // Log activity
    await db.ActivityLog.create({
      userId: newUser.id,
      activityType: 'user_created_by_admin',
      description: `User created by admin (${req.user.userId})`,
      xpGained: 0,
      isPublic: false,
      importance: 'low'
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: "User created successfully",
      userId: newUser.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error creating user:", error);
    return res.status(500).json({ 
      message: "An error occurred while creating user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

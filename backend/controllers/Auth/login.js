import db from "../../models/index.js";
import bcrypt from "bcryptjs";
import { QueryTypes } from 'sequelize';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Login user and return access token
 * Sets refresh token in httpOnly cookie
 */
export default async function login(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Request body is missing" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Get user with related data
    const [user] = await db.sequelize.query(
      `SELECT 
        u.id, 
        u.email, 
        u.password, 
        u."isActive",
        up."displayName",
        c.level,
        c."currentXp",
        c."totalXp",
        r.name as "rankName",
        r.color as "rankColor"
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up."userId"
       LEFT JOIN characters c ON u.id = c."userId"
       LEFT JOIN ranks r ON c."rankId" = r.id
       WHERE u.email = $1`,
      {
        bind: [email],
        type: QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated. Please contact support." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Hash refresh token before storing
    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Update refresh token and last login
    await db.sequelize.query(
      `UPDATE users 
       SET "refreshToken" = $1, "lastLogin" = NOW(), "updatedAt" = NOW() 
       WHERE id = $2`,
      {
        bind: [refreshHash, user.id],
        type: QueryTypes.UPDATE
      }
    );

    // Set refresh token cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh'
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Return user data with access token
    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName || 'Hunter',
        level: user.level || 1,
        currentXp: user.currentXp || 0,
        totalXp: user.totalXp || 0,
        rank: {
          name: user.rankName || 'E-Rank',
          color: user.rankColor || '#808080'
        }
      }
    });

  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ 
      message: "An error occurred while logging in",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

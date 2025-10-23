import db from "../../models/index.js";
import bcrypt from "bcryptjs";
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
    // Get user with related data using Sequelize ORM
    const user = await db.User.findOne({
      where: { email },
      include: [
        {
          model: db.UserProfile,
          as: 'profile',
          attributes: ['displayName']
        },
        {
          model: db.Character,
          as: 'character',
          attributes: ['level', 'currentXp', 'totalXp'],
          include: [
            {
              model: db.Rank,
              as: 'rank',
              attributes: ['name', 'color']
            }
          ]
        }
      ],
      attributes: ['id', 'email', 'password', 'isActive', 'role']
    });

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
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Hash refresh token before storing
    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Update refresh token and last login using Sequelize ORM
    await user.update({
      refreshToken: refreshHash,
      lastLogin: new Date()
    });

    // Set refresh token cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: 'auth/refresh'
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Return user data with access token
    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName || 'Hunter',
        role: user.role,
        level: user.character?.level || 1,
        currentXp: user.character?.currentXp || 0,
        totalXp: user.character?.totalXp || 0,
        rank: {
          name: user.character?.rank?.name || 'E-Rank',
          color: user.character?.rank?.color || '#808080'
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

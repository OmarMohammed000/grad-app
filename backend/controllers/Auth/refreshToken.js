import jwt from "jsonwebtoken";
import db from "../../models/index.js";
import crypto from "crypto";

/**
 * Refresh access token using refresh token from cookie or request body
 * Supports both cookie-based (web) and body-based (mobile) refresh tokens
 */
export default async function refreshToken(req, res) {
  // Try to get refresh token from cookie first (web), then from body (mobile)
  let refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Verify refresh token exists in database using Sequelize ORM
    const user = await db.User.findOne({
      where: { 
        id: decoded.userId,
        refreshToken: hashedToken
      },
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
      attributes: ['id', 'email', 'isActive', 'role']
    });

    if (!user) {
      res.clearCookie('refreshToken', {
        path: '/auth/refresh'
      });
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Check if account is active
    if (!user.isActive) {
      res.clearCookie('refreshToken', {
        path: '/auth/refresh'
      });
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Generate new tokens (token rotation)
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const newRefreshHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    // Update refresh token in database using Sequelize ORM
    await user.update({
      refreshToken: newRefreshHash
    });

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      path: '/auth/refresh',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return new access token with user data
    // Also return refresh token in body for React Native compatibility
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // Include in body for mobile apps
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
    console.error("Error refreshing token:", error);
    res.clearCookie('refreshToken', {
      path: '/auth/refresh'
    });
    return res.status(500).json({ 
      message: "An error occurred while refreshing the token",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

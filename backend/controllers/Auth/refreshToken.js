import { QueryTypes } from "sequelize";
import jwt from "jsonwebtoken";
import db from "../../models/index.js";
import crypto from "crypto";

/**
 * Refresh access token using refresh token from cookie
 */
export default async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Verify refresh token exists in database
    const [user] = await db.sequelize.query(
      `SELECT 
        u.id, 
        u.email, 
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
       WHERE u.id = $1 AND u."refreshToken" = $2`,
      {
        bind: [decoded.userId, hashedToken],
        type: QueryTypes.SELECT
      }
    );

    if (!user) {
      res.clearCookie('refreshToken', {
        path: '/api/auth/refresh'
      });
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Check if account is active
    if (!user.isActive) {
      res.clearCookie('refreshToken', {
        path: '/api/auth/refresh'
      });
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Generate new tokens (token rotation)
    const newAccessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const newRefreshHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    // Update refresh token in database
    await db.sequelize.query(
      `UPDATE users SET "refreshToken" = $1, "updatedAt" = NOW() WHERE id = $2`,
      {
        bind: [newRefreshHash, user.id],
        type: QueryTypes.UPDATE
      }
    );

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      path: '/api/auth/refresh',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return new access token with user data
    return res.status(200).json({
      accessToken: newAccessToken,
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
    console.error("Error refreshing token:", error);
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh'
    });
    return res.status(500).json({ 
      message: "An error occurred while refreshing the token",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

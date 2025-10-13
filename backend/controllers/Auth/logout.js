import db from "../../models/index.js";
import crypto from "crypto";
import { QueryTypes } from 'sequelize';

/**
 * Logout user by clearing refresh token
 */
export default async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
      
      await db.sequelize.query(
        `UPDATE users SET "refreshToken" = NULL, "updatedAt" = NOW() WHERE "refreshToken" = $1`,
        {
          bind: [hashedToken],
          type: QueryTypes.UPDATE
        }
      );
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ 
      message: "An error occurred while logging out",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

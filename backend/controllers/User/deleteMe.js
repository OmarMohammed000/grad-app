import db from "../../models/index.js";

/**
 * Soft delete current user account
 * DELETE /users/me
 */
export default async function deleteMe(req, res) {
  try {
    const user = await db.User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Soft delete: deactivate account
    await user.update({
      isActive: false,
      refreshToken: null
    });

    // Log activity
    await db.ActivityLog.create({
      userId: user.id,
      activityType: 'account_deactivated',
      description: 'User deactivated their account',
      xpGained: 0,
      isPublic: false,
      importance: 'warning'
    });

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({ 
      message: "Account deactivated successfully. Contact support to reactivate." 
    });

  } catch (error) {
    console.error("Error deactivating account:", error);
    return res.status(500).json({ 
      message: "An error occurred while deactivating account",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

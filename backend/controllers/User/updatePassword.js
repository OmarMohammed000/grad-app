import db from "../../models/index.js";
import bcrypt from "bcryptjs";

/**
 * Update current user password
 * PUT /users/me/password
 */
export default async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    const user = await db.User.findByPk(req.user.userId, {
      attributes: ['id', 'password', 'googleId']
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.password) {
      return res.status(400).json({ 
        message: "This account uses OAuth login. Password cannot be changed." 
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10
    );

    // Update password
    await user.update({ password: hashedPassword });

    // Log activity
    await db.ActivityLog.create({
      userId: user.id,
      activityType: 'password_changed',
      description: 'Password was changed',
      xpGained: 0,
      isPublic: false,
      importance: 'info'
    });

    return res.status(200).json({ 
      message: "Password updated successfully" 
    });

  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ 
      message: "An error occurred while updating password",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

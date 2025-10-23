import db from "../../models/index.js";

/**
 * Update user (admin only)
 * PUT /admin/users/:id
 */
export default async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { email, isActive, role, displayName } = req.body;

    const user = await db.User.findByPk(id, {
      include: [
        {
          model: db.UserProfile,
          as: 'profile'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build update objects
    const userUpdates = {};
    const profileUpdates = {};

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Check if email is already taken
      const existingUser = await db.User.findOne({
        where: { email, id: { [db.Sequelize.Op.ne]: id } }
      });
      
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }
      
      userUpdates.email = email;
    }

    if (isActive !== undefined) {
      userUpdates.isActive = isActive;
      
      // Clear refresh token if deactivating
      if (!isActive) {
        userUpdates.refreshToken = null;
      }
    }

    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Prevent removing last admin
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await db.User.count({
          where: { role: 'admin', isActive: true }
        });
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: "Cannot remove the last admin. Promote another user first." 
          });
        }
      }
      
      userUpdates.role = role;
    }

    if (displayName !== undefined) {
      if (displayName.length < 2) {
        return res.status(400).json({ message: "Display name must be at least 2 characters" });
      }
      profileUpdates.displayName = displayName;
    }

    // Update user
    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }

    // Update profile
    if (Object.keys(profileUpdates).length > 0 && user.profile) {
      await user.profile.update(profileUpdates);
    }

    // Log activity
    await db.ActivityLog.create({
      userId: user.id,
      activityType: 'user_updated_by_admin',
      description: `User updated by admin (${req.user.userId})`,
      xpGained: 0,
      isPublic: false,
      importance: 'info'
    });

    return res.status(200).json({
      message: "User updated successfully"
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ 
      message: "An error occurred while updating user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

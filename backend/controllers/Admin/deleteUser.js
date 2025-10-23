import db from "../../models/index.js";

/**
 * Delete user (admin only)
 * DELETE /admin/users/:id
 * Soft deletes by setting isActive=false
 */
export default async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({ 
        message: "Cannot delete your own account. Use another admin account." 
      });
    }

    const user = await db.User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting last admin
    if (user.role === 'admin') {
      const adminCount = await db.User.count({
        where: { role: 'admin', isActive: true }
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: "Cannot delete the last admin. Promote another user first." 
        });
      }
    }

    // Soft delete
    await user.update({
      isActive: false,
      refreshToken: null
    });

    // Log activity
    await db.ActivityLog.create({
      userId: user.id,
      activityType: 'user_deleted_by_admin',
      description: `User deactivated by admin (${req.user.userId})`,
      xpGained: 0,
      isPublic: false,
      importance: 'warning'
    });

    return res.status(200).json({ 
      message: "User deactivated successfully" 
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ 
      message: "An error occurred while deleting user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

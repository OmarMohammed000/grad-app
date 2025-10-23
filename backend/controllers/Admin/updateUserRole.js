import db from "../../models/index.js";

/**
 * Update user role (admin only)
 * PATCH /admin/users/:id/role
 */
export default async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role. Must be 'user' or 'admin'" 
      });
    }

    const user = await db.User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent demoting last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await db.User.count({
        where: { role: 'admin', isActive: true }
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: "Cannot demote the last admin. Promote another user first." 
        });
      }
    }

    // Update role
    await user.update({ role });

    // Log activity
    await db.ActivityLog.create({
      userId: user.id,
      activityType: 'role_changed_by_admin',
      description: `Role changed to ${role} by admin (${req.user.userId})`,
      xpGained: 0,
      isPublic: false,
      importance: 'milestone'
    });

    return res.status(200).json({
      message: `User role updated to ${role} successfully`
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ 
      message: "An error occurred while updating role",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

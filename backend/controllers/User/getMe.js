import db from "../../models/index.js";

/**
 * Get current user profile
 * GET /users/me
 */
export default async function getMe(req, res) {
  try {
    const user = await db.User.findByPk(req.user.userId, {
      include: [
        {
          model: db.UserProfile,
          as: 'profile'
        },
        {
          model: db.Character,
          as: 'character',
          include: [
            {
              model: db.Rank,
              as: 'rank',
              attributes: ['name', 'color', 'minXp', 'maxXp']
            }
          ]
        }
      ],
      attributes: ['id', 'email', 'role', 'isActive', 'lastLogin', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        profile: user.profile,
        character: user.character
      }
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ 
      message: "An error occurred while fetching user data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

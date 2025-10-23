import db from "../../models/index.js";

/**
 * Get single user by ID (admin only)
 * GET /admin/users/:id
 */
export default async function getUser(req, res) {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id, {
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
              as: 'rank'
            }
          ]
        }
      ]
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
        googleId: user.googleId,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasRefreshToken: !!user.refreshToken,
        profile: user.profile,
        character: user.character
      }
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ 
      message: "An error occurred while fetching user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

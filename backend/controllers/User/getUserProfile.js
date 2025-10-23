import db from "../../models/index.js";

/**
 * Get public user profile by ID
 * GET /users/:id/profile
 */
export default async function getUserProfile(req, res) {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id, {
      include: [
        {
          model: db.UserProfile,
          as: 'profile',
          attributes: ['displayName', 'avatarUrl', 'bio', 'isPublicProfile']
        },
        {
          model: db.Character,
          as: 'character',
          attributes: ['level', 'totalXp', 'streakDays', 'longestStreak'],
          include: [
            {
              model: db.Rank,
              as: 'rank',
              attributes: ['name', 'color']
            }
          ]
        }
      ],
      attributes: ['id', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if profile is public
    if (!user.profile?.isPublicProfile) {
      return res.status(403).json({ 
        message: "This profile is private" 
      });
    }

    return res.status(200).json({
      profile: {
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl,
        bio: user.profile.bio,
        memberSince: user.createdAt,
        level: user.character?.level || 1,
        totalXp: user.character?.totalXp || 0,
        streakDays: user.character?.streakDays || 0,
        longestStreak: user.character?.longestStreak || 0,
        rank: {
          name: user.character?.rank?.name || 'E-Rank',
          color: user.character?.rank?.color || '#808080'
        }
      }
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ 
      message: "An error occurred while fetching profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

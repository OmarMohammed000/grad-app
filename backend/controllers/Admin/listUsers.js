import db from "../../models/index.js";
import { Op } from 'sequelize';

/**
 * Get all users (admin only)
 * GET /admin/users
 * Query params: page, limit, q (search), role, isActive, sortBy, sortOrder
 */
export default async function listUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Search by email or display name
    if (q) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${q}%` } },
        { '$profile.displayName$': { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows } = await db.User.findAndCountAll({
      where,
      include: [
        {
          model: db.UserProfile,
          as: 'profile',
          attributes: ['displayName', 'avatarUrl']
        },
        {
          model: db.Character,
          as: 'character',
          attributes: ['level', 'totalXp'],
          include: [
            {
              model: db.Rank,
              as: 'rank',
              attributes: ['name', 'color']
            }
          ]
        }
      ],
      attributes: ['id', 'email', 'role', 'isActive', 'lastLogin', 'createdAt'],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true
    });

    return res.status(200).json({
      users: rows.map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
        avatarUrl: user.profile?.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        level: user.character?.level,
        totalXp: user.character?.totalXp,
        rank: user.character?.rank
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Error listing users:", error);
    return res.status(500).json({ 
      message: "An error occurred while fetching users",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

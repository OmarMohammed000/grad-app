import db from '../../models/index.js';
import { Op } from 'sequelize';
import { finalizeChallengeIfNeeded } from '../../services/challengeStatusService.js';

/**
 * Get all challenges (public + user's challenges)
 * GET /challenges
 */
export default async function getChallenges(req, res) {
  try {
    const {
      status,
      challengeType,
      difficultyLevel,
      isPublic,
      tags,
      search,
      myChallenges = false,
      page = 1,
      limit = 20,
      sortBy = 'startDate',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    // Status filter
    if (status) {
      // Handle comma-separated status values (e.g., "upcoming,active")
      if (typeof status === 'string' && status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim()).filter(s => s);
        console.log('📊 Parsing comma-separated status:', status, '→', statusArray);
        where.status = { [Op.in]: statusArray };
      } else {
        // Single status value
        console.log('📊 Using single status:', status);
        where.status = status;
      }
    } else {
      // Default: show upcoming and active challenges
      console.log('📊 No status provided, using default: upcoming, active');
      where.status = { [Op.in]: ['upcoming', 'active'] };
    }

    // Challenge type filter
    if (challengeType) {
      where.challengeType = challengeType;
    }

    // Difficulty filter
    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    // Public filter
    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    } else {
      // Default: show public challenges OR challenges user created/joined
      if (myChallenges !== 'true') {
        where.isPublic = true;
      }
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      where.tags = { [Op.overlap]: tagArray };
    }

    // Search by title or description
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // My challenges filter
    if (myChallenges === 'true') {
      // Find challenges user created or joined
      const myParticipations = await db.ChallengeParticipant.findAll({
        where: { userId: req.user.userId },
        attributes: ['challengeId']
      });

      const challengeIds = myParticipations.map(p => p.challengeId);
      
      if (challengeIds.length > 0) {
        where.id = { [Op.in]: challengeIds };
      } else {
        // No challenges found
        return res.json({
          challenges: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        });
      }
    }

    // Valid sort fields
    const validSortFields = ['startDate', 'endDate', 'createdAt', 'currentParticipants', 'difficultyLevel'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'startDate';

    const { count, rows } = await db.GroupChallenge.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id'],
          include: [
            {
              model: db.UserProfile,
              as: 'profile',
              attributes: ['displayName', 'avatarUrl']
            }
          ]
        },
        {
          model: db.ChallengeParticipant,
          as: 'participants',
          attributes: ['userId', 'status'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
      distinct: true
    });

    await Promise.all(
      rows.map(challenge => finalizeChallengeIfNeeded(challenge))
    );

    // Check if user has joined each challenge
    const challengesWithJoinStatus = rows.map(challenge => {
      const hasJoined = challenge.participants?.some(p => p.userId === req.user.userId);
      const challengeData = challenge.toJSON();
      
      return {
        ...challengeData,
        hasJoined,
        canJoin: !hasJoined && 
                 challenge.status === 'active' && 
                 (!challenge.maxParticipants || challenge.currentParticipants < challenge.maxParticipants)
      };
    });

    return res.json({
      challenges: challengesWithJoinStatus,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching challenges:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching challenges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

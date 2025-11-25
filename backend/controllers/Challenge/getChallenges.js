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
      isGlobal,
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

    // Global filter
    if (isGlobal !== undefined) {
      where.isGlobal = isGlobal === 'true';
    }

    // Public filter
    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    } else {
      // Default: show public challenges OR challenges user created/joined
      // If asking for global challenges, we usually want public ones unless specified
      if (myChallenges !== 'true') {
        where.isPublic = true;
        
        // If not explicitly asking for global, default to non-global for "Group" tab behavior
        // But if isGlobal is not passed, we might want to show both? 
        // Actually, usually the frontend will request either global=true or global=false (for groups)
        if (isGlobal === undefined) {
           // If nothing specified, maybe show all? Or default to groups?
           // Let's keep it simple: if isGlobal is not specified, we don't filter by it, 
           // but we respect isPublic=true.
           // However, for "Group Challenges" tab, we probably want isGlobal=false.
           // The frontend should send isGlobal=false for Group tab.
        }
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

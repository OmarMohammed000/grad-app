import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../../models/index.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Google OAuth authentication
 * Verifies Google token and creates/logs in user
 */
export default async function googleAuth(req, res) {
  const { credential, idToken } = req.body;
  
  // Support both web (credential) and mobile (idToken) flows
  const token = credential || idToken;

  if (!token) {
    return res.status(400).json({ message: 'Google token is required' });
  }

  const transaction = await db.sequelize.transaction();

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name || payload.given_name || 'Hunter';

    // Check if user exists by Google ID or email
    let user = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { googleId },
          { email }
        ]
      },
      include: [
        {
          model: db.UserProfile,
          as: 'profile',
          attributes: ['displayName']
        },
        {
          model: db.Character,
          as: 'character',
          attributes: ['level', 'currentXp', 'totalXp'],
          include: [
            {
              model: db.Rank,
              as: 'rank',
              attributes: ['name', 'color']
            }
          ]
        }
      ],
      transaction
    });

    if (user) {
      // User exists - update Google ID if not set
      if (!user.googleId) {
        await user.update({ googleId }, { transaction });
      }

      // Check if account is active
      if (!user.isActive) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
      }

    } else {
      // New user - create account with profile and character
      user = await db.User.create({
        email,
        googleId,
        isActive: true,
        password: null // No password for OAuth users
      }, { transaction });

      // Create user profile
      await db.UserProfile.create({
        userId: user.id,
        displayName,
        timezone: 'UTC',
        language: 'en',
        theme: 'auto',
        notificationsEnabled: true,
        emailNotifications: true,
        soundEnabled: true,
        isPublicProfile: true
      }, { transaction });

      // Create character (starts at E-Rank, Level 1)
      const character = await db.Character.create({
        userId: user.id,
        rankId: 1,
        level: 1,
        currentXp: 0,
        totalXp: 0,
        xpToNextLevel: 100,
        streakDays: 0,
        longestStreak: 0,
        totalTasksCompleted: 0,
        totalHabitsCompleted: 0,
        totalChallengesJoined: 0,
        totalChallengesCompleted: 0
      }, { transaction });

      // Log activity
      await db.ActivityLog.create({
        userId: user.id,
        activityType: 'user_registered',
        description: 'Welcome to the Hunter System via Google!',
        xpGained: 0,
        isPublic: true,
        importance: 'milestone'
      }, { transaction });

      // Load rank for response
      const rank = await db.Rank.findByPk(1, { transaction });
      
      // Attach data for response
      user.profile = { displayName };
      user.character = {
        level: 1,
        currentXp: 0,
        totalXp: 0,
        rank: {
          name: rank?.name || 'E-Rank',
          color: rank?.color || '#808080'
        }
      };
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Hash and store refresh token
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await user.update({
      refreshToken: refreshHash,
      lastLogin: new Date()
    }, { transaction });

    await transaction.commit();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh'
    });

    // Return user data with access token
    // Also return refresh token in body for React Native compatibility
    return res.status(200).json({
      accessToken,
      refreshToken, // Include in body for mobile apps
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName || displayName,
        level: user.character?.level || 1,
        currentXp: user.character?.currentXp || 0,
        totalXp: user.character?.totalXp || 0,
        rank: {
          name: user.character?.rank?.name || 'E-Rank',
          color: user.character?.rank?.color || '#808080'
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Google OAuth error:', error);
    return res.status(500).json({ 
      message: 'Failed to authenticate with Google',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

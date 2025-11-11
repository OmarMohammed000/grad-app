import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import crypto from 'crypto';

/**
 * Middleware to verify JWT access token
 * Automatically refreshes token if expired and refresh token is available
 * Adds userId to req.user
 */
export default async function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user info to request
      req.user = {
        userId: decoded.userId
      };

      next();
    } catch (verifyError) {
      // If token expired, try to auto-refresh
      if (verifyError.name === 'TokenExpiredError') {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
          return res.status(401).json({ message: "Token expired" });
        }

        try {
          // Verify refresh token
          const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
          const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

          // Verify refresh token exists in database
          const user = await db.User.findOne({
            where: { 
              id: decodedRefresh.userId,
              refreshToken: hashedToken,
              isActive: true
            },
            attributes: ['id', 'role']
          });

          if (!user) {
            res.clearCookie('refreshToken', {
              path: '/auth/refresh'
            });
            return res.status(401).json({ message: "Token expired" });
          }

          // Generate new access token
          const newAccessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
          );

          // Set new access token in response header for client to pick up
          res.setHeader('X-New-Access-Token', newAccessToken);

          // Add user info to request
          req.user = {
            userId: user.id
          };

          // Continue with the request
          next();
        } catch (refreshError) {
          // Refresh token invalid or expired
          res.clearCookie('refreshToken', {
            path: '/auth/refresh'
          });
          return res.status(401).json({ message: "Token expired" });
        }
      } else if (verifyError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      } else {
        throw verifyError;
      }
    }

  } catch (error) {
    return res.status(500).json({ message: "Authentication error" });
  }
}

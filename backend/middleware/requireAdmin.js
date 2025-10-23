import jwt from 'jsonwebtoken';
import db from '../models/index.js';

/**
 * Middleware to verify user has admin role
 * Requires authMiddleware to run first (sets req.user.userId)
 */
export default async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Fetch user role from database
    const user = await db.User.findByPk(req.user.userId, {
      attributes: ['id', 'role', 'isActive']
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }

    // Add role to request for downstream use
    req.user.role = user.role;
    next();

  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ message: "Authorization error" });
  }
}

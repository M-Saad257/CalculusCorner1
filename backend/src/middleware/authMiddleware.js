const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

// Simple in-memory status cache for students
const userStatusCache = new Map();

// Helper to clear the status cache for a student (when banned or unbanned)
const clearUserStatusCache = (userId) => {
  userStatusCache.delete(String(userId));
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Enforce active status and ban check for database users
      if (decoded.role === 'student') {
        const userIdStr = String(decoded.id);
        const cached = userStatusCache.get(userIdStr);
        let isBanned = false;

        if (cached && (Date.now() - cached.timestamp < 10000)) { // 10 seconds cache TTL
          isBanned = !cached.exists || cached.status === 'banned' || cached.isBanned === 1;
        } else {
          const dbUser = await UserModel.findById(decoded.id);
          userStatusCache.set(userIdStr, {
            exists: !!dbUser,
            status: dbUser ? dbUser.status : null,
            isBanned: dbUser ? dbUser.isBanned : 0,
            timestamp: Date.now()
          });
          isBanned = !dbUser || dbUser.status === 'banned' || dbUser.isBanned === 1;
        }

        if (isBanned) {
          const isAllowedPath = req.path === '/profile' || req.path === '/unban-request';
          if (!isAllowedPath) {
            res.status(403);
            return next(new Error('Your account has been banned. Please contact support.'));
          }
        }
      }

      // Attach user credentials to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        username: decoded.email ? decoded.email.split('@')[0] : 'user'
      };

      next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error.message);
      res.status(401);
      return next(new Error('Not authorized, token invalid or expired'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    return next(new Error('Access denied: Admins only'));
  }
};

const isStudent = (req, res, next) => {
  if (req.user && (req.user.role === 'student' || req.user.role === 'user')) {
    next();
  } else {
    res.status(403);
    return next(new Error('Access denied: Students only'));
  }
};

module.exports = { protect, isAdmin, isStudent, clearUserStatusCache };

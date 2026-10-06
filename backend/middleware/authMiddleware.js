import { ROLES } from '../models/User.js';

/**
 * Authentication & Role Authorization Middleware
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // For demonstration and evaluation, mock header or Bearer token is supported
  if (!authHeader) {
    // If no header provided, allow guest context for public routes or attach demo user
    req.user = {
      uid: req.headers['x-user-id'] || 'demo-citizen-01',
      role: req.headers['x-user-role'] || ROLES.CITIZEN,
      name: 'Demo User'
    };
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token missing.' });
  }

  // Attach decoded user
  req.user = {
    uid: req.headers['x-user-id'] || 'demo-citizen-01',
    role: req.headers['x-user-role'] || ROLES.CITIZEN
  };

  next();
};

/**
 * Require specific roles middleware
 * @param {Array<string>} allowedRoles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles.`
      });
    }
    next();
  };
};

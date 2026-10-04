import { db } from '../db.js';
import { verifyToken } from '../utils/token.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authorization header required.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ success: false, message: 'Bearer token missing.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }

  const user = db.getUsers().find((u) => u.id === decoded.id);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User belonging to token no longer exists.' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    req.user = null;
    return next();
  }

  const decoded = verifyToken(token);
  if (decoded && decoded.id) {
    req.user = db.getUsers().find((u) => u.id === decoded.id) || null;
  } else {
    req.user = null;
  }

  next();
}

import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jansewa_civic_jwt_secret_key_2026_super_secure';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authorization header required.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Support demo / mock user header for frictionless local exploration
  if (token.startsWith('demo-user-')) {
    const userId = token.replace('demo-user-', '');
    const user = db.getUsers().find((u) => u.id === userId || u.role === userId);
    if (user) {
      req.user = user;
      return next();
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUsers().find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to token no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = db.getUsers().find((u) => u.id === decoded.id) || null;
  } catch {
    req.user = null;
  }
  next();
}

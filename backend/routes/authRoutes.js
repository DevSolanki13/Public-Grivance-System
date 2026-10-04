import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
  },
});

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authLimiter, AuthController.register);

// Role switching convenience is restricted from production environments
const devOnlyRoleSwitch = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Role switching and demo-login endpoints are disabled in production.',
    });
  }
  next();
};

router.post('/switch-role', devOnlyRoleSwitch, AuthController.switchRole);
router.post('/demo-login', devOnlyRoleSwitch, AuthController.switchRole);
router.get('/me', authenticate, AuthController.getMe);
router.get('/profile', authenticate, AuthController.getMe);

export default router;

import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/switch-role', AuthController.switchRole);
router.post('/demo-login', AuthController.switchRole);
router.get('/me', authenticate, AuthController.getMe);
router.get('/profile', authenticate, AuthController.getMe);

export default router;

import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { optionalAuth, authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Stats can adapt if user is logged in (optional auth) or provide city-wide transparency stats
router.get('/dashboard', optionalAuth, AnalyticsController.getDashboardStats);
router.get('/stats', optionalAuth, AnalyticsController.getDashboardStats);
router.get('/map', optionalAuth, AnalyticsController.getMapMarkers);
router.get('/audit-logs', authenticate, AnalyticsController.getAuditLogs);

export default router;

import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { optionalAuth, authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Stats and Map adapt to authenticated user context if provided (or provide transparency view)
router.get('/dashboard', optionalAuth, AnalyticsController.getDashboardStats);
router.get('/stats', optionalAuth, AnalyticsController.getDashboardStats);
// The map lists every complaint with its address, so it is staff-only (the page is admin-only in the UI).
router.get('/map', authenticate, requireRole('admin', 'department_head'), AnalyticsController.getMapMarkers);

// Audit logs are strictly restricted to administrators and department heads
router.get(
  '/audit-logs',
  authenticate,
  requireRole('admin', 'department_head'),
  AnalyticsController.getAuditLogs
);

export default router;

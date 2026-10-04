import { AnalyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  static getDashboardStats(req, res, next) {
    try {
      const stats = AnalyticsService.getDashboardStats(req.user);
      res.json({
        success: true,
        stats,
      });
    } catch (err) {
      next(err);
    }
  }

  static getMapMarkers(req, res, next) {
    try {
      const markers = AnalyticsService.getMapMarkers(req.user);
      res.json({
        success: true,
        count: markers.length,
        markers,
      });
    } catch (err) {
      next(err);
    }
  }

  static getAuditLogs(req, res, next) {
    try {
      const logs = AnalyticsService.getAuditLogs(req.user);
      res.json({
        success: true,
        count: logs.length,
        logs,
      });
    } catch (err) {
      next(err);
    }
  }
}

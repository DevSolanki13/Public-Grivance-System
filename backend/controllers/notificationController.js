import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  static getNotifications(req, res, next) {
    try {
      const notifications = NotificationService.getUserNotifications(req.user.id);
      res.json({
        success: true,
        count: notifications.length,
        notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  static markRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = NotificationService.markRead(id, req.user);
      res.json({
        success: true,
        notification: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static markAllRead(req, res, next) {
    try {
      NotificationService.markAllRead(req.user.id);
      res.json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (err) {
      next(err);
    }
  }
}

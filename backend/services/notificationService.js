import { db } from '../db.js';
import { generateNotificationId } from '../utils/helpers.js';
import { HttpError } from '../middleware/errorHandler.js';

export class NotificationService {
  static createNotification({ userId, title, message, type = 'info', grievanceId = null }) {
    if (!userId || !title) return null;

    const notif = {
      id: generateNotificationId(),
      userId,
      title,
      message,
      link: grievanceId ? `/citizen/grievance/${grievanceId}` : null,
      type,
      grievanceId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    db.addNotification(notif);
    return notif;
  }

  static getUserNotifications(userId) {
    const list = db.getNotifications().filter((n) => n.userId === userId);
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }

  static markRead(notifId, user) {
    const notif = db.getNotifications().find((n) => n.id === notifId);
    if (!notif) {
      throw new HttpError(404, 'Notification not found.');
    }

    if (user.role !== 'admin' && notif.userId !== user.id) {
      throw new HttpError(403, 'Forbidden: You cannot modify notifications belonging to another user.');
    }

    return db.markNotificationRead(notifId);
  }

  static markAllRead(userId) {
    const notifs = db.getNotifications().filter((n) => n.userId === userId && !n.isRead);
    notifs.forEach((n) => {
      n.isRead = true;
    });
    db.save();
    return true;
  }
}

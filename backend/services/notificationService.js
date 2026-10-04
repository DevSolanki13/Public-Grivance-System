import { db } from '../db.js';
import { generateNotificationId } from '../utils/helpers.js';

export class NotificationService {
  static createNotification({ userId, title, message, type = 'info', grievanceId = null }) {
    if (!userId || !title) return null;

    const notif = {
      id: generateNotificationId(),
      userId,
      title,
      message,
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

  static markRead(notifId) {
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

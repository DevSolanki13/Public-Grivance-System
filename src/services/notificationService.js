// Persistent Notification Service for JanSewa
const NOTIFICATIONS_STORAGE_KEY = 'jansewa_notifications_v1';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    role: 'citizen',
    userId: 'demo-citizen-id',
    title: 'Resolution Submitted for Verification',
    message: 'Field Officer Rahul Sharma uploaded proof of resolution for GRV-2026-0003 (Pothole repaired). Please verify the work.',
    grievanceId: 'GRV-2026-0003',
    link: '/citizen/grievance/GRV-2026-0003',
    type: 'action_required',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif-2',
    role: 'officer',
    userId: 'demo-officer-id',
    title: 'New Case Assigned to You',
    message: 'You have been assigned GRV-2026-0001 (Overflowing garbage bin) in Global City, Virar. SLA Target: 24h.',
    grievanceId: 'GRV-2026-0001',
    link: '/officer/grievance/GRV-2026-0001',
    type: 'assignment',
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'notif-3',
    role: 'department_head',
    userId: 'demo-depthead-id',
    title: 'Case Escalation Alert',
    message: 'GRV-2026-0002 has passed 80% SLA duration without field update. Escalated to Department Head.',
    grievanceId: 'GRV-2026-0002',
    link: '/admin/grievance/GRV-2026-0002',
    type: 'escalation',
    read: false,
    createdAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'notif-4',
    role: 'admin',
    userId: 'demo-admin-id',
    title: 'System Grievance Reopened',
    message: 'Citizen reopened GRV-2026-0004 with reason: "Debris remains scattered on pavement". Follow-up needed.',
    grievanceId: 'GRV-2026-0004',
    link: '/admin/grievance/GRV-2026-0004',
    type: 'reopened',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const notificationService = {
  getAll: () => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  getForRole: (role) => {
    const all = notificationService.getAll();
    if (!role || role === 'public') return [];
    if (role === 'admin') return all;
    return all.filter((n) => n.role === role || n.role === 'all');
  },

  getUnreadCount: (role) => {
    const list = notificationService.getForRole(role);
    return list.filter((n) => !n.read).length;
  },

  addNotification: ({ role, title, message, grievanceId, link, type = 'info' }) => {
    const all = notificationService.getAll();
    const newNotif = {
      id: `notif-${Date.now()}`,
      role: role || 'all',
      title,
      message,
      grievanceId: grievanceId || null,
      link: link || (grievanceId ? `/citizen/grievance/${grievanceId}` : '/'),
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newNotif, ...all];
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('jansewa_notification_update'));
    return newNotif;
  },

  markAsRead: (id) => {
    const all = notificationService.getAll();
    const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('jansewa_notification_update'));
  },

  markAllAsRead: (role) => {
    const all = notificationService.getAll();
    const updated = all.map((n) => {
      if (role === 'admin' || n.role === role || n.role === 'all') {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('jansewa_notification_update'));
  }
};

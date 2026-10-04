import { client } from './client.js';

export const notificationApi = {
  getNotifications: async () => {
    return client.get('/notifications');
  },

  markRead: async (id) => {
    return client.patch(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    return client.post('/notifications/mark-all-read');
  },
};

export default notificationApi;

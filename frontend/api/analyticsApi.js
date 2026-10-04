import { client } from './client.js';

export const analyticsApi = {
  getDashboardStats: async () => {
    return client.get('/analytics/dashboard');
  },

  getMapMarkers: async () => {
    return client.get('/analytics/map');
  },

  getAuditLogs: async () => {
    return client.get('/analytics/audit-logs');
  },
};

export default analyticsApi;

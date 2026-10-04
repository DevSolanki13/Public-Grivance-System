import client from './client.js';
import authApi from './authApi.js';
import grievanceApi from './grievanceApi.js';
import departmentApi from './departmentApi.js';
import analyticsApi from './analyticsApi.js';
import notificationApi from './notificationApi.js';

export { client, authApi, grievanceApi, departmentApi, analyticsApi, notificationApi };

export const api = {
  // Auth
  login: (credentials) =>
    authApi.login(credentials.email, credentials.password, credentials.role),
  register: (userData) => authApi.register(userData),
  demoLogin: (role) => authApi.switchRole(role),
  getProfile: () => authApi.getMe(),
  logout: () => authApi.logout(),

  // Grievances
  getGrievances: (params) => grievanceApi.getGrievances(params),
  getGrievanceById: (id) => grievanceApi.getGrievanceById(id),
  createGrievance: (formData) => grievanceApi.createGrievance(formData),
  assignOfficer: (id, payload) =>
    grievanceApi.assignOfficer(
      id,
      typeof payload === 'object' ? payload.officerId : payload,
      typeof payload === 'object' ? payload.remark : undefined
    ),
  startWork: (id, payload = {}) => client.post(`/grievances/${id}/start-work`, payload),
  submitResolution: (id, formData) => grievanceApi.resolveGrievance(id, formData),
  verifyResolution: (id, payload) => grievanceApi.verifyGrievance(id, payload),
  reopenGrievance: (id, payload) =>
    grievanceApi.verifyGrievance(id, {
      satisfied: false,
      reopenReason: typeof payload === 'object' ? payload.reason : payload,
    }),
  trackPublic: (id) => grievanceApi.trackPublic(id),

  // Departments & Officers
  getDepartments: () => departmentApi.getDepartments(),
  getCategories: () => departmentApi.getCategories(),
  getOfficers: (params) =>
    departmentApi.getOfficers(
      typeof params === 'object' && params !== null ? params.departmentId : params
    ),

  // Analytics & Map
  getStats: () => analyticsApi.getDashboardStats(),
  getMapMarkers: () => analyticsApi.getMapMarkers(),
  getAuditLogs: () => analyticsApi.getAuditLogs(),

  // Notifications
  getNotifications: () => notificationApi.getNotifications(),
  markNotificationRead: (id) => notificationApi.markRead(id),

  // System
  resetData: () => client.post('/reset-data'),

  // Sub-gateways
  auth: authApi,
  grievance: grievanceApi,
  department: departmentApi,
  analytics: analyticsApi,
  notification: notificationApi,
};

export default api;

import { client } from './client.js';

export const grievanceApi = {
  getGrievances: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const query = searchParams.toString();
    return client.get(`/grievances${query ? `?${query}` : ''}`);
  },

  getGrievanceById: async (id) => {
    return client.get(`/grievances/${id}`);
  },

  trackPublic: async (complaintId) => {
    return client.get(`/grievances/track/${encodeURIComponent(complaintId)}`);
  },

  createGrievance: async (formData) => {
    return client.upload('/grievances', formData);
  },

  updateStatus: async (id, status, remark) => {
    return client.patch(`/grievances/${id}/status`, { status, remark });
  },

  assignOfficer: async (id, officerId, remark) => {
    return client.post(`/grievances/${id}/assign`, { officerId, remark });
  },

  resolveGrievance: async (id, formData) => {
    return client.upload(`/grievances/${id}/resolve`, formData);
  },

  verifyGrievance: async (id, data) => {
    return client.post(`/grievances/${id}/verify`, data);
  },
};

export default grievanceApi;

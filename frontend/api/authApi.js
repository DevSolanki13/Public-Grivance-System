import { client } from './client.js';

export const authApi = {
  login: async (email, password, role) => {
    return client.post('/auth/login', { email, password, role });
  },

  register: async (userData) => {
    return client.post('/auth/register', userData);
  },

  switchRole: async (role) => {
    return client.post('/auth/switch-role', { role });
  },

  getMe: async () => {
    return client.get('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('jansewa_token');
    localStorage.removeItem('jansewa_user');
  },
};

export default authApi;

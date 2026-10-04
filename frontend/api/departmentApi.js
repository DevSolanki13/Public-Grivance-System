import { client } from './client.js';

export const departmentApi = {
  getDepartments: async () => {
    return client.get('/departments');
  },

  getCategories: async () => {
    return client.get('/departments/categories');
  },

  getOfficers: async (departmentId = 'All') => {
    const query = departmentId && departmentId !== 'All' ? `?departmentId=${departmentId}` : '';
    return client.get(`/departments/officers${query}`);
  },
};

export default departmentApi;

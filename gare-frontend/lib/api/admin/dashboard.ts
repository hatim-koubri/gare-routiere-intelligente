import { apiClient } from '../client';

export const adminDashboardApi = {
  getStationnementQuais: async () => {
    const response = await apiClient.get('/admin/dashboard/stationnement-quais');
    return response.data;
  },
};

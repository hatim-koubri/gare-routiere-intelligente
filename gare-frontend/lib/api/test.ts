import { apiClient } from './client';

export const testApi = {
  testConnection: async () => {
    try {
      const response = await apiClient.get('/auth/test');
      console.log('Backend connecté:', response.data);
      return true;
    } catch (error: any) {
      console.error('Backend non accessible:', error.message);
      return false;
    }
  }
};
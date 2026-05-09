import { apiClient } from '../client';
import { CompagnieStats } from '@/types';

export const responsableStatsApi = {
  getStats: async (periode?: string): Promise<CompagnieStats | null> => {
    try {
      const params = periode ? { periode } : {};
      const response = await apiClient.get('/responsable/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getStats:', error);
      return null;
    }
  },
};

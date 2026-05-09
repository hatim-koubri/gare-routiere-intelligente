import { apiClient } from '../client';
import { Quai } from '@/types';

export const responsableQuaiApi = {
  getAll: async (): Promise<Quai[]> => {
    try {
      const response = await apiClient.get('/responsable/quais');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Quais:', error);
      return [];
    }
  },
};

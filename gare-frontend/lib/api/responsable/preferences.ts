import { apiClient } from '../client';
import { PreferenceNonSatisfaite } from '@/types';

export const responsablePreferenceApi = {
  getNonSatisfaites: async (trajetId?: number): Promise<PreferenceNonSatisfaite[]> => {
    try {
      const params = trajetId ? { trajetId } : {};
      const response = await apiClient.get('/responsable/preferences/non-satisfaites', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getNonSatisfaites:', error);
      return [];
    }
  },
};

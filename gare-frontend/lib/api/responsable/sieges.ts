import { apiClient } from '../client';
import { SiegeBlocage, BlocageSiegeRequest } from '@/types';

export const responsableSiegeApi = {
  getByTrajet: async (trajetId: number): Promise<SiegeBlocage[]> => {
    try {
      const response = await apiClient.get(`/responsable/sieges/${trajetId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getByTrajet Sieges:', error);
      return [];
    }
  },

  bloquer: async (data: BlocageSiegeRequest): Promise<SiegeBlocage> => {
    const response = await apiClient.post('/responsable/sieges/bloquer', data);
    return response.data;
  },

  debloquer: async (id: number): Promise<SiegeBlocage> => {
    const response = await apiClient.patch(`/responsable/sieges/${id}/debloquer`);
    return response.data;
  },
};

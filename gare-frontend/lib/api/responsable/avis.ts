import { apiClient } from '../client';
import { AvisResponseDTO } from '@/types';

export const responsableAvisApi = {
  getAll: async (trajetId?: number): Promise<AvisResponseDTO[]> => {
    try {
      const params = trajetId ? { trajetId } : {};
      const response = await apiClient.get('/responsable/avis', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur chargement avis:', error);
      return [];
    }
  },
};

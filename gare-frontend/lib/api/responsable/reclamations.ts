import { apiClient } from '../client';
import { Reclamation, ReponseReclamationRequest } from '@/types';

export const responsableReclamationApi = {
  getAll: async (): Promise<Reclamation[]> => {
    try {
      const response = await apiClient.get('/responsable/reclamations');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Reclamations:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<Reclamation> => {
    const response = await apiClient.get(`/responsable/reclamations/${id}`);
    return response.data;
  },

  repondre: async (id: number, data: ReponseReclamationRequest): Promise<Reclamation> => {
    const response = await apiClient.patch(`/responsable/reclamations/${id}/reponse`, data);
    return response.data;
  },

  resoudre: async (id: number): Promise<Reclamation> => {
    const response = await apiClient.patch(`/responsable/reclamations/${id}/resoudre`);
    return response.data;
  },
};

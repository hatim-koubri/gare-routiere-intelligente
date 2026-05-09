import { apiClient } from '../client';
import { Chauffeur, ChauffeurRequest, ChauffeurUpdateRequest } from '@/types';

export const responsableChauffeurApi = {
  getAll: async (): Promise<Chauffeur[]> => {
    try {
      const response = await apiClient.get('/responsable/chauffeurs');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Chauffeurs:', error);
      return [];
    }
  },

  create: async (data: ChauffeurRequest): Promise<Chauffeur> => {
    const response = await apiClient.post('/responsable/chauffeurs', data);
    return response.data;
  },

  update: async (id: number, data: ChauffeurUpdateRequest): Promise<Chauffeur> => {
    const response = await apiClient.put(`/responsable/chauffeurs/${id}`, data);
    return response.data;
  },

  toggleConge: async (id: number): Promise<Chauffeur> => {
    const response = await apiClient.patch(`/responsable/chauffeurs/${id}/conge`);
    return response.data;
  },

  activer: async (id: number): Promise<Chauffeur> => {
    const response = await apiClient.patch(`/responsable/chauffeurs/${id}/activer`);
    return response.data;
  },

  desactiver: async (id: number): Promise<Chauffeur> => {
    const response = await apiClient.patch(`/responsable/chauffeurs/${id}/desactiver`);
    return response.data;
  },
};

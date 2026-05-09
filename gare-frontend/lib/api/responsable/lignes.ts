import { apiClient } from '../client';
import { Ligne, LigneRequest } from '@/types';

export const responsableLigneApi = {
  getAll: async (): Promise<Ligne[]> => {
    try {
      const response = await apiClient.get('/responsable/lignes');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Lignes:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<Ligne> => {
    const response = await apiClient.get(`/responsable/lignes/${id}`);
    return response.data;
  },

  create: async (data: LigneRequest): Promise<Ligne> => {
    const response = await apiClient.post('/responsable/lignes', data);
    return response.data;
  },

  update: async (id: number, data: LigneRequest): Promise<Ligne> => {
    const response = await apiClient.put(`/responsable/lignes/${id}`, data);
    return response.data;
  },

  desactiver: async (id: number): Promise<Ligne> => {
    const response = await apiClient.patch(`/responsable/lignes/${id}/desactiver`);
    return response.data;
  },
};

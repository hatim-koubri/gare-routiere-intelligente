import { apiClient } from '../client';
import { Trajet, TrajetRequest } from '@/types';

export const responsableTrajetApi = {
  getAll: async (): Promise<Trajet[]> => {
    try {
      const response = await apiClient.get('/responsable/trajets');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Trajets:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<Trajet> => {
    const response = await apiClient.get(`/responsable/trajets/${id}`);
    return response.data;
  },

  create: async (data: TrajetRequest): Promise<Trajet> => {
    const response = await apiClient.post('/responsable/trajets', data);
    return response.data;
  },

  annuler: async (id: number): Promise<Trajet> => {
    const response = await apiClient.patch(`/responsable/trajets/${id}/annuler`);
    return response.data;
  },
};

import { apiClient } from '../client';
import { Trajet, TrajetRequest } from '@/types';

export const adminTrajetApi = {
  getAll: async (): Promise<Trajet[]> => {
    const response = await apiClient.get('/admin/trajets');
    return response.data;
  },

  create: async (data: TrajetRequest): Promise<Trajet> => {
    const response = await apiClient.post('/admin/trajets', data);
    return response.data;
  },

  update: async (id: number, data: TrajetRequest): Promise<Trajet> => {
    const response = await apiClient.put(`/admin/trajets/${id}`, data);
    return response.data;
  },

  annuler: async (id: number): Promise<Trajet> => {
    const response = await apiClient.patch(`/admin/trajets/${id}/annuler`);
    return response.data;
  },
};
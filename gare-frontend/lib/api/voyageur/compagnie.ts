import { apiClient } from '../client';
import { Compagnie } from '@/types';

export const compagnieApi = {
  getAll: async (): Promise<Compagnie[]> => {
    const response = await apiClient.get('/voyageur/compagnies');
    return response.data;
  },

  getById: async (id: number): Promise<Compagnie> => {
    const response = await apiClient.get(`/voyageur/compagnies/${id}`);
    return response.data;
  },
};
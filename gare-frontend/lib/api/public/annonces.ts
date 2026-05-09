import { apiClient } from '../client';
import { Annonce } from '@/types';

export interface CompagnieSimple {
  id: number;
  nom: string;
  code: string;
}

export const publicAnnonceApi = {
  getAll: async (params?: {
    compagnieId?: number;
    dateMin?: string;
    dateMax?: string;
  }): Promise<Annonce[]> => {
    const response = await apiClient.get('/public/annonces', { params });
    return response.data;
  },

  getCompagnies: async (): Promise<CompagnieSimple[]> => {
    const response = await apiClient.get('/public/annonces/compagnies');
    return response.data;
  },
};

import { apiClient } from '../client';
import { Annonce, AnnonceRequest } from '@/types';

export const responsableAnnonceApi = {
  getAll: async (): Promise<Annonce[]> => {
    try {
      const response = await apiClient.get('/responsable/annonces');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Annonces:', error);
      return [];
    }
  },

  create: async (data: AnnonceRequest): Promise<Annonce> => {
    const response = await apiClient.post('/responsable/annonces', data);
    return response.data;
  },

  update: async (id: number, data: AnnonceRequest): Promise<Annonce> => {
    const response = await apiClient.put(`/responsable/annonces/${id}`, data);
    return response.data;
  },

  toggle: async (id: number): Promise<Annonce> => {
    const response = await apiClient.patch(`/responsable/annonces/${id}/toggle`);
    return response.data;
  },
};

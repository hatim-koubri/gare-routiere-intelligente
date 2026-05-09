import { apiClient } from '../client';
import { CodePromo, CodePromoRequest } from '@/types';

export const responsablePromoApi = {
  getAll: async (): Promise<CodePromo[]> => {
    try {
      const response = await apiClient.get('/responsable/codes-promo');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Promos:', error);
      return [];
    }
  },

  create: async (data: CodePromoRequest): Promise<CodePromo> => {
    const response = await apiClient.post('/responsable/codes-promo', data);
    return response.data;
  },

  activer: async (id: number): Promise<CodePromo> => {
    const response = await apiClient.patch(`/responsable/codes-promo/${id}/activer`);
    return response.data;
  },

  desactiver: async (id: number): Promise<CodePromo> => {
    const response = await apiClient.patch(`/responsable/codes-promo/${id}/desactiver`);
    return response.data;
  },
};

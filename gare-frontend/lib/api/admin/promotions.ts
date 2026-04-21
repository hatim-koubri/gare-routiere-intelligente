import { apiClient } from '../client';
import { CodePromo, CodePromoRequest, Annonce, TarificationConfig } from '@/types';

export const adminPromotionApi = {
  // Codes promo
  getPromos: async (): Promise<CodePromo[]> => {
    const response = await apiClient.get('/admin/promos');
    return response.data;
  },

  createPromo: async (data: CodePromoRequest): Promise<CodePromo> => {
    const response = await apiClient.post('/admin/promos', data);
    return response.data;
  },

  desactiverPromo: async (id: number): Promise<CodePromo> => {
    const response = await apiClient.patch(`/admin/promos/${id}/desactiver`);
    return response.data;
  },

  // Annonces
  getAnnonces: async (): Promise<Annonce[]> => {
    const response = await apiClient.get('/admin/annonces');
    return response.data;
  },

  createAnnonce: async (data: Partial<Annonce>): Promise<Annonce> => {
    const response = await apiClient.post('/admin/annonces', data);
    return response.data;
  },

  desactiverAnnonce: async (id: number): Promise<Annonce> => {
    const response = await apiClient.patch(`/admin/annonces/${id}/desactiver`);
    return response.data;
  },

  // Tarification
  configurerTarification: async (config: TarificationConfig): Promise<void> => {
    await apiClient.post('/admin/tarification/configurer', config);
  },
};
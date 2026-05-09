import { apiClient } from '../client';
import { Remboursement } from '@/types';

export const responsableRemboursementApi = {
  getAll: async (): Promise<Remboursement[]> => {
    try {
      const response = await apiClient.get('/responsable/remboursements');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Remboursements:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<Remboursement> => {
    const response = await apiClient.get(`/responsable/remboursements/${id}`);
    return response.data;
  },

  accepter: async (id: number): Promise<Remboursement> => {
    const response = await apiClient.patch(`/responsable/remboursements/${id}/accepter`);
    return response.data;
  },

  refuser: async (id: number): Promise<Remboursement> => {
    const response = await apiClient.patch(`/responsable/remboursements/${id}/refuser`);
    return response.data;
  },
};

import { apiClient } from '../client';
import { Ligne, LigneRequest } from '@/types';

export const adminLigneApi = {
  getAll: async (): Promise<Ligne[]> => {
    const response = await apiClient.get('/admin/lignes');
    return response.data;
  },

  getByCompagnie: async (compagnieId: number): Promise<Ligne[]> => {
    const response = await apiClient.get(`/admin/lignes/compagnie/${compagnieId}`);
    return response.data;
  },

  create: async (data: LigneRequest): Promise<Ligne> => {
    const response = await apiClient.post('/admin/lignes', data);
    return response.data;
  },

  update: async (id: number, data: LigneRequest): Promise<Ligne> => {
    const response = await apiClient.put(`/admin/lignes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/lignes/${id}`);
  },

  getArrets: async (ligneId: number): Promise<any[]> => {
    const response = await apiClient.get(`/admin/lignes/${ligneId}/arrets`);
    return response.data;
  },
};
import { apiClient } from '../client';
import { Chauffeur } from '@/types';

export const adminChauffeurApi = {
  getByCompagnie: async (compagnieId: number): Promise<Chauffeur[]> => {
    const response = await apiClient.get(`/admin/chauffeurs/compagnie/${compagnieId}`);
    return response.data;
  },

  getDisponibles: async (compagnieId: number): Promise<Chauffeur[]> => {
    const response = await apiClient.get(`/admin/chauffeurs/compagnie/${compagnieId}/disponibles`);
    return response.data;
  },

  mettreEnConge: async (id: number): Promise<Chauffeur> => {
    const response = await apiClient.patch(`/admin/chauffeurs/${id}/conge`);
    return response.data;
  },

  retirerConge: async (id: number): Promise<Chauffeur> => {
    const response = await apiClient.patch(`/admin/chauffeurs/${id}/retour-conge`);
    return response.data;
  },
};
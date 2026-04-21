import { apiClient } from '../client';
import { Trajet, ManifesteResponse } from '@/types';

export const chauffeurTrajetApi = {
  // Trajets du jour
  getTrajetsJour: async (): Promise<Trajet[]> => {
    const response = await apiClient.get('/chauffeur/trajets/jour');
    return response.data;
  },

  // Manifeste du voyage
  getManifeste: async (trajetId: number): Promise<ManifesteResponse> => {
    const response = await apiClient.get(`/chauffeur/trajets/${trajetId}/manifeste`);
    return response.data;
  },
};
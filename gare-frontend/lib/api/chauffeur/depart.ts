import { apiClient } from '../client';

export const chauffeurDepartApi = {
  // Déclencher le départ (libère quai + facture)
  declencherDepart: async (trajetId: number): Promise<any> => {
    const response = await apiClient.post(`/chauffeur/trajets/${trajetId}/depart`);
    return response.data;
  },
};
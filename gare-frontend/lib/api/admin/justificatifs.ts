import { apiClient } from '../client';

export interface VoyageurJustificatif {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  categorieTarifaire: string;
  justificatifUrl: string;
  valide: boolean;
}

export const adminJustificatifApi = {
  getAll: async (): Promise<VoyageurJustificatif[]> => {
    const response = await apiClient.get('/admin/justificatifs');
    return response.data;
  },

  getEnAttente: async (): Promise<VoyageurJustificatif[]> => {
    const response = await apiClient.get('/admin/justificatifs/en-attente');
    return response.data;
  },

  approuver: async (voyageurId: number): Promise<void> => {
    await apiClient.post(`/admin/justificatifs/${voyageurId}/approuver`);
  },

  rejeter: async (voyageurId: number): Promise<void> => {
    await apiClient.post(`/admin/justificatifs/${voyageurId}/rejeter`);
  },
};

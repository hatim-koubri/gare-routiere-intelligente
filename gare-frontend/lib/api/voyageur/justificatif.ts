import { apiClient } from '../client';

export interface JustificatifStatut {
  url: string;
  valide: boolean;
  uploaded: boolean;
}

export const justificatifApi = {
  upload: async (file: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/voyageur/justificatif/upload', formData);
    return response.data;
  },
  getStatut: async (): Promise<JustificatifStatut> => {
    const response = await apiClient.get('/voyageur/justificatif/statut');
    return response.data;
  },
};

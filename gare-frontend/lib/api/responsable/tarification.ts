import { apiClient } from '../client';
import { TarificationConfig, TarificationConfigRequest } from '@/types';

export const responsableTarificationApi = {
  get: async (): Promise<TarificationConfig | null> => {
    try {
      const response = await apiClient.get('/responsable/tarification');
      return response.data;
    } catch (error) {
      console.error('Erreur get tarification:', error);
      return null;
    }
  },

  save: async (data: TarificationConfigRequest): Promise<TarificationConfig> => {
    const response = await apiClient.post('/responsable/tarification', data);
    return response.data;
  },
};

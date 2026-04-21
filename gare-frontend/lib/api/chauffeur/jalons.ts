import { apiClient } from '../client';
import { JalonRequest } from '@/types';

export const chauffeurJalonApi = {
  // Valider un jalon d'arrêt
  validerJalon: async (data: JalonRequest): Promise<any> => {
    const response = await apiClient.post('/chauffeur/jalons/valider', data);
    return response.data;
  },
};
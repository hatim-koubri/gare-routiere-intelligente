import { apiClient } from '../client';
import { PaiementRequest, PaiementResponse } from '@/types';

export const paiementApi = {
  simuler: async (data: PaiementRequest): Promise<PaiementResponse> => {
    const response = await apiClient.post('/voyageur/paiements/simuler', data);
    return response.data;
  },
};
import { apiClient } from '../client';
import { ScanBagageResponse } from '@/types';

export const chauffeurBagageApi = {
  // Scanner un bagage (départ)
  scannerBagage: async (bagageId: number): Promise<ScanBagageResponse> => {
    const response = await apiClient.post(`/chauffeur/bagages/scanner/${bagageId}`);
    return response.data;
  },
  // Scanner un bagage à l'arrivée (confirmation identité)
  scannerBagageArrivee: async (bagageId: number): Promise<any> => {
    const response = await apiClient.post(`/chauffeur/bagages/scanner-arrivee/${bagageId}`);
    return response.data;
  },
};
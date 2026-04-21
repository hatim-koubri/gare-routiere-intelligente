import { apiClient } from '../client';
import { ScanBagageResponse } from '@/types';

export const chauffeurBagageApi = {
  // Scanner un bagage
  scannerBagage: async (bagageId: number): Promise<ScanBagageResponse> => {
    const response = await apiClient.post(`/chauffeur/bagages/scanner/${bagageId}`);
    return response.data;
  },
};
import { apiClient } from '../client';
import { IncidentRequest, IncidentResponse } from '@/types';

export const chauffeurIncidentApi = {
  // Signaler un incident
  signalerIncident: async (data: IncidentRequest): Promise<IncidentResponse> => {
    const response = await apiClient.post('/chauffeur/incidents', data);
    return response.data;
  },
};
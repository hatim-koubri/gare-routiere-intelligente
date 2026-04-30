import { apiClient } from '../client';
import { RechercheTrajetRequest, TrajetRechercheDTO } from '@/types';

export const rechercheApi = {
  rechercherDirects: async (data: RechercheTrajetRequest): Promise<TrajetRechercheDTO[]> => {
    const response = await apiClient.post('/voyageur/recherche/trajets-directs', data);
    return response.data;
  },

  rechercherCorrespondances: async (data: RechercheTrajetRequest): Promise<TrajetRechercheDTO[][]> => {
    const response = await apiClient.post('/voyageur/recherche/trajets-correspondances', data);
    return response.data;
  },
};
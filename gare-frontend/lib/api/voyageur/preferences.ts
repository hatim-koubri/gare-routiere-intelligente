import { apiClient } from '../client';

export interface PreferenceVoisinage {
  accepteSexeOppose: boolean;
  preferencePosition?: string;
  prefereCoteMembreId?: number;
}

export const preferencesApi = {
  setVoisinage: async (membreId: number, data: PreferenceVoisinage): Promise<void> => {
    await apiClient.post(`/voyageur/preferences/voisinage/${membreId}`, data);
  },
  getVoisinage: async (membreId: number): Promise<PreferenceVoisinage | null> => {
    const response = await apiClient.get(`/voyageur/preferences/voisinage/${membreId}`);
    return response.data;
  },
};

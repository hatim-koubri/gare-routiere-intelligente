import { apiClient } from '../client';

export interface PreferenceVoisinage {
  accepteSexeOppose: boolean;
  preferencePosition?: string;
  prefereCoteMembreId?: number;
}

export interface VoyageurPreferenceVoisinage {
  accepteSexeOppose: boolean;
  preferencePosition?: string;
}

export const preferencesApi = {
  setVoisinage: async (membreId: number, data: PreferenceVoisinage): Promise<void> => {
    await apiClient.post(`/voyageur/preferences/voisinage/${membreId}`, data);
  },
  getVoisinage: async (membreId: number): Promise<PreferenceVoisinage | null> => {
    const response = await apiClient.get(`/voyageur/preferences/voisinage/${membreId}`);
    return response.data;
  },

  // Voyageur-level preferences
  getProfil: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get('/voyageur/profil');
    return response.data;
  },

  updateSexe: async (sexe: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.put('/voyageur/profil/sexe', { sexe });
    return response.data;
  },

  getPreferenceVoisinage: async (): Promise<VoyageurPreferenceVoisinage> => {
    const response = await apiClient.get('/voyageur/profil/preference-voisinage');
    return response.data;
  },

  updatePreferenceVoisinage: async (data: VoyageurPreferenceVoisinage): Promise<Record<string, unknown>> => {
    const response = await apiClient.put('/voyageur/profil/preference-voisinage', data);
    return response.data;
  },
};

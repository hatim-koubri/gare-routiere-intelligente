import { apiClient } from './client';
import { HoraireOfflineResponse } from '@/types';

export const offlineApi = {
  getHoraires: async (jours: number = 7): Promise<HoraireOfflineResponse> => {
    const response = await apiClient.get<HoraireOfflineResponse>(`/offline/horaires/${jours}`);
    return response.data;
  },

  downloadHoraires: async (jours: number = 7): Promise<void> => {
    const response = await apiClient.get(`/offline/horaires/download?jours=${jours}`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `horaires_${jours}jours.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  saveHorairesOffline: async (jours: number = 7): Promise<void> => {
    const data = await offlineApi.getHoraires(jours);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`horaires_offline_${jours}`, JSON.stringify({
        data,
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString(),
      }));
    }
  },

  getHorairesOffline: (jours: number = 7): HoraireOfflineResponse | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(`horaires_offline_${jours}`);
    if (!stored) return null;
    
    const { data, expiresAt } = JSON.parse(stored);
    if (new Date(expiresAt) < new Date()) {
      localStorage.removeItem(`horaires_offline_${jours}`);
      return null;
    }
    return data;
  },

  hasOfflineHoraires: (jours: number = 7): boolean => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(`horaires_offline_${jours}`);
    if (!stored) return false;
    
    const { expiresAt } = JSON.parse(stored);
    return new Date(expiresAt) >= new Date();
  },
};
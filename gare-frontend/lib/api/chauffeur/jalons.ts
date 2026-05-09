import { apiClient } from '../client';

export interface ArretAvecValidation {
  id: number;
  ville: string;
  ordre: number;
  dureePauseMinutes?: number;
  heurePrevueOffsetMinutes?: number;
}

export interface JalonsData {
  arrets: ArretAvecValidation[];
  arrives: number[];
  partis: number[];
  jalons: {
    arretId: number;
    arriveeLe: string | null;
    departLe: string | null;
    retardArriveeMinutes: number;
    dureeStationnementMinutes: number;
  }[];
}

export const chauffeurJalonApi = {
  getArrets: async (trajetId: number): Promise<JalonsData> => {
    const response = await apiClient.get(`/chauffeur/trajets/${trajetId}/arrets`);
    return response.data;
  },
  arriverArret: async (trajetId: number, arretId: number): Promise<any> => {
    const response = await apiClient.post(`/chauffeur/jalons/${trajetId}/arriver/${arretId}`);
    return response.data;
  },
  departirArret: async (trajetId: number, arretId: number): Promise<any> => {
    const response = await apiClient.post(`/chauffeur/jalons/${trajetId}/depart/${arretId}`);
    return response.data;
  },
};

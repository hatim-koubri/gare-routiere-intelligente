import { apiClient } from '../client';
import { Quai, QuaiRequest } from '@/types';
import { adminCompagnieApi } from './compagnies';

// Cache pour les compagnies
let compagniesCache: Map<number, string> = new Map();

export const adminQuaiApi = {
  getAll: async (): Promise<Quai[]> => {
    try {
      const quaiResponse = await apiClient.get('/admin/quais');
      let quaiData = quaiResponse.data;

      // Charger les compagnies si pas encore fait
      if (compagniesCache.size === 0) {
        const compagnies = await adminCompagnieApi.getAll();
        if (Array.isArray(compagnies)) {
          compagnies.forEach((c: any) => {
            compagniesCache.set(c.id, c.nom);
          });
        }
      }

      // Enrichir les quais avec le nom de la compagnie
      if (Array.isArray(quaiData)) {
        return quaiData.map((quai: any) => {
          let compagnieId = null;

          if (quai.compagnieId) {
            compagnieId = quai.compagnieId;
          } else if (quai.compagnie && quai.compagnie.id) {
            compagnieId = quai.compagnie.id;
          } else if (quai.compagnie_id) {
            compagnieId = quai.compagnie_id;
          }

          return {
            ...quai,
            compagnieId: compagnieId,
            compagnieNom: compagnieId ? (compagniesCache.get(compagnieId) || '-') : '-'
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Erreur chargement quais:', error);
      return [];
    }
  },

  getDisponibles: async (): Promise<Quai[]> => {
    const response = await apiClient.get('/admin/quais/disponibles');
    return response.data;
  },

  create: async (data: QuaiRequest): Promise<Quai> => {
    const response = await apiClient.post('/admin/quais', data);
    compagniesCache.clear();
    return response.data;
  },

  attribuer: async (quaiId: number, compagnieId: number): Promise<Quai> => {
    const response = await apiClient.post(`/admin/quais/${quaiId}/attribuer/${compagnieId}`);
    compagniesCache.clear();
    return response.data;
  },

  liberer: async (quaiId: number): Promise<Quai> => {
    const response = await apiClient.post(`/admin/quais/${quaiId}/liberer`);
    compagniesCache.clear();
    return response.data;
  },
};
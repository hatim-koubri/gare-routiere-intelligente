import { apiClient } from '../client';
import { Bus, BusRequest } from '@/types';
import { adminCompagnieApi } from './compagnies';

// Cache pour les compagnies
let compagniesCache: Map<number, string> = new Map();

export const adminBusApi = {
  getAll: async (): Promise<Bus[]> => {
    try {
      // 1. Récupérer les bus
      const busResponse = await apiClient.get('/admin/bus');
      let busData = busResponse.data;
      
      console.log('=== BUS DATA BRUT ===', busData);
      
      // 2. Charger les compagnies si pas encore fait
      if (compagniesCache.size === 0) {
        const compagnies = await adminCompagnieApi.getAll();
        if (Array.isArray(compagnies)) {
          compagnies.forEach((c: any) => {
            compagniesCache.set(c.id, c.nom);
          });
          console.log('Compagnies chargées:', compagniesCache);
        }
      }
      
      // 3. Enrichir les bus avec le nom de la compagnie
      if (Array.isArray(busData)) {
        return busData.map((bus: any) => {
          // Chercher l'ID de la compagnie à différents endroits
          let compagnieId = null;
          
          if (bus.compagnieId) {
            compagnieId = bus.compagnieId;
          } else if (bus.compagnie && bus.compagnie.id) {
            compagnieId = bus.compagnie.id;
          } else if (bus.compagnie_id) {
            compagnieId = bus.compagnie_id;
          }
          
          console.log(`Bus ${bus.id} - compagnieId trouvé:`, compagnieId);
          
          return {
            ...bus,
            compagnieId: compagnieId,
            compagnieNom: compagnieId ? (compagniesCache.get(compagnieId) || '-') : '-'
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Erreur chargement bus:', error);
      return [];
    }
  },

  getByCompagnie: async (compagnieId: number): Promise<Bus[]> => {
    const response = await apiClient.get(`/admin/bus/compagnie/${compagnieId}`);
    return response.data;
  },

  create: async (data: BusRequest): Promise<Bus> => {
    const response = await apiClient.post('/admin/bus', data);
    // Invalider le cache après création
    compagniesCache.clear();
    return response.data;
  },

  update: async (id: number, data: BusRequest): Promise<Bus> => {
    const response = await apiClient.put(`/admin/bus/${id}`, data);
    compagniesCache.clear();
    return response.data;
  },

  desactiver: async (id: number): Promise<Bus> => {
    const response = await apiClient.patch(`/admin/bus/${id}/desactiver`);
    return response.data;
  },

  supprimer: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/bus/${id}`);
    compagniesCache.clear();
  },
};
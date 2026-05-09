import { apiClient } from '../client';
import { Bus, BusRequest } from '@/types';

export const responsableBusApi = {
  getAll: async (): Promise<Bus[]> => {
    try {
      const response = await apiClient.get('/responsable/bus');
      return response.data;
    } catch (error) {
      console.error('Erreur getAll Bus:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<Bus> => {
    const response = await apiClient.get(`/responsable/bus/${id}`);
    return response.data;
  },

  create: async (data: BusRequest): Promise<Bus> => {
    const response = await apiClient.post('/responsable/bus', data);
    return response.data;
  },

  update: async (id: number, data: BusRequest): Promise<Bus> => {
    const response = await apiClient.put(`/responsable/bus/${id}`, data);
    return response.data;
  },

  desactiver: async (id: number): Promise<Bus> => {
    const response = await apiClient.patch(`/responsable/bus/${id}/desactiver`);
    return response.data;
  },

  activer: async (id: number): Promise<Bus> => {
    const response = await apiClient.patch(`/responsable/bus/${id}/activer`);
    return response.data;
  },

  toggleMaintenance: async (id: number, enMaintenance: boolean): Promise<Bus> => {
    const response = await apiClient.patch(`/responsable/bus/${id}/maintenance`, null, {
      params: { enMaintenance }
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/responsable/bus/${id}`);
  }
};

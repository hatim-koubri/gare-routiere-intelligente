import { apiClient } from './client';
import { NotificationOfflineResponse, NotificationDTO } from '@/types';

export const notificationsApi = {
  syncNotifications: async (): Promise<NotificationOfflineResponse> => {
    const response = await apiClient.post<NotificationOfflineResponse>('/notifications-offline/sync');
    return response.data;
  },

  getPendingCount: async (): Promise<number> => {
    const response = await apiClient.get<{ notificationsEnAttente: number }>('/notifications-offline/count');
    return response.data.notificationsEnAttente;
  },

  getHistory: async (): Promise<NotificationDTO[]> => {
    const response = await apiClient.get<NotificationDTO[]>('/notifications-offline/historique');
    return response.data;
  },
};
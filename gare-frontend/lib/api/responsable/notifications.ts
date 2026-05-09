import { apiClient } from '../client';
import { NotificationTrajetRequest } from '@/types';

export const responsableNotificationApi = {
  envoyer: async (data: NotificationTrajetRequest): Promise<string> => {
    const response = await apiClient.post('/responsable/notifications', data);
    return response.data;
  },
};

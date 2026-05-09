import { apiClient } from '../client';
import { MessageResponse, EnvoyerMessageRequest } from '@/types';

export const responsableMessageApi = {
  getInbox: async (): Promise<MessageResponse[]> => {
    try {
      const response = await apiClient.get('/responsable/messages/inbox');
      return response.data;
    } catch (error) {
      console.error('Erreur getInbox:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.get(`/responsable/messages/${id}`);
    return response.data;
  },

  envoyer: async (data: EnvoyerMessageRequest): Promise<MessageResponse> => {
    const response = await apiClient.post('/responsable/messages/envoyer', data);
    return response.data;
  },
};

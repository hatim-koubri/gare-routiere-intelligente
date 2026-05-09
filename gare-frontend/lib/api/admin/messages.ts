import { apiClient } from '../client';
import { MessageResponse, EnvoyerMessageRequest } from '@/types';

export interface ResponsableRecipient {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

export const adminMessageApi = {
  getInbox: async (): Promise<MessageResponse[]> => {
    const response = await apiClient.get('/admin/messages/inbox');
    return response.data;
  },

  getById: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.get(`/admin/messages/${id}`);
    return response.data;
  },

  envoyer: async (data: EnvoyerMessageRequest & { destinataireId: number }): Promise<MessageResponse> => {
    const response = await apiClient.post('/admin/messages/envoyer', data);
    return response.data;
  },

  getResponsables: async (): Promise<ResponsableRecipient[]> => {
    const response = await apiClient.get('/admin/messages/responsables');
    return response.data;
  },
};

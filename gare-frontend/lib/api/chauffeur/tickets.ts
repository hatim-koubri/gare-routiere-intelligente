import { apiClient } from '../client';
import { ValidationTicketResponse } from '@/types';

export const chauffeurTicketApi = {
  // Valider un ticket par QR code
  validerTicket: async (qrCode: string): Promise<ValidationTicketResponse> => {
    const response = await apiClient.post(`/chauffeur/tickets/valider/${qrCode}`);
    return response.data;
  },
};
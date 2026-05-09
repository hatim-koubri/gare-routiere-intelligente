import { apiClient } from '../client';
import { ReservationRequest, ReservationResponse, SiegePlanDTO, BagageRequest, BagageResponseDTO, MembreGroupeDTO, RemboursementResponse } from '@/types';

export interface ChangementSiegeRequest {
  nouveauxSieges: string[];
  reservationId: number;
  numeroCarte?: string;
  dateExpiration?: string;
  cvv?: string;
}

export interface ModificationReservationRequest {
  nouveauTrajetId: number;
  nouveauxSieges: string[];
  numeroCarte?: string;
  dateExpiration?: string;
  cvv?: string;
}

export const reservationApi = {
  creer: async (data: ReservationRequest): Promise<ReservationResponse> => {
    const response = await apiClient.post('/voyageur/reservations', data);
    return response.data;
  },

  getAll: async (): Promise<ReservationResponse[]> => {
    const response = await apiClient.get('/voyageur/reservations');
    return response.data;
  },

  getById: async (id: number): Promise<ReservationResponse> => {
    const response = await apiClient.get(`/voyageur/reservations/${id}`);
    return response.data;
  },

  getPlanBus: async (trajetId: number): Promise<SiegePlanDTO[]> => {
    const response = await apiClient.get(`/voyageur/reservations/trajets/${trajetId}/plan-bus`);
    return response.data;
  },

  verrouillerSieges: async (reservationId: number, trajetId: number, numerosSieges: string[]): Promise<void> => {
    await apiClient.post('/voyageur/reservations/verrouiller', {
      reservationId,
      trajetId,
      numerosSieges,
    });
  },

  ajouterBagages: async (reservationId: number, bagages: BagageRequest[]): Promise<BagageResponseDTO[]> => {
    const response = await apiClient.post(`/voyageur/reservations/${reservationId}/bagages`, bagages);
    return response.data;
  },

  annuler: async (id: number): Promise<RemboursementResponse> => {
    const response = await apiClient.delete(`/voyageur/reservations/${id}/annuler`);
    return response.data;
  },

  modifierMembre: async (reservationId: number, membreId: number, data: any): Promise<MembreGroupeDTO> => {
    const response = await apiClient.put(`/voyageur/reservations/${reservationId}/membres/${membreId}`, data);
    return response.data;
  },

  supprimerMembre: async (reservationId: number, membreId: number): Promise<RemboursementResponse> => {
    const response = await apiClient.delete(`/voyageur/reservations/${reservationId}/membres/${membreId}`);
    return response.data;
  },

  changerSieges: async (reservationId: number, data: ChangementSiegeRequest): Promise<ReservationResponse> => {
    const response = await apiClient.put(`/voyageur/reservations/${reservationId}/changer-sieges`, data);
    return response.data;
  },

  modifierTrajet: async (reservationId: number, data: ModificationReservationRequest): Promise<ReservationResponse> => {
    const response = await apiClient.put(`/voyageur/reservations/${reservationId}/modifier`, data);
    return response.data;
  },

  supprimerBagage: async (reservationId: number, bagageId: number): Promise<BagageResponseDTO> => {
    const response = await apiClient.delete(`/voyageur/reservations/${reservationId}/bagages/${bagageId}`);
    return response.data;
  },

  annulerTicket: async (reservationId: number, ticketId: number): Promise<RemboursementResponse> => {
    const response = await apiClient.post(`/voyageur/reservations/${reservationId}/tickets/${ticketId}/annuler`);
    return response.data;
  },
};
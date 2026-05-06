import { apiClient } from '../client';
import { ReservationRequest, ReservationResponse, SiegePlanDTO, BagageRequest, BagageResponseDTO } from '@/types';

export const reservationApi = {
  creer: async (data: ReservationRequest): Promise<ReservationResponse> => {
    const response = await apiClient.post('/voyageur/reservations', data);
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

  /**
   * Ajoute des bagages à une réservation existante.
   * Le surplus est calculé automatiquement par le backend selon poids + volume.
   */
  ajouterBagages: async (reservationId: number, bagages: BagageRequest[]): Promise<BagageResponseDTO[]> => {
    const response = await apiClient.post(`/voyageur/reservations/${reservationId}/bagages`, bagages);
    return response.data;
  },
};
import { apiClient } from '../client';
import { Reclamation, CreerReclamationRequest } from '@/types';

export const reclamationApi = {
  getAll: () =>
    apiClient.get<Reclamation[]>('/voyageur/reclamations').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<Reclamation>(`/voyageur/reclamations/${id}`).then(r => r.data),

  creer: (data: CreerReclamationRequest) =>
    apiClient.post<Reclamation>('/voyageur/reclamations', data).then(r => r.data),
};

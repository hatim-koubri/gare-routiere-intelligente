import { apiClient } from '../client';

export interface AbonnementDTO {
  id: number;
  ligneId: number;
  villeDepart: string;
  villeArrivee: string;
  dateDebut: string;
  dateFin: string;
  prixMensuel: number;
  actif: boolean;
  renouvellementAuto: boolean;
  dateCreation: string;
}

export interface LigneDisponible {
  id: number;
  villeDepart: string;
  villeArrivee: string;
  prixAbonnementMensuel: number;
  compagnieNom: string;
}

export const abonnementsApi = {
  getDisponibles: async (): Promise<LigneDisponible[]> => {
    const response = await apiClient.get('/voyageur/abonnements/disponibles');
    return response.data;
  },
  getAll: async (): Promise<AbonnementDTO[]> => {
    const response = await apiClient.get('/voyageur/abonnements');
    return response.data;
  },
  souscrire: async (ligneId: number): Promise<AbonnementDTO> => {
    const response = await apiClient.post('/voyageur/abonnements', { ligneId });
    return response.data;
  },
  resilier: async (id: number): Promise<void> => {
    await apiClient.post(`/voyageur/abonnements/${id}/resilier`);
  },
  toggleRenouvellementAuto: async (id: number): Promise<void> => {
    await apiClient.post(`/voyageur/abonnements/${id}/renouvellement-auto`);
  },
};

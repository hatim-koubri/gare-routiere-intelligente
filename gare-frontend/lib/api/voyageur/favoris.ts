import { apiClient } from '../client';

export interface FavoriDTO {
  id: number;
  ligneId: number;
  villeDepart: string;
  villeArrivee: string;
  prixBase: number;
  compagnieNom: string;
  compagnieId: number;
  dateCreation: string;
}

export const favorisApi = {
  getAll: async (): Promise<FavoriDTO[]> => {
    const response = await apiClient.get('/voyageur/favoris');
    return response.data;
  },
  ajouter: async (ligneId: number): Promise<void> => {
    await apiClient.post('/voyageur/favoris', { ligneId });
  },
  supprimer: async (ligneId: number): Promise<void> => {
    await apiClient.delete(`/voyageur/favoris/${ligneId}`);
  },
};

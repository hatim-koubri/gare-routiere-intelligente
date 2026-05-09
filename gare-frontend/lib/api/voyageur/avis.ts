import { apiClient } from '../client';
import { AvisResponseDTO } from '@/types';

export const avisApi = {
  getByCompagnie: async (compagnieId: number): Promise<AvisResponseDTO[]> => {
    const response = await apiClient.get(`/voyageur/avis/compagnie/${compagnieId}`);
    return response.data;
  },

  getByTrajet: async (trajetId: number): Promise<AvisResponseDTO[]> => {
    const response = await apiClient.get(`/voyageur/avis/trajet/${trajetId}`);
    return response.data;
  },

  ajouter: async (data: {
    trajetId: number;
    notePonctualite: number;
    noteConfort: number;
    noteChauffeur: number;
    commentaire: string;
  }): Promise<AvisResponseDTO> => {
    const response = await apiClient.post('/voyageur/avis', data);
    return response.data;
  },

  mesAvis: async (): Promise<AvisResponseDTO[]> => {
    const response = await apiClient.get('/voyageur/avis/mes-avis');
    return response.data;
  },

  eligibles: async (): Promise<EligibleTrajet[]> => {
    const response = await apiClient.get('/voyageur/avis/eligibles');
    return response.data;
  },
};

export interface EligibleTrajet {
  trajetId: number;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string | null;
  compagnieNom: string;
  busMatricule: string;
}

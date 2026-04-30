// lib/api/voyageur/dashboard.ts
import { apiClient } from '../client';
import { ReservationResponse } from '@/types';

export interface VoyageurStats {
  totalReservations: number;
  totalDepense: number;
  totalTrajetsAvenir: number;
  totalTrajetsPasses: number;
  compagnieFavorite: string;
  trajetsParMois: {
    mois: string;
    count: number;
    totalDepense: number;
  }[];
}

export interface ReservationHistorique {
  id: number;
  dateReservation: string;
  dateDepart: string;
  villeDepart: string;
  villeArrivee: string;
  compagnieNom: string;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'REMBOURSEE';
  prixTotal: number;
  nombrePassagers: number;
  numerosSieges: string[];
  trajetId: number;
}

export const dashboardApi = {
  // Récupérer les réservations du voyageur (à adapter selon vos endpoints)
  getMesReservations: async (): Promise<ReservationResponse[]> => {
    try {
      // Note: Si pas d'endpoint GET, on peut stocker dans localStorage
      // ou utiliser un endpoint comme /api/voyageur/reservations/historique
      const response = await apiClient.get('/voyageur/reservations/historique');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      return [];
    }
  },

  // Récupérer les détails d'une réservation
  getReservationDetails: async (reservationId: number): Promise<ReservationResponse> => {
    const response = await apiClient.get(`/voyageur/reservations/${reservationId}`);
    return response.data;
  },

  // Annuler une réservation
  annulerReservation: async (reservationId: number): Promise<void> => {
    await apiClient.post(`/voyageur/reservations/${reservationId}/annuler`);
  },

  // Calculer les stats à partir des réservations
  calculerStats: (reservations: ReservationResponse[]): VoyageurStats => {
    const maintenant = new Date();
    
    const reservationsAvenir = reservations.filter(r => 
      r.statut === 'CONFIRMEE' && r.trajet?.dateDepart && new Date(r.trajet.dateDepart) > maintenant
    );
    
    const reservationsPassees = reservations.filter(r => 
      r.statut === 'CONFIRMEE' && r.trajet?.dateDepart && new Date(r.trajet.dateDepart) <= maintenant
    );

    // Compagnie favorite
    const compagnieCount = new Map<string, number>();
    reservations.forEach(r => {
      const nom = r.trajet?.compagnieNom;
      if (nom) compagnieCount.set(nom, (compagnieCount.get(nom) || 0) + 1);
    });
    
    let compagnieFavorite = 'N/A';
    let maxCount = 0;
    compagnieCount.forEach((count, nom) => {
      if (count > maxCount) {
        maxCount = count;
        compagnieFavorite = nom;
      }
    });

    // Trajets par mois (derniers 6 mois)
    const moisMap = new Map<string, { count: number; totalDepense: number }>();
    
    reservations.forEach(r => {
      if (r.statut === 'CONFIRMEE' && r.trajet?.dateDepart) {
        const date = new Date(r.trajet.dateDepart);
        const moisKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const existing = moisMap.get(moisKey) || { count: 0, totalDepense: 0 };
        moisMap.set(moisKey, {
          count: existing.count + 1,
          totalDepense: existing.totalDepense + (r.prixTotal || 0)
        });
      }
    });
    
    const trajetsParMois: { mois: string; count: number; totalDepense: number }[] = [];
    Array.from(moisMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .forEach(([key, value]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        trajetsParMois.push({
          mois: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          count: value.count,
          totalDepense: value.totalDepense
        });
      });

    return {
      totalReservations: reservations.length,
      totalDepense: reservations.reduce((sum, r) => sum + (r.prixTotal || 0), 0),
      totalTrajetsAvenir: reservationsAvenir.length,
      totalTrajetsPasses: reservationsPassees.length,
      compagnieFavorite,
      trajetsParMois
    };
  }
};
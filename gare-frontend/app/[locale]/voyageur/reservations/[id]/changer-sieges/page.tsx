// app/[locale]/voyageur/reservations/[id]/changer-sieges/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Reservation {
  id: number;
  trajet: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule: string;
    quaiNumero: number;
  };
  tickets: Array<{
    id: number;
    numeroSiege: string;
    nomPassager: string;
    prenomPassager: string;
    prix: number;
    qrCode: string;
    statut: string;
  }>;
  prixTotal: number;
  statut: string;
  nbModif: number;
}

export default function ChangerSiegesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = 'fr';
  const reservationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [siegesActuels, setSiegesActuels] = useState<string[]>([]);
  const [nombreSieges, setNombreSieges] = useState(1);
  const [siegesDisponibles, setSiegesDisponibles] = useState<string[]>([]);
  const [selectedSieges, setSelectedSieges] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/fr/auth/login`);
    }
  }, [user, authLoading, router, locale]);

  useEffect(() => {
    if (user && reservationId) {
      loadData();
    }
  }, [user, reservationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Récupérer la réservation
      const res = await apiClient.get(`/voyageur/reservations/${reservationId}`);
      const data = res.data;
      
      setReservation(data);
      
      const siegesActuelsList = data.tickets?.map((t: any) => t.numeroSiege) || [];
      setSiegesActuels(siegesActuelsList);
      setNombreSieges(siegesActuelsList.length);
      
      // Récupérer le plan du bus
      const trajetId = data.trajet.id;
      const planBus = await apiClient.get(`/voyageur/reservations/trajets/${trajetId}/plan-bus`);
      
      const siegesLibres = planBus.data
        .filter((s: any) => !s.occupe && !s.bloque && !s.verrouilleTemporaire)
        .map((s: any) => s.numeroSiege);
      
      setSiegesDisponibles(siegesLibres);
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleSiege = (siege: string) => {
    if (selectedSieges.includes(siege)) {
      setSelectedSieges(selectedSieges.filter(s => s !== siege));
    } else {
      if (selectedSieges.length < nombreSieges) {
        setSelectedSieges([...selectedSieges, siege]);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedSieges.length !== nombreSieges) {
      setError(`Veuillez sélectionner ${nombreSieges} nouveau(x) siège(s)`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/voyageur/reservations/${reservationId}/changer-sieges`, {
        nouveauxSieges: selectedSieges
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/fr/voyageur/reservations/${reservationId}`);
      }, 2000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors du changement de sièges');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
        <Link href={`/fr/voyageur/reservations`} className="text-blue-600 mt-4 inline-block">
          Retour à mes réservations
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sièges changés avec succès !</h2>
        <p className="text-gray-500 mt-2">Redirection en cours...</p>
      </div>
    );
  }

  // Vérifier si le départ est passé
  const isPast = reservation && new Date(reservation.trajet.dateDepart) < new Date();

  if (isPast) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          Impossible de changer les sièges car le départ est déjà passé.
        </div>
        <Link href={`/fr/voyageur/reservations/${reservationId}`} className="text-blue-600 mt-4 inline-block">
          Retour à la réservation
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link
          href={`/fr/voyageur/reservations/${reservationId}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Changer mes sièges</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Info trajet */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">
            {reservation?.trajet.villeDepart} → {reservation?.trajet.villeArrivee}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {reservation?.trajet.compagnieNom} • Bus {reservation?.trajet.busMatricule}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            Départ: {reservation?.trajet.dateDepart && new Date(reservation.trajet.dateDepart).toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Sièges actuels */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Sièges actuels : <strong>{siegesActuels.join(', ')}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Vous pouvez changer {nombreSieges} siège{nombreSieges > 1 ? 's' : ''}
          </p>
        </div>

        {/* Nouveaux sièges */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nouveaux sièges disponibles
          </label>
          {siegesDisponibles.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
              Aucun siège disponible sur ce trajet
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {siegesDisponibles.map((siege) => (
                  <button
                    key={siege}
                    onClick={() => toggleSiege(siege)}
                    className={`p-3 rounded-lg border text-center transition ${
                      selectedSieges.includes(siege)
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'border-gray-200 text-gray-700 hover:border-orange-300'
                    }`}
                  >
                    {siege}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Nouveaux sièges sélectionnés: {selectedSieges.join(', ') || 'aucun'}
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || selectedSieges.length !== nombreSieges || siegesDisponibles.length === 0}
          className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {submitting ? 'Changement en cours...' : 'Confirmer le changement de sièges'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Le changement de sièges est gratuit et ne modifie pas le prix total.
        </p>
      </div>
    </div>
  );
}
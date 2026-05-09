// app/[locale]/voyageur/reservations/[id]/changer-sieges/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw, CreditCard } from 'lucide-react';
import { PaymentForm, PaymentData } from '@/components/voyageur/PaymentForm';

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
  const [modificationFee, setModificationFee] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

      // Calculer les frais : gratuit si première modif, 20 DH sinon
      const fee = (data.nbModif ?? 0) > 0 ? 20 : 0;
      setModificationFee(fee);
      
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

    // Si frais de modification, afficher le formulaire de paiement
    if (modificationFee > 0) {
      setShowPaymentForm(true);
      return;
    }

    await confirmChangement();
  };

  const handlePayment = async (paymentData: PaymentData) => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      await confirmChangement(paymentData);
      setShowPaymentForm(false);
    } catch (e: any) {
      setPaymentError(e.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setPaymentLoading(false);
    }
  };

  const confirmChangement = async (paymentData?: PaymentData) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/voyageur/reservations/${reservationId}/changer-sieges`, {
        nouveauxSieges: selectedSieges,
        ...(paymentData ? {
          numeroCarte: paymentData.numeroCarte,
          dateExpiration: paymentData.dateExpiration,
          cvv: paymentData.cvv,
        } : {})
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

        {/* Résumé des frais */}
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 font-medium mb-2">Résumé des frais</p>
          <div className="space-y-1 text-sm text-amber-700">
            {modificationFee > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Frais de modification (2ème modif):</span>
                  <span className="font-bold">{modificationFee} MAD</span>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Un paiement supplémentaire de {modificationFee} MAD est nécessaire
                </p>
              </>
            )}
            {modificationFee === 0 && (
              <p className="text-green-700 font-medium">✓ Changement gratuit (première modification)</p>
            )}
          </div>
        </div>

        {!showPaymentForm ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedSieges.length !== nombreSieges || siegesDisponibles.length === 0}
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {submitting ? 'Changement en cours...' : modificationFee > 0 ? 'Procéder au paiement' : 'Confirmer le changement de sièges'}
          </button>
        ) : null}

        {/* Formulaire de paiement */}
        {showPaymentForm && modificationFee > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Paiement des frais de modification
            </h3>
            <PaymentForm
              amount={modificationFee}
              description="Frais de modification de sièges (2ème modification et suivantes)"
              onSubmit={handlePayment}
              loading={paymentLoading}
              error={paymentError}
            />
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          1ère modification gratuite • À partir de la 2ème: 20 DH
        </p>
      </div>
    </div>
  );
}
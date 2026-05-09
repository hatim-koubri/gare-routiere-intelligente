// app/[locale]/voyageur/reservations/[id]/modifier/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, MapPin, Building, Calendar, CreditCard } from 'lucide-react';
import { PaymentForm, PaymentData } from '@/components/voyageur/PaymentForm';

interface TrajetOption {
  id: number;
  dateDepart: string;
  villeDepart: string;
  villeArrivee: string;
  compagnieNom: string;
  prixBase: number;
  busMatricule?: string;
  quaiNumero?: number;
}

interface Reservation {
  id: number;
  trajet: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
  };
  tickets: Array<{ id: number; numeroSiege: string; nomPassager: string; prenomPassager: string }>;
  prixTotal: number;
  statut: string;
  nbModif: number;
}

export default function ModifierReservationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = 'fr';
  const reservationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [trajetsOptions, setTrajetsOptions] = useState<TrajetOption[]>([]);
  const [selectedTrajetId, setSelectedTrajetId] = useState<number | null>(null);
  const [selectedSieges, setSelectedSieges] = useState<string[]>([]);
  const [siegesDisponibles, setSiegesDisponibles] = useState<string[]>([]);
  const [nombreSieges, setNombreSieges] = useState(1);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTrajets, setLoadingTrajets] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [modificationFee, setModificationFee] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/fr/auth/login`);
    }
  }, [user, authLoading, router, locale]);

  useEffect(() => {
    if (user && reservationId) {
      loadReservation();
    }
  }, [user, reservationId]);

  const loadReservation = async () => {
    setLoading(true);
    try {
      // Récupérer la réservation actuelle
      const res = await apiClient.get(`/voyageur/reservations/${reservationId}`);
      setReservation(res.data);
      setNombreSieges(res.data.tickets?.length || 1);
      
      // Calculer les frais de modification (gratuit si première mod, 20 DH sinon)
      const fee = (res.data.nbModif ?? 0) > 0 ? 20 : 0;
      setModificationFee(fee);
      
      // Charger les trajets alternatifs (même destination)
      await loadTrajetsAlternatifs(res.data.trajet.villeDepart, res.data.trajet.villeArrivee);
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadTrajetsAlternatifs = async (villeDepart: string, villeArrivee: string) => {
    setLoadingTrajets(true);
    try {
      // Chercher sur une plage de 30 jours au lieu d'un seul jour
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      const response = await apiClient.post('/voyageur/recherche/trajets-filtres', {
        villeDepart: villeDepart,
        villeArrivee: villeArrivee,
        dateDebut: today.toISOString().split('T')[0],
        dateFin: thirtyDaysLater.toISOString().split('T')[0],
        prixMin: null,
        prixMax: null,
        heureDepartMin: null,
        heureDepartMax: null,
        nbArretsMax: null
      });
      
      // Filtrer pour exclure le trajet actuel et les trajets passés
      const trajetActuelId = reservation?.trajet?.id;
      const maintenant = new Date();
      const filtered = (response.data || []).filter((t: TrajetOption) => 
        t.id !== trajetActuelId && new Date(t.dateDepart) > maintenant
      );
      
      setTrajetsOptions(filtered);
    } catch (error) {
      console.error('Erreur chargement trajets:', error);
      setTrajetsOptions([]);
    } finally {
      setLoadingTrajets(false);
    }
  };

  const loadSiegesDisponibles = async (trajetId: number) => {
    try {
      const response = await apiClient.get(`/voyageur/reservations/trajets/${trajetId}/plan-bus`);
      const siegesLibres = response.data
        .filter((s: any) => !s.occupe && !s.bloque && !s.verrouilleTemporaire)
        .map((s: any) => s.numeroSiege);
      setSiegesDisponibles(siegesLibres);
    } catch (error) {
      console.error('Erreur chargement sièges:', error);
      setSiegesDisponibles([]);
    }
  };

  const handleTrajetChange = (trajetId: number) => {
    setSelectedTrajetId(trajetId);
    setSelectedSieges([]);
    loadSiegesDisponibles(trajetId);
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
    if (!selectedTrajetId) {
      setError('Veuillez sélectionner un nouveau trajet');
      return;
    }
    if (selectedSieges.length !== nombreSieges) {
      setError(`Veuillez sélectionner ${nombreSieges} siège(s)`);
      return;
    }

    // Si frais de modification, afficher le formulaire de paiement
    if (modificationFee > 0) {
      setShowPaymentForm(true);
      return;
    }

    // Sinon, effectuer la modification directement
    await confirmModification();
  };

  const handlePayment = async (paymentData: PaymentData) => {
    setPaymentLoading(true);
    setPaymentError(null);
    
    try {
      // Passe les données de carte directement dans la modification
      await confirmModification(paymentData);
      setShowPaymentForm(false);
    } catch (e: any) {
      setPaymentError(e.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setPaymentLoading(false);
    }
  };

  const confirmModification = async (paymentData?: PaymentData) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/voyageur/reservations/${reservationId}/modifier`, {
        nouveauTrajetId: selectedTrajetId,
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
      setError(error.response?.data?.message || 'Erreur lors de la modification');
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
        <Link href={`/fr/voyageur/reservations/${reservationId}`} className="text-blue-600 mt-4 inline-block">
          Retour à la réservation
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
        <h2 className="text-xl font-bold text-gray-900">Modification effectuée !</h2>
        <p className="text-gray-500 mt-2">Redirection en cours...</p>
      </div>
    );
  }

  const siegesActuels = reservation?.tickets?.map(t => t.numeroSiege) || [];
  const selectedTrajet = trajetsOptions.find(t => t.id === selectedTrajetId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link
          href={`/fr/voyageur/reservations/${reservationId}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifier la réservation</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Info réservation actuelle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Réservation actuelle</p>
          <p className="font-semibold text-gray-800">
            {reservation?.trajet.villeDepart} → {reservation?.trajet.villeArrivee}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {reservation?.trajet.compagnieNom} • {reservation?.tickets?.length} passager(s)
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Sièges actuels: {siegesActuels.join(', ')}
          </p>
          {reservation && reservation.nbModif > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Cette réservation a déjà été modifiée {reservation.nbModif} fois
            </p>
          )}
        </div>

        {/* Sélection du nouveau trajet */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nouveau trajet (même destination)
          </label>
          {loadingTrajets ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : trajetsOptions.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
              Aucun trajet alternatif disponible pour cette destination
            </div>
          ) : (
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedTrajetId || ''}
              onChange={(e) => handleTrajetChange(Number(e.target.value))}
            >
              <option value="">Sélectionnez un trajet</option>
              {trajetsOptions.map((trajet) => (
                <option key={trajet.id} value={trajet.id}>
                  {new Date(trajet.dateDepart).toLocaleString('fr-FR')} - {trajet.prixBase} MAD - {trajet.compagnieNom}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Détails du trajet sélectionné */}
        {selectedTrajet && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-700 mb-2">Détails du nouveau trajet</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{selectedTrajet.compagnieNom}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{new Date(selectedTrajet.dateDepart).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{new Date(selectedTrajet.dateDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Prix: {selectedTrajet.prixBase} MAD</span>
              </div>
            </div>
          </div>
        )}

        {/* Sélection des sièges */}
        {selectedTrajetId && siegesDisponibles.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveaux sièges (sélectionnez {nombreSieges})
            </label>
            <div className="grid grid-cols-4 gap-2">
              {siegesDisponibles.map((siege) => (
                <button
                  key={siege}
                  onClick={() => toggleSiege(siege)}
                  className={`p-3 rounded-lg border text-center transition ${
                    selectedSieges.includes(siege)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {siege}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Sièges sélectionnés: {selectedSieges.join(', ') || 'aucun'}
            </p>
          </div>
        )}

        {selectedTrajetId && siegesDisponibles.length === 0 && !loadingTrajets && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
            Aucun siège disponible sur ce trajet
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Résumé des frais */}
        {selectedTrajetId && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
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
              {modificationFee === 0 && reservation && reservation.nbModif === 0 && (
                <p className="text-green-700 font-medium">✓ Modification gratuite (première modif)</p>
              )}
            </div>
          </div>
        )}

        {/* Bouton action */}
        {!showPaymentForm ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedTrajetId || selectedSieges.length !== nombreSieges || siegesDisponibles.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {modificationFee > 0 ? 'Procéder au paiement' : 'Confirmer la modification'}
              </>
            )}
          </button>
        ) : null}

        {/* Formulaire de paiement */}
        {showPaymentForm && modificationFee > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Paiement des frais de modification
            </h3>
            <PaymentForm
              amount={modificationFee}
              description={`Frais de modification (2ème modification et suivantes)`}
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
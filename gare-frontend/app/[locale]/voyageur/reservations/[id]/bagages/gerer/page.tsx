'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle, X, Luggage, Package } from 'lucide-react';
import { PaymentForm, PaymentData } from '@/components/voyageur/PaymentForm';

interface Bagage {
  id: number;
  poidsKg: number;
  dimensionCm: string;
  typeBagage?: string;
  surplusPrix: number;
  qrCodeBagage?: string;
  createdAt?: string;
}

interface ReservationData {
  id: number;
  trajet: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
  };
  bagages: Bagage[];
  statut: string;
  prixTotal: number;
}

export default function GererBagagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Bagage | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refundInfo, setRefundInfo] = useState<{ montant: number; motif: string } | null>(null);
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/fr/auth/login`);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && reservationId) loadReservation();
  }, [user, reservationId]);

  const loadReservation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/voyageur/reservations/${reservationId}`);
      const data = res.data;
      if (!data.bagages) data.bagages = [];
      setReservation(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBagage = async (bagageId: number) => {
    setDeletingId(bagageId);
    setError(null);
    try {
      const response = await apiClient.delete(`/voyageur/reservations/${reservationId}/bagages/${bagageId}`);
      
      if (response.data?.montant) {
        setRefundInfo({ montant: response.data.montant, motif: 'Remboursement bagage supprimé' });
        setSuccess(`Bagage supprimé. Demande de remboursement de ${response.data.montant} MAD créée.`);
      } else {
        setSuccess('Bagage supprimé avec succès');
      }
      
      setShowDeleteConfirm(null);
      await loadReservation();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePayment = async (paymentData: PaymentData) => {
    setPaymentLoading(true);
    setPaymentError(null);
    
    try {
      await apiClient.post(`/voyageur/reservations/${reservationId}/bagages/payer`, {
        ...paymentData,
      });
      
      setSuccess('Paiement effectué avec succès');
      setShowPaymentForm(false);
      await loadReservation();
    } catch (e: any) {
      setPaymentError(e.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setPaymentLoading(false);
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
        <Link href={`/fr/voyageur/reservations/${reservationId}`} className="text-blue-600 mt-4 inline-block">
          Retour à la réservation
        </Link>
      </div>
    );
  }

  const isPast = reservation?.trajet.dateDepart && new Date(reservation.trajet.dateDepart) < new Date();
  const canModify = !isPast && reservation?.statut === 'CONFIRMEE';
  const bagages = reservation?.bagages || [];
  const totalBagagePrice = bagages.reduce((sum, b) => sum + b.surplusPrix, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/fr/voyageur/reservations/${reservationId}`} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gérer mes bagages</h1>
          <p className="text-sm text-gray-500 mt-1">Supprimez ou gérez vos bagages avant le départ</p>
        </div>
      </div>

      {/* Info trajet */}
      {reservation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-700 font-medium">
            {reservation.trajet.villeDepart} → {reservation.trajet.villeArrivee}
          </p>
          <p className="text-xs text-gray-500 mt-1">{reservation.trajet.compagnieNom}</p>
        </div>
      )}

      {!canModify && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Vous ne pouvez plus modifier vos bagages après le départ.
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {refundInfo && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="font-medium text-amber-800 mb-1">Demande de remboursement créée</p>
          <p className="text-amber-700">{refundInfo.motif}</p>
          <p className="text-amber-700 mt-1">Montant : <strong>{refundInfo.montant} MAD</strong> — en attente de validation par le responsable.</p>
          <button onClick={() => setRefundInfo(null)} className="mt-2 text-amber-600 underline text-xs">Fermer</button>
        </div>
      )}

      {/* Liste des bagages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Luggage className="w-5 h-5" />
            Bagages ({bagages.length})
          </h2>
          <Link
            href={`/fr/voyageur/reservations/${reservationId}/bagages`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </Link>
        </div>

        {bagages.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <Luggage className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            Aucun bagage ajouté
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bagages.map((bagage) => (
              <div key={bagage.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-gray-400" />
                    <p className="font-medium text-gray-900">Bagage {bagage.poidsKg}kg</p>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📏 Dimensions: {bagage.dimensionCm}</p>
                    {bagage.typeBagage && <p>📦 Type: {bagage.typeBagage}</p>}
                    {bagage.qrCodeBagage && <p>QR: {bagage.qrCodeBagage}</p>}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">
                      Surcharge: {bagage.surplusPrix} MAD
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canModify && (
                    <button
                      onClick={() => setShowDeleteConfirm(bagage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Résumé */}
      {bagages.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Total surcharge bagages:</p>
            <p className="text-2xl font-bold text-gray-900">{totalBagagePrice} MAD</p>
          </div>
        </div>
      )}

      {/* Formulaire de paiement */}
      {showPaymentForm && totalBagagePrice > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Paiement des bagages supplémentaires</h3>
          <PaymentForm
            amount={totalBagagePrice}
            description={`Paiement pour ${bagages.length} bagage(s) supplémentaire(s)`}
            onSubmit={handlePayment}
            loading={paymentLoading}
            error={paymentError}
          />
        </div>
      )}

      {/* Modal confirmation suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer ce bagage?</h3>
              <p className="text-gray-600 mb-4">
                Bagage de {showDeleteConfirm.poidsKg}kg
                <br />
                Surcharge remboursée: {showDeleteConfirm.surplusPrix} MAD
              </p>
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mb-4">
                La demande de remboursement sera envoyée au responsable pour confirmation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteBagage(showDeleteConfirm.id)}
                  disabled={deletingId === showDeleteConfirm.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {deletingId === showDeleteConfirm.id ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

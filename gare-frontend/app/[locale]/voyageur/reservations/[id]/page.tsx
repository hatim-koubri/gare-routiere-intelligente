// app/[locale]/voyageur/reservations/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Bus, Ticket, 
  Trash2, Edit, RefreshCw, CheckCircle, AlertCircle, Info,
  Download
} from 'lucide-react';

interface ReservationDetail {
  id: number;
  dateReservation: string;
  prixTotal: number;
  statut: string;
  nbModif: number;
  trajet: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule: string;
    quaiNumero: number;
  };
  tickets?: Array<{
    id: number;
    numeroSiege: string;
    nomPassager: string;
    prenomPassager: string;
    prix: number;
    qrCode: string;
    statut: string;
  }>;
}

export default function ReservationDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = 'fr';
  const reservationId = params?.id as string;
  
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [remboursementAmount, setRemboursementAmount] = useState<number | null>(null);
  const [downloadingTicketId, setDownloadingTicketId] = useState<number | null>(null);

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
    setError(null);
    try {
      const response = await apiClient.get(`/voyageur/reservations/${reservationId}`);
      // S'assurer que tickets est toujours un tableau
      const data = response.data;
      if (!data.tickets) {
        data.tickets = [];
      }
      setReservation(data);
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 404) {
        setError('Réservation non trouvée');
      } else if (error.response?.status === 403) {
        setError('Vous n\'avez pas accès à cette réservation');
      } else {
        setError(error.response?.data?.message || 'Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnnuler = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete(`/voyageur/reservations/${reservationId}/annuler`);
      setRemboursementAmount(response.data);
      setShowConfirmModal(true);
      await loadReservation();
    } catch (error: any) {
      console.error('Erreur annulation:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadTicket = async (ticketId: number) => {
    setDownloadingTicketId(ticketId);
    try {
      const response = await apiClient.get(`/voyageur/reservations/${reservationId}/ticket/${ticketId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${ticketId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du ticket');
    } finally {
      setDownloadingTicketId(null);
    }
  };

  const canModify = () => {
    if (!reservation) return false;
    const dateDepart = new Date(reservation.trajet.dateDepart);
    const now = new Date();
    const hoursDiff = (dateDepart.getTime() - now.getTime()) / (1000 * 60 * 60);
    return reservation.statut === 'CONFIRMEE' && hoursDiff > 24;
  };

  const canChangeSieges = () => {
    if (!reservation) return false;
    const dateDepart = new Date(reservation.trajet.dateDepart);
    const now = new Date();
    return reservation.statut === 'CONFIRMEE' && dateDepart > now;
  };

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { color: string; text: string }> = {
      CONFIRMEE: { color: 'bg-green-100 text-green-700', text: 'Confirmée' },
      EN_ATTENTE: { color: 'bg-yellow-100 text-yellow-700', text: 'En attente' },
      ANNULEE: { color: 'bg-red-100 text-red-700', text: 'Annulée' },
      REMBOURSEE: { color: 'bg-gray-100 text-gray-700', text: 'Remboursée' }
    };
    return config[statut] || { color: 'bg-gray-100 text-gray-700', text: statut };
  };

  const getTicketStatutBadge = (statut: string) => {
    const config: Record<string, { color: string; text: string }> = {
      ACTIF: { color: 'bg-green-100 text-green-700', text: 'Actif' },
      UTILISE: { color: 'bg-blue-100 text-blue-700', text: 'Utilisé' },
      ANNULE: { color: 'bg-red-100 text-red-700', text: 'Annulé' },
      EXPIRE: { color: 'bg-gray-100 text-gray-700', text: 'Expiré' }
    };
    return config[statut] || { color: 'bg-gray-100 text-gray-700', text: statut };
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 inline-block">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
        <div className="mt-4">
          <Link href={`/fr/voyageur/reservations`} className="text-blue-600 hover:underline">
            ← Retour à mes réservations
          </Link>
        </div>
      </div>
    );
  }

  if (!reservation) return null;

  const statutBadge = getStatutBadge(reservation.statut);
  const dateDepart = new Date(reservation.trajet.dateDepart);
  const isPast = dateDepart < new Date();
  const isUpcoming = !isPast && reservation.statut === 'CONFIRMEE';
  const tickets = reservation.tickets || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/fr/voyageur/reservations`}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Détail de la réservation</h1>
      </div>

      {/* Info principale */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-6 text-white ${
          isUpcoming ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-800'
        }`}>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-sm">Réservation #{reservation.id}</p>
              <h2 className="text-xl font-bold mt-1">
                {reservation.trajet.villeDepart} → {reservation.trajet.villeArrivee}
              </h2>
              <p className="text-white/80 text-sm mt-1">{reservation.trajet.compagnieNom}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white`}>
                {statutBadge.text}
              </span>
              <p className="text-2xl font-bold mt-2">{reservation.prixTotal} MAD</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Trajet info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Date départ</p>
                <p className="text-sm font-medium">
                  {dateDepart.toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Heure départ</p>
                <p className="text-sm font-medium">
                  {dateDepart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bus className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Bus</p>
                <p className="text-sm font-medium">{reservation.trajet.busMatricule}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Quai</p>
                <p className="text-sm font-medium">Quai {reservation.trajet.quaiNumero}</p>
              </div>
            </div>
          </div>

          {/* Modifications count */}
          {reservation.nbModif > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-blue-700">
              <Info className="w-4 h-4" />
              <span className="text-sm">Cette réservation a été modifiée {reservation.nbModif} fois</span>
            </div>
          )}

          {/* Message for past trips */}
          {isPast && reservation.statut === 'CONFIRMEE' && (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2 text-gray-600">
              <Info className="w-4 h-4" />
              <span className="text-sm">Ce voyage est déjà passé</span>
            </div>
          )}

          {/* Actions */}
          {isUpcoming && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
              <div className="flex flex-wrap gap-3">
                {canModify() && (
                  <Link
                    href={`/fr/voyageur/reservations/${reservation.id}/modifier`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier trajet/sièges
                  </Link>
                )}
                {canChangeSieges() && (
                  <Link
                    href={`/fr/voyageur/reservations/${reservation.id}/changer-sieges`}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Changer sièges
                  </Link>
                )}
                <button
                  onClick={handleAnnuler}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {actionLoading ? 'Annulation...' : 'Annuler la réservation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tickets */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Tickets
        </h2>
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun ticket disponible pour cette réservation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const ticketStatut = getTicketStatutBadge(ticket.statut);
              return (
                <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {ticket.nomPassager} {ticket.prenomPassager}
                      </p>
                      <p className="text-sm text-gray-500">Siège {ticket.numeroSiege}</p>
                      <p className="text-sm text-gray-500">{ticket.prix} MAD</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${ticketStatut.color}`}>
                        {ticketStatut.text}
                      </span>
                      {ticket.statut === 'ACTIF' && (
                        <button
                          onClick={() => handleDownloadTicket(ticket.id)}
                          disabled={downloadingTicketId === ticket.id}
                          className="mt-2 flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700 disabled:opacity-50"
                        >
                          {downloadingTicketId === ticket.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              PDF
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bouton retour */}
      <div className="text-center">
        <Link
          href={`/fr/voyageur/reservations`}
          className="inline-block text-gray-600 hover:text-gray-800 transition"
        >
          ← Retour à mes réservations
        </Link>
      </div>

      {/* Modal confirmation annulation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Réservation annulée</h3>
              {remboursementAmount !== null && remboursementAmount > 0 ? (
                <p className="text-gray-600">
                  Vous avez été remboursé de <span className="font-bold text-green-600">{remboursementAmount} MAD</span>
                </p>
              ) : (
                <p className="text-gray-600">Aucun remboursement n'est applicable</p>
              )}
              <button
                onClick={() => setShowConfirmModal(false)}
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
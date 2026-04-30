// app/[locale]/voyageur/tickets/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Download, Eye, QrCode, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Ticket {
  id: number;
  numeroSiege: string;
  nomPassager: string;
  prenomPassager: string;
  prix: number;
  qrCode: string;
  statut: string;
}

interface Reservation {
  id: number;
  dateReservation: string;
  prixTotal: number;
  statut: string;
  trajet?: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule?: string;
    quaiNumero?: number;
  };
  tickets?: Ticket[];
}

export default function MesTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string ?? 'fr';
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, authLoading, router, locale]);

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/voyageur/reservations');
      setReservations(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (reservationId: number, ticketId: number) => {
    try {
      const response = await apiClient.get(`/voyageur/reservations/${reservationId}/ticket/${ticketId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${ticketId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  const handleViewTicket = (reservation: Reservation, ticket: Ticket) => {
    setSelectedReservation(reservation);
    setSelectedTicket(ticket);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setSelectedReservation(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const allTickets = reservations.flatMap(r => 
    (r.tickets || []).map(ticket => ({ ...ticket, reservation: r }))
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Mes Tickets 🎫</h1>
            <p className="text-blue-100 mt-1 text-sm">Consultez et téléchargez vos billets</p>
          </div>
          <Link
            href={`/${locale}/voyageur/dashboard`}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </div>

      {/* Liste des tickets */}
      {allTickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <p className="text-gray-500">Vous n'avez pas encore de tickets</p>
          <Link
            href={`/${locale}/recherche`}
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Réserver un voyage
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allTickets.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Ticket #{item.id}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.statut === 'ACTIF' ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    {item.statut === 'ACTIF' ? 'Valide' : item.statut}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {item.nomPassager} {item.prenomPassager}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.reservation.trajet?.villeDepart} → {item.reservation.trajet?.villeArrivee}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{item.prix} MAD</p>
                    <p className="text-xs text-gray-400">Siège {item.numeroSiege}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleViewTicket(item.reservation, item)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button
                    onClick={() => handleDownloadTicket(item.reservation.id, item.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour afficher le ticket */}
      {selectedTicket && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Ticket de voyage</h2>
                <button onClick={closeModal} className="text-white/80 hover:text-white">✕</button>
              </div>
            </div>
            
            <div className="p-6">
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-4 rounded-xl">
                  <QrCode className="w-32 h-32 text-gray-600" />
                </div>
              </div>
              
              {/* Infos passager */}
              <div className="border-b pb-3 mb-3">
                <p className="text-sm text-gray-500">Passager</p>
                <p className="font-semibold text-gray-800">
                  {selectedTicket.nomPassager} {selectedTicket.prenomPassager}
                </p>
              </div>
              
              {/* Infos trajet */}
              <div className="border-b pb-3 mb-3">
                <p className="text-sm text-gray-500">Trajet</p>
                <p className="font-semibold text-gray-800">
                  {selectedReservation.trajet?.villeDepart} → {selectedReservation.trajet?.villeArrivee}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedReservation.trajet?.compagnieNom} • Bus {selectedReservation.trajet?.busMatricule}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {selectedReservation.trajet?.dateDepart && new Date(selectedReservation.trajet.dateDepart).toLocaleString('fr-FR')}
                </p>
              </div>
              
              {/* Infos siège */}
              <div className="border-b pb-3 mb-3">
                <p className="text-sm text-gray-500">Siège</p>
                <p className="text-2xl font-bold text-blue-600">{selectedTicket.numeroSiege}</p>
              </div>
              
              {/* Prix */}
              <div className="mb-4">
                <p className="text-sm text-gray-500">Prix</p>
                <p className="text-xl font-bold text-orange-600">{selectedTicket.prix} MAD</p>
              </div>
              
              {/* QR Code text */}
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-xs text-gray-500 text-center break-all">
                  Code: {selectedTicket.qrCode}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => handleDownloadTicket(selectedReservation.id, selectedTicket.id)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger le ticket (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
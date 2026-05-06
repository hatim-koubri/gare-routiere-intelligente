'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Download, QrCode, ArrowLeft, Bus, MapPin, User, Ticket, X, Briefcase, Building } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import QRCode from 'qrcode';
import { useRef } from 'react';

interface TicketItem {
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
    dateArriveePrevue?: string;
  };
  tickets?: TicketItem[];
  bagages?: any[];
}

export default function MesTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (selectedTicket?.qrCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, selectedTicket.qrCode, {
        width: 150,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/fr/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadReservations();
  }, [user]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/voyageur/reservations');
      setReservations(res.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const handleDownload = async (reservationId: number, ticketId: number) => {
    try {
      const res = await apiClient.get(
        `/voyageur/reservations/${reservationId}/ticket/${ticketId}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket_${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erreur téléchargement:', e);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement de vos tickets…</p>
      </div>
    );
  }

  const allTickets = reservations.flatMap(r =>
    (r.tickets || []).map(t => ({ ...t, reservation: r }))
  );

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes tickets</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {allTickets.length} billet{allTickets.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Link
          href="/fr/voyageur/dashboard"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition"
        >
          <ArrowLeft size={16} />
          Retour au tableau de bord
        </Link>
      </div>

      {allTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Ticket size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">Aucun ticket disponible</h3>
          <p className="text-sm text-slate-400 mb-5">Réservez un voyage pour obtenir vos billets électroniques</p>
          <Link
            href="/fr/recherche"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Rechercher un trajet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {allTickets.map((item, idx) => {
            const dateDep = item.reservation.trajet?.dateDepart
              ? new Date(item.reservation.trajet.dateDepart)
              : null;
            const isValid = item.statut === 'ACTIF';
            const isUpcoming = dateDep && dateDep > new Date();

            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* ── Boarding Pass Header ── */}
                <div className={`relative px-5 pt-5 pb-4 ${
                  isValid && isUpcoming
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-600'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700'
                }`}>
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isValid ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' : 'bg-white/10 text-white/60 border border-white/20'
                    }`}>
                      {isValid ? '✓ Valide' : item.statut}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-center">
                      <p className="text-white/60 text-xs">De</p>
                      <p className="text-white font-bold text-lg leading-tight">
                        {item.reservation.trajet?.villeDepart ?? '—'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <Bus size={12} className="text-white" />
                      </div>
                      <div className="flex w-full items-center gap-1">
                        <div className="flex-1 border-t border-dashed border-white/30" />
                        <div className="flex-1 border-t border-dashed border-white/30" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-xs">À</p>
                      <p className="text-white font-bold text-lg leading-tight">
                        {item.reservation.trajet?.villeArrivee ?? '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ticket body */}
                {/* ── Dashed divider ── */}
                <div className="relative flex items-center px-5 py-0">
                  <div className="absolute -left-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-100 my-3" />
                  <div className="absolute -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100" />
                </div>

                <div className="px-5 pb-5">
                  {/* Passenger */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <User size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Passager</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.nomPassager} {item.prenomPassager}
                      </p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-0.5">Siège</p>
                      <p className="font-bold text-blue-600 text-sm">{item.numeroSiege}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-0.5">Prix</p>
                      <p className="font-bold text-slate-800 text-xs">{item.prix} MAD</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 mb-0.5">Quai</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {item.reservation.trajet?.quaiNumero ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* Date/heure */}
                  {dateDep && (
                    <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {dateDep.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        {dateDep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedTicket(item);
                        setSelectedReservation(item.reservation);
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                    >
                      <QrCode size={14} />
                      Voir
                    </button>
                    <button
                      onClick={() => handleDownload(item.reservation.id, item.id)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal détail ticket (Boarding Pass Design) ── */}
      {selectedTicket && selectedReservation && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setSelectedTicket(null); setSelectedReservation(null); }}
        >
          <div
            className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Top Section: Route & Company ── */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative">
              <button
                onClick={() => { setSelectedTicket(null); setSelectedReservation(null); }}
                className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <X size={20} />
              </button>

              <div className="flex justify-between items-center mb-6 pr-8">
                <span className="bg-white/10 text-white/90 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-white/10">
                  TICKET #{selectedTicket.id}
                </span>
                <span className="text-white/60 text-xs font-semibold flex items-center gap-1">
                  <Building size={14} /> {selectedReservation.trajet?.compagnieNom || '—'}
                </span>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">Départ</p>
                  <h2 className="text-3xl font-black leading-none">{selectedReservation.trajet?.villeDepart}</h2>
                  <p className="text-white/70 text-xs mt-2 font-medium">
                    {selectedReservation.trajet?.dateDepart ? new Date(selectedReservation.trajet.dateDepart).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
                <div className="flex flex-col items-center pb-2 px-2">
                  <Bus className="text-orange-500 mb-1" size={20} />
                  <div className="w-10 border-t-2 border-dashed border-white/20"></div>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">Arrivée</p>
                  <h2 className="text-3xl font-black leading-none">{selectedReservation.trajet?.villeArrivee}</h2>
                  <p className="text-white/70 text-xs mt-2 font-medium">
                    {selectedReservation.trajet?.dateArriveePrevue ? new Date(selectedReservation.trajet.dateArriveePrevue).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Perforation Line ── */}
            <div className="relative h-6 bg-white overflow-hidden flex items-center justify-center">
              <div className="absolute w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full -left-3 top-0"></div>
              <div className="w-full border-t-2 border-dashed border-slate-200 mx-4"></div>
              <div className="absolute w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full -right-3 top-0"></div>
            </div>

            {/* ── Passenger & QR Code ── */}
            <div className="px-6 pb-6 pt-1">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Passager</p>
                    <p className="text-base font-black text-slate-800 leading-tight">
                      {selectedTicket.nomPassager} {selectedTicket.prenomPassager}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Siège</p>
                      <p className="text-xl font-black text-orange-600 leading-none">{selectedTicket.numeroSiege}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Bus</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">{selectedReservation.trajet?.busMatricule || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <canvas ref={qrCanvasRef} className="w-20 h-20" />
                  <p className="text-[9px] font-mono text-slate-400 mt-1.5 tracking-wider">
                    {selectedTicket.qrCode || 'N/A'}
                  </p>
                </div>
              </div>

              {/* ── Bagages ── */}
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Briefcase size={16} />
                    <span className="font-bold text-sm">Bagages (Réservation)</span>
                  </div>
                  <span className="bg-orange-100 text-orange-700 font-bold text-[10px] px-2.5 py-1 rounded-md">
                    {selectedReservation.bagages?.length || 0} BAGAGE(S)
                  </span>
                </div>
                {selectedReservation.bagages && selectedReservation.bagages.length > 0 ? (
                  <div className="space-y-2">
                    {selectedReservation.bagages.map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-orange-100/50 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">Bagage {idx + 1} <span className="text-slate-400 font-normal">({b.typeBagage || 'STANDARD'})</span></span>
                          <span className="text-[10px] text-orange-600/80 font-mono mt-0.5 font-bold">ID: {b.id}</span>
                        </div>
                        <span className="font-bold text-slate-800">{b.poidsKg} kg</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500/80 italic font-medium">Aucun bagage déclaré pour cette réservation.</p>
                )}
              </div>

              {/* ── Actions ── */}
              <button
                onClick={() => handleDownload(selectedReservation.id, selectedTicket.id)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
              >
                <Download size={18} />
                Télécharger le billet PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
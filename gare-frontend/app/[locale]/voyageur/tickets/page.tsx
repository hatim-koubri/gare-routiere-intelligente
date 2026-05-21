'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Download, QrCode, ArrowLeft, Bus, MapPin, User, Ticket, X, Briefcase, Building } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import QRCode from 'qrcode';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement de vos tickets…</p>
      </div>
    );
  }

  const allTickets = reservations.flatMap(r =>
    (r.tickets || []).map(t => ({ ...t, reservation: r }))
  );

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mes tickets</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">
            {allTickets.length} billet{allTickets.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Link
          href="/fr/voyageur/dashboard"
          className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 hover:text-orange-500 text-sm font-semibold transition group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour au tableau de bord
        </Link>
      </motion.div>

      {allTickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Ticket size={28} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-zinc-300 mb-2">Aucun ticket disponible</h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mb-5">Réservez un voyage pour obtenir vos billets électroniques</p>
          <Link
            href="/fr/recherche"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            Rechercher un trajet
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {allTickets.map((item, idx) => {
            const dateDep = item.reservation.trajet?.dateDepart
              ? new Date(item.reservation.trajet.dateDepart)
              : null;
            const isValid = item.statut === 'ACTIF';
            const isUpcoming = dateDep && dateDep > new Date();
            const isPastTrip = dateDep && dateDep < new Date() && item.statut === 'ACTIF';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* ── Boarding Pass Header ── */}
                <div className={`relative px-5 pt-5 pb-4 ${
                  isValid && isUpcoming
                    ? 'bg-gradient-to-r from-orange-500 via-orange-500 to-red-500'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700'
                }`}>
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  />
                  <div className="relative">
                    <div className="absolute top-0 right-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isPastTrip ? 'bg-black/20 text-white/70' : isValid ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        {isPastTrip ? 'Voyage passé' : isValid ? '✓ Valide' : item.statut}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-center">
                        <p className="text-white/60 text-xs">De</p>
                        <p className="text-white font-black text-lg leading-tight">
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
                        <p className="text-white font-black text-lg leading-tight">
                          {item.reservation.trajet?.villeArrivee ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket body divider */}
                <div className="relative flex items-center px-5 py-0">
                  <div className="absolute -left-3 w-6 h-6 bg-slate-50 dark:bg-zinc-950 rounded-full border border-slate-100 dark:border-zinc-800" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-100 dark:border-zinc-700 my-3" />
                  <div className="absolute -right-3 w-6 h-6 bg-slate-50 dark:bg-zinc-950 rounded-full border border-slate-100 dark:border-zinc-800" />
                </div>

                <div className="px-5 pb-5">
                  {/* Passenger */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-lg flex items-center justify-center">
                      <User size={15} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">Passager</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {item.nomPassager} {item.prenomPassager}
                      </p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mb-0.5">Siège</p>
                      <p className="font-black text-orange-500 text-sm">{item.numeroSiege}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mb-0.5">Prix</p>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">{item.prix} MAD</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mb-0.5">Quai</p>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {item.reservation.trajet?.quaiNumero ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* Date/heure */}
                  {dateDep && (
                    <div className="flex items-center gap-3 mb-4 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-orange-400" />
                        {dateDep.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-orange-400" />
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
                      className="flex items-center justify-center gap-2 py-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-500/20 transition border border-orange-100 dark:border-orange-500/10"
                    >
                      <QrCode size={14} />
                      Voir QR
                    </button>
                    <button
                      onClick={() => handleDownload(item.reservation.id, item.id)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm shadow-orange-200/50 dark:shadow-none"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal détail ticket ── */}
      <AnimatePresence>
        {selectedTicket && selectedReservation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setSelectedTicket(null); setSelectedReservation(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Top Section ── */}
              <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 p-6 text-white relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
                <button
                  onClick={() => { setSelectedTicket(null); setSelectedReservation(null); }}
                  className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <X size={20} />
                </button>

                <div className="relative flex justify-between items-center mb-6 pr-8">
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-white/20">
                    TICKET #{selectedTicket.id}
                  </span>
                  <span className="text-white/70 text-xs font-semibold flex items-center gap-1">
                    <Building size={14} /> {selectedReservation.trajet?.compagnieNom || '—'}
                  </span>
                </div>

                <div className="relative flex justify-between items-end">
                  <div>
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-wider mb-1">Départ</p>
                    <h2 className="text-3xl font-black leading-none">{selectedReservation.trajet?.villeDepart}</h2>
                    <p className="text-white/70 text-xs mt-2 font-medium">
                      {selectedReservation.trajet?.dateDepart ? new Date(selectedReservation.trajet.dateDepart).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center pb-2 px-2">
                    <Bus className="text-white/80 mb-1" size={20} />
                    <div className="w-10 border-t-2 border-dashed border-white/30"></div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-wider mb-1">Arrivée</p>
                    <h2 className="text-3xl font-black leading-none">{selectedReservation.trajet?.villeArrivee}</h2>
                    <p className="text-white/70 text-xs mt-2 font-medium">
                      {selectedReservation.trajet?.dateArriveePrevue ? new Date(selectedReservation.trajet.dateArriveePrevue).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Perforation Line ── */}
              <div className="relative h-6 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                <div className="absolute w-6 h-6 bg-orange-500/30 rounded-full -left-3" />
                <div className="w-full border-t-2 border-dashed border-slate-200 dark:border-zinc-700 mx-4" />
                <div className="absolute w-6 h-6 bg-orange-500/30 rounded-full -right-3" />
              </div>

              {/* ── Passenger & QR Code ── */}
              <div className="px-6 pb-6 pt-1 bg-white dark:bg-zinc-900">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-0.5">Passager</p>
                      <p className="text-base font-black text-slate-800 dark:text-white leading-tight">
                        {selectedTicket.nomPassager} {selectedTicket.prenomPassager}
                      </p>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-0.5">Siège</p>
                        <p className="text-xl font-black text-orange-500 leading-none">{selectedTicket.numeroSiege}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-0.5">Bus</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mt-1">{selectedReservation.trajet?.busMatricule || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-orange-50 dark:bg-orange-500/10 p-2.5 rounded-2xl border border-orange-100 dark:border-orange-500/20 flex flex-col items-center">
                    <canvas ref={qrCanvasRef} className="w-20 h-20" />
                    <p className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 mt-1.5 tracking-wider">
                      {selectedTicket.qrCode || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* ── Bagages ── */}
                <div className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-4 border border-orange-100 dark:border-orange-500/20 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <Briefcase size={16} />
                      <span className="font-bold text-sm">Bagages</span>
                    </div>
                    <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 font-black text-[10px] px-2.5 py-1 rounded-md">
                      {selectedReservation.bagages?.length || 0} BAGAGE(S)
                    </span>
                  </div>
                  {selectedReservation.bagages && selectedReservation.bagages.length > 0 ? (
                    <div className="space-y-2">
                      {selectedReservation.bagages.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-orange-100/50 dark:border-orange-500/10 pb-1.5 last:border-0 last:pb-0">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 dark:text-zinc-300">Bagage {idx + 1} <span className="text-slate-400 font-normal">({b.typeBagage || 'STANDARD'})</span></span>
                            <span className="text-[10px] text-orange-500 font-mono mt-0.5 font-bold">ID: {b.id}</span>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-white">{b.poidsKg} kg</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 italic font-medium">Aucun bagage déclaré.</p>
                  )}
                </div>

                {/* ── Download ── */}
                <button
                  onClick={() => handleDownload(selectedReservation.id, selectedTicket.id)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition shadow-lg shadow-orange-200/50 dark:shadow-none"
                >
                  <Download size={18} />
                  Télécharger le billet PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// app/[locale]/voyageur/reservations/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Bus, Ticket, 
  Trash2, Edit, RefreshCw, CheckCircle, AlertCircle, Info,
  Download, Package, AlertTriangle, Users, Settings,
  ChevronRight, CreditCard, Sparkles, Building2, QrCode
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
      const data = response.data;
      setRemboursementAmount(data?.montant ?? 0);
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
    const config: Record<string, { color: string; text: string; dot: string; gradient: string }> = {
      CONFIRMEE: { color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10', text: 'Confirmée', dot: 'bg-emerald-500', gradient: 'from-emerald-400 to-teal-500' },
      EN_ATTENTE: { color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10', text: 'En attente', dot: 'bg-amber-500', gradient: 'from-amber-400 to-yellow-500' },
      ANNULEE: { color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10', text: 'Annulée', dot: 'bg-red-500', gradient: 'from-red-400 to-rose-500' },
      REMBOURSEE: { color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10', text: 'Remboursée', dot: 'bg-blue-500', gradient: 'from-blue-400 to-indigo-500' },
    };
    return config[statut] || { color: 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800', text: statut, dot: 'bg-slate-500', gradient: 'from-slate-400 to-zinc-500' };
  };

  const getTicketStatutBadge = (statut: string) => {
    const config: Record<string, { color: string; text: string; dot: string }> = {
      ACTIF: { color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10', text: 'Actif', dot: 'bg-emerald-500' },
      UTILISE: { color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10', text: 'Utilisé', dot: 'bg-orange-500' },
      ANNULE: { color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10', text: 'Annulé', dot: 'bg-red-500' },
      EXPIRE: { color: 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800', text: 'Expiré', dot: 'bg-slate-500' },
    };
    return config[statut] || { color: 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800', text: statut, dot: 'bg-slate-500' };
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
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
          <Link href={`/fr/voyageur/reservations`} className="text-orange-500 hover:underline font-semibold">
            ← Retour à mes réservations
          </Link>
        </div>
      </div>
    );
  }

  if (!reservation) return null;

  const statutBadge = getStatutBadge(reservation.statut);
  const dateDepart = new Date(reservation.trajet.dateDepart);
  const tickets = reservation.tickets || [];
  const isPast = dateDepart < new Date();
  const isUpcoming = !isPast && reservation.statut === 'CONFIRMEE';
  const isMissed = isPast && reservation.statut === 'CONFIRMEE' && tickets.some(t => t.statut === 'ACTIF');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* ═══════════ HEADER ═══════════ */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
        <Link
          href={`/fr/voyageur/reservations`}
          className="group p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-800 transition-all shadow-sm"
        >
          <ArrowLeft size={18} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Détail de la réservation</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">#{reservation.id} · {reservation.trajet.compagnieNom}</p>
        </div>
      </motion.div>

      {/* ═══════════ HERO CARD ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        {/* Hero gradient */}
        <div className={`relative ${isUpcoming ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-red-600' : 'bg-gradient-to-br from-slate-600 via-slate-700 to-zinc-800'} px-6 pt-6 pb-10 overflow-hidden`}>
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                  <Ticket size={10} />
                  Réservation
                </span>
                <span className="text-white/40 text-[10px] font-mono">#{reservation.id}</span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl md:text-2xl font-black text-white drop-shadow-sm">{reservation.trajet.villeDepart}</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronRight size={22} className="text-white/70" />
                </motion.div>
                <span className="text-xl md:text-2xl font-black text-white drop-shadow-sm">{reservation.trajet.villeArrivee}</span>
              </div>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-white drop-shadow-sm">{reservation.prixTotal} <span className="text-sm font-bold text-white/80">MAD</span></p>
            </div>
          </div>
        </div>

        {/* Floating status card */}
        <div className="relative -mt-6 mx-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg shadow-black/5 border border-slate-100 dark:border-zinc-800 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${statutBadge.dot} shadow-sm`} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Statut</p>
                <p className="text-sm font-black text-slate-800 dark:text-white">{statutBadge.text}</p>
              </div>
            </div>
            <motion.div
              animate={isUpcoming ? { rotate: 360 } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={16} className="text-orange-400" />
            </motion.div>
          </div>
        </div>

        {/* Info grid */}
        <div className="px-6 pt-5 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Calendar, label: 'Date départ', value: dateDepart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: Clock, label: 'Heure départ', value: dateDepart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
              { icon: Bus, label: 'Bus', value: reservation.trajet.busMatricule },
              { icon: MapPin, label: 'Quai', value: `Quai ${reservation.trajet.quaiNumero}` },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 hover:border-orange-200 dark:hover:border-orange-800/30 transition-all duration-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 group-hover:border-orange-200 dark:group-hover:border-orange-800/30 transition-colors">
                    <item.icon size={15} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══════════ ALERTS ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {reservation.nbModif > 0 && (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Info size={15} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Cette réservation a été modifiée <strong>{reservation.nbModif} fois</strong>
            </p>
          </div>
        )}

        {isPast && reservation.statut === 'CONFIRMEE' && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isMissed ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/10 border-red-200 dark:border-red-500/20' : 'bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700'}`}>
            <div className={`w-9 h-9 rounded-xl ${isMissed ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-slate-400'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <AlertCircle size={15} className="text-white" />
            </div>
            <p className={`text-sm font-semibold ${isMissed ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-zinc-400'}`}>
              {isMissed
                ? "Ce voyage est déjà passé et vous l'avez raté."
                : 'Ce voyage est déjà passé'}
            </p>
          </div>
        )}
      </motion.div>

      {/* ═══════════ ACTIONS ═══════════ */}
      {isUpcoming && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-white">Actions disponibles</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              ...(canModify() ? [{ href: `/fr/voyageur/reservations/${reservation.id}/modifier`, icon: Edit, label: 'Modifier', gradient: 'from-orange-500 to-red-500' }] : []),
              ...(canChangeSieges() ? [{ href: `/fr/voyageur/reservations/${reservation.id}/changer-sieges`, icon: RefreshCw, label: 'Sièges', gradient: 'from-blue-500 to-indigo-500' }] : []),
              { href: `/fr/voyageur/reservations/${reservation.id}/bagages`, icon: Package, label: 'Acheter bagage', gradient: 'from-violet-500 to-purple-600' },
              { href: `/fr/voyageur/reservations/${reservation.id}/bagages/gerer`, icon: Settings, label: 'Gérer bagages', gradient: 'from-slate-600 to-zinc-700' },
              { href: `/fr/voyageur/reclamations/creer?reservation=${reservation.id}`, icon: AlertTriangle, label: 'Réclamation', gradient: 'from-amber-500 to-orange-600' },
            ].map((action, i) => (
              <Link
                key={action.label}
                href={action.href}
                className="group relative overflow-hidden p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-800/30 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="relative flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon size={17} className="text-white" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                    {action.label}
                  </p>
                </div>
              </Link>
            ))}
            <button
              onClick={handleAnnuler}
              disabled={actionLoading}
              className="group relative overflow-hidden p-4 rounded-2xl border border-red-100 dark:border-red-900/40 hover:border-red-200 dark:hover:border-red-800/30 transition-all duration-300 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <div className="relative flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={17} className="text-white" />
                  )}
                </div>
                <p className="text-[11px] font-bold text-red-500">{actionLoading ? 'Annulation...' : 'Annuler'}</p>
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════ TICKETS ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Ticket size={15} className="text-white" />
          </div>
          <p className="text-sm font-black text-slate-800 dark:text-white">Tickets</p>
          {tickets.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
              {tickets.length}
            </span>
          )}
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Ticket size={28} className="text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="font-semibold text-slate-500 dark:text-zinc-400">Aucun ticket disponible</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Les tickets seront disponibles après confirmation du paiement</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket, idx) => {
              const ticketStatut = getTicketStatutBadge(ticket.statut);
              const StatutIcon = ticket.statut === 'ACTIF' ? CheckCircle : ticket.statut === 'UTILISE' ? Clock : AlertCircle;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + idx * 0.05 }}
                  className="group bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800/30 transition-all duration-300"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Left decorative */}
                      <div className="hidden sm:flex flex-col items-center gap-1.5 pt-1">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${ticket.statut === 'ACTIF' ? 'from-emerald-500 to-teal-600' : ticket.statut === 'UTILISE' ? 'from-orange-500 to-red-500' : 'from-slate-400 to-zinc-500'} flex items-center justify-center shadow-sm`}>
                          <Ticket size={18} className="text-white" />
                        </div>
                        <div className="w-0.5 h-full min-h-[4rem] bg-gradient-to-b from-slate-200 to-transparent dark:from-zinc-700" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-bold text-slate-800 dark:text-white">
                              {ticket.nomPassager} {ticket.prenomPassager}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                                <MapPin size={10} />
                                Siège {ticket.numeroSiege}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                                <CreditCard size={10} />
                                {ticket.prix} MAD
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-sm ${ticketStatut.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ticketStatut.dot}`} />
                              {ticketStatut.text}
                            </span>
                            {ticket.statut === 'ACTIF' && (
                              <button
                                onClick={() => handleDownloadTicket(ticket.id)}
                                disabled={downloadingTicketId === ticket.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                              >
                                {downloadingTicketId === ticket.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Download size={11} /> PDF
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bottom accent */}
                  <div className={`h-1 w-full bg-gradient-to-r ${ticket.statut === 'ACTIF' ? 'from-emerald-500 to-teal-500' : ticket.statut === 'UTILISE' ? 'from-orange-500 to-red-500' : 'from-slate-300 to-zinc-400'}`} />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ═══════════ BACK LINK ═══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pt-2"
      >
        <Link
          href={`/fr/voyageur/reservations`}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Retour à mes réservations
        </Link>
      </motion.div>

      {/* ═══════════ CANCELLATION MODAL ═══════════ */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-14 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white drop-shadow-sm">Réservation annulée</h3>
                </div>
              </div>

              <div className="px-6 py-5 -mt-6">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800 p-5 text-center">
                  {remboursementAmount !== null && remboursementAmount > 0 ? (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">Remboursement en étude</p>
                      <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{remboursementAmount} <span className="text-base font-bold">MAD</span></p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">Le montant sera crédité sous 48h ouvrées</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Info size={22} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">Aucun remboursement applicable</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-200/50 dark:shadow-none"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle, X,
  Luggage, Package, Sparkles, ShoppingBag, CreditCard,
  Shield, Clock, MapPin, Building, Calendar, ChevronRight,
  CheckCircle2, AlertTriangle, Wallet, Ruler, Weight,
  RefreshCw, Info, Loader2, Scan,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function PageParticles() {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 3,
    delay: Math.random() * 8,
    duration: 5 + Math.random() * 7,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-orange-300/20 to-red-400/10 dark:from-orange-500/10 dark:to-red-500/5"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -50 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 30],
            opacity: [0, 0.7, 0],
            scale: [0, 1.4, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function BagageTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  const colors: Record<string, string> = {
    CABINE: 'from-violet-500 to-purple-600 text-white',
    SOUTE: 'from-blue-500 to-cyan-600 text-white',
    SURDIMENSIONNE: 'from-amber-500 to-orange-600 text-white',
  };
  const gradient = colors[type] || 'from-slate-500 to-slate-600 text-white';
  const TypeIcon = type === 'CABINE' ? Briefcase : type === 'SOUTE' ? Luggage : Package;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg',
      `bg-gradient-to-r ${gradient}`
    )}>
      <TypeIcon size={9} />
      {type === 'SURDIMENSIONNE' ? 'Surdim.' : type}
    </span>
  );
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

      if (response.data?.surplusPrix && response.data.surplusPrix > 0) {
        setRefundInfo({ montant: response.data.surplusPrix, motif: 'Remboursement bagage supprimé' });
        setSuccess(`Bagage supprimé avec succès. Demande de remboursement de ${response.data.surplusPrix} MAD créée.`);
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

  const handlePayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      setSuccess('Paiement effectué avec succès');
      setShowPaymentForm(false);
      await loadReservation();
    } catch {
      setPaymentError('Erreur lors du paiement');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Loaders ──
  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-1.5 rounded-full border-2 border-orange-200/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-3 rounded-full border border-orange-400/20"
          />
        </div>
        <div className="text-center">
          <p className="text-slate-400 dark:text-zinc-500 text-sm font-bold tracking-wider uppercase">Chargement</p>
          <p className="text-[10px] text-slate-300 dark:text-zinc-600 mt-1">Récupération de vos bagages...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && !reservation) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="inline-flex flex-col items-center gap-4 p-8 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[3rem] shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-200/50"
          >
            <AlertCircle size={32} className="text-white" />
          </motion.div>
          <p className="text-red-700 dark:text-red-400 text-sm font-bold">{error}</p>
        </motion.div>
        <Link
          href={`/fr/voyageur/reservations/${reservationId}`}
          className="inline-flex items-center gap-2 text-orange-500 font-black text-sm uppercase tracking-wider hover:underline group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
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
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <PageParticles />

      {/* ═══ HERO HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 shadow-2xl shadow-orange-500/25"
      >
        {/* Gradient orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-yellow-300/5 rounded-full blur-3xl" />

        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/30 rounded-full"
              style={{ left: `${10 + i * 16}%`, top: `${8 + (i % 4) * 25}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Animated gradient border */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10"
        />

        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-6">
            <motion.div whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}>
              <Link
                href={`/fr/voyageur/reservations/${reservationId}`}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 transition-all backdrop-blur-md border border-white/15 shadow-lg"
              >
                <ArrowLeft size={20} className="text-white" />
              </Link>
            </motion.div>
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 }}
                className="flex items-center gap-2.5 mb-1.5"
              >
                <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]">RIHLA</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]">Gare Routière</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 }}
                className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm"
              >
                Gérer mes bagages
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="text-sm text-white/70 mt-1 font-medium"
              >
                Supprimez ou gérez vos bagages avant le départ
              </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.22, type: 'spring', stiffness: 250, damping: 15 }}
              whileHover={{ rotate: -10, scale: 1.05 }}
              className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md items-center justify-center border border-white/15 shadow-xl"
            >
              <Luggage size={32} className="text-white" />
            </motion.div>
          </div>
        </div>

        {/* Bottom reflective wave */}
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-black/10 to-transparent" />
      </motion.div>

      {/* ═══ TRIP INFO CARD ═══ */}
      {reservation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', damping: 22 }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-6 group"
        >
          {/* Decorative gradient that follows cursor */}

          <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-orange-400/8 to-red-400/8 rounded-full blur-3xl group-hover:from-orange-400/15 group-hover:to-red-400/15 transition-all duration-700" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-br from-amber-400/8 to-yellow-400/8 rounded-full blur-3xl group-hover:from-amber-400/15 group-hover:to-yellow-400/15 transition-all duration-700" />

          <div className="relative flex items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-400/25"
            >
              <MapPin size={22} className="text-white" />
            </motion.div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {reservation.trajet.villeDepart}
                </span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronRight size={20} className="text-orange-400" />
                </motion.div>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {reservation.trajet.villeArrivee}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-xl text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  <Building size={11} />
                  {reservation.trajet.compagnieNom}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  <Calendar size={11} />
                  {formatDate(reservation.trajet.dateDepart)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ ALERTS ═══ */}
      <AnimatePresence>
        {!canModify && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="flex items-center gap-3.5 p-5 bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200/50 dark:border-amber-800/30 rounded-[1.5rem] shadow-sm"
          >
            <motion.div
              animate={{ rotate: [0, -15, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/20"
            >
              <Clock size={18} className="text-white" />
            </motion.div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Vous ne pouvez plus modifier vos bagages après le départ.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SUCCESS TOAST ═══ */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex items-center gap-3.5 p-5 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-[1.5rem] shadow-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-400/20"
            >
              <CheckCircle size={18} className="text-white" />
            </motion.div>
            <span className="flex-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">{success}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSuccess(null)}
              className="w-8 h-8 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <X size={14} className="text-emerald-600 dark:text-emerald-400" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ERROR TOAST ═══ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex items-center gap-3.5 p-5 bg-gradient-to-r from-red-50/90 to-rose-50/90 dark:from-red-500/10 dark:to-rose-500/10 border border-red-200/50 dark:border-red-800/30 rounded-[1.5rem] shadow-sm"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-400/20"
            >
              <AlertCircle size={18} className="text-white" />
            </motion.div>
            <span className="flex-1 text-sm font-bold text-red-700 dark:text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REFUND INFO CARD ═══ */}
      <AnimatePresence>
        {refundInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22 }}
            className="relative overflow-hidden bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-200/50 dark:border-amber-800/30 rounded-[2rem] p-6 shadow-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-16 -right-16 w-48 h-48 bg-amber-300/20 rounded-full blur-3xl"
            />
            <div className="relative flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-xl shadow-amber-400/25"
              >
                <RefreshCw size={22} className="text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-base font-black text-amber-800 dark:text-amber-300 uppercase tracking-tight">
                  Demande de remboursement
                </h3>
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{refundInfo.motif}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Montant :{' '}
                    <motion.span
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-base font-black text-amber-800 dark:text-amber-300"
                    >
                      {refundInfo.montant} MAD
                    </motion.span>
                    {' '}— en attente de validation
                  </p>
                </div>
                <motion.button
                  whileHover={{ x: 3 }}
                  onClick={() => setRefundInfo(null)}
                  className="mt-3 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 underline-offset-2 hover:underline inline-flex items-center gap-1"
                >
                  <X size={12} />
                  Fermer
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BAGAGES LIST ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, type: 'spring', damping: 20 }}
        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25"
              >
                <Package size={20} className="text-white" />
              </motion.div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Mes bagages</h2>
                <motion.p
                  key={bagages.length}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5"
                >
                  {bagages.length} bagage{bagages.length > 1 ? 's' : ''}
                </motion.p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={`/fr/voyageur/reservations/${reservationId}/bagages`}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
              >
                <Plus size={14} strokeWidth={3} />
                Ajouter
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Empty state */}
        {bagages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-6"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, -8, 0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Luggage size={40} className="text-slate-300 dark:text-zinc-600" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-orange-400/20 rounded-full blur-md"
              />
            </motion.div>
            <p className="text-sm font-black text-slate-400 dark:text-zinc-500">Aucun bagage ajouté</p>
            <p className="text-[10px] text-slate-300 dark:text-zinc-600 mt-1.5 font-medium">
              Ajoutez un bagage avant le départ
            </p>
          </motion.div>
        ) : (
          /* Bagage items */
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {bagages.map((bagage, index) => {
              const typeIcons: Record<string, { icon: typeof Briefcase; color: string; bg: string }> = {
                CABINE: { icon: Briefcase, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/20' },
                SOUTE: { icon: Luggage, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20' },
                SURDIMENSIONNE: { icon: Package, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20' },
              };
              const typeIcon = typeIcons[bagage.typeBagage || ''] || { icon: Luggage, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-500/20' };
              const IconComponent = typeIcon.icon;

              return (
                <motion.div
                  key={bagage.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, type: 'spring', damping: 22, stiffness: 180 }}
                  whileHover={{ backgroundColor: 'rgba(251, 146, 60, 0.03)' }}
                  className="group relative p-6 transition-all duration-300"
                >
                  {/* Hover gradient glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/0 to-red-400/0 group-hover:from-orange-400/[0.02] group-hover:to-red-400/[0.02] transition-all duration-500 pointer-events-none" />
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-orange-400/5 to-red-500/5 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center shadow-lg',
                            typeIcon.bg
                          )}
                        >
                          <IconComponent size={20} className={typeIcon.color} />
                        </motion.div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                              Bagage {bagage.poidsKg}kg
                            </p>
                            <BagageTypeBadge type={bagage.typeBagage} />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
                        <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                          <Ruler size={12} className="text-slate-400 dark:text-zinc-500" />
                          <span className="font-medium">Dimensions:</span>
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{bagage.dimensionCm}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                          <Weight size={12} className="text-slate-400 dark:text-zinc-500" />
                          <span className="font-medium">Poids:</span>
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{bagage.poidsKg} kg</span>
                        </div>
                        {bagage.qrCodeBagage && (
                          <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                            <Scan size={12} className="text-slate-400 dark:text-zinc-500" />
                            <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-[10px]">{bagage.qrCodeBagage}</span>
                          </div>
                        )}
                        {bagage.createdAt && (
                          <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                            <Clock size={12} className="text-slate-400 dark:text-zinc-500" />
                            <span className="font-bold text-slate-700 dark:text-zinc-300">
                              {new Date(bagage.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>

                      {bagage.surplusPrix > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800"
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/15 rounded-xl border border-amber-200/50 dark:border-amber-800/30"
                          >
                            <AlertTriangle size={12} className="text-amber-500" />
                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                              Surcharge: {bagage.surplusPrix} MAD
                            </span>
                          </motion.div>
                        </motion.div>
                      )}
                    </div>

                    {canModify && (
                      <motion.button
                        onClick={() => setShowDeleteConfirm(bagage)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50/80 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shrink-0 shadow-sm"
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                        Supprimer
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ═══ TOTAL SUMMARY ═══ */}
      {bagages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, type: 'spring', damping: 20 }}
          whileHover={{ scale: 1.01 }}
          className={cn(
            'relative overflow-hidden p-6 rounded-[2rem] border shadow-xl',
            totalBagagePrice > 0
              ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 border-amber-400/20 shadow-amber-500/30'
              : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 border-emerald-400/20 shadow-emerald-500/30'
          )}
        >
          {/* Animated glow orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-12 -right-12 w-40 h-40 bg-white/8 rounded-full blur-3xl"
          />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">
                <Info size={10} className="inline mr-1 -mt-0.5" />
                Récapitulatif
              </p>
              <p className="text-white/90 text-sm font-bold">
                {bagages.length} bagage{bagages.length > 1 ? 's' : ''}
              </p>
              <p className="text-white/60 text-[10px] mt-0.5 font-medium">
                {totalBagagePrice > 0 ? 'Surcharge totale applicable' : 'Aucune surcharge'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Total</p>
              <motion.span
                key={totalBagagePrice}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="text-3xl font-black text-white drop-shadow-lg"
              >
                {totalBagagePrice} MAD
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ PAYMENT FORM ═══ */}
      <AnimatePresence>
        {showPaymentForm && totalBagagePrice > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22 }}
            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-6 md:p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-xl shadow-orange-500/25"
              >
                <ShoppingBag size={24} className="text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Paiement des bagages</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  {bagages.length} bagage{bagages.length > 1 ? 's' : ''} · {totalBagagePrice} MAD à payer
                </p>
              </div>
            </div>

            {/* Security badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200/50 dark:border-blue-800/30 rounded-2xl mb-6"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-400/20"
              >
                <Shield size={18} className="text-white" />
              </motion.div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                Paiement sécurisé par chiffrement SSL 256-bit — vos informations bancaires sont protégées.
              </p>
            </motion.div>

            <motion.button
              onClick={handlePayment}
              disabled={paymentLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-4.5 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white rounded-2xl font-black text-sm hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-500/25 overflow-hidden relative group"
            >
              <motion.div
                animate={paymentLoading ? {} : { x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-0"
              />
              {paymentLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Payer {totalBagagePrice} MAD
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-[3rem] border border-slate-100 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
              {/* Background orbs */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-red-400/15 to-rose-500/15 rounded-full blur-3xl"
              />
              <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-full blur-3xl" />

              <div className="relative z-10 p-8">
                {/* RIHLA branding */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="flex items-center justify-center gap-1.5 mb-5"
                >
                  {"RIHLA".split("").map((letter, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ y: 0 }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.08, ease: 'easeInOut' }}
                      className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 select-none"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </motion.div>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.08 }}
                  className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-200/50 dark:shadow-red-900/40"
                >
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Trash2 size={36} className="text-white" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2"
                >
                  Supprimer ce bagage ?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                  className="text-sm text-slate-500 dark:text-zinc-400 text-center mb-1"
                >
                  Bagage de <strong className="text-slate-800 dark:text-white">{showDeleteConfirm.poidsKg}kg</strong>
                </motion.p>

                {/* Refund badge */}
                {showDeleteConfirm.surplusPrix > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-xl border border-amber-200/50 dark:border-amber-800/30 mb-4 mx-auto w-fit"
                  >
                    <RefreshCw size={14} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      Remboursement: {showDeleteConfirm.surplusPrix} MAD
                    </span>
                  </motion.div>
                )}

                {/* Warning */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 mb-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  </motion.div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    La demande de remboursement sera envoyée au responsable de la gare pour confirmation. Cette action est irréversible.
                  </p>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="space-y-3"
                >
                  {deletingId === showDeleteConfirm.id ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                      <Loader2 size={16} className="animate-spin" />
                      Suppression en cours...
                    </motion.div>
                  ) : (
                    <>
                      <motion.button
                        onClick={() => handleDeleteBagage(showDeleteConfirm.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 18, stiffness: 260 }}
                        className="relative w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 overflow-hidden group"
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                        />
                        <span className="relative z-10 flex items-center justify-center gap-2.5">
                          <Trash2 size={14} strokeWidth={2.5} />
                          Confirmer la suppression
                        </span>
                      </motion.button>
                      <motion.button
                        onClick={() => setShowDeleteConfirm(null)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, type: 'spring', damping: 18, stiffness: 260 }}
                        className="w-full py-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                      >
                        <X size={12} className="inline mr-1" />
                        Annuler
                      </motion.button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

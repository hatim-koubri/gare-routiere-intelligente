'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import type { Remboursement } from '@/types';
import {
  ArrowLeft, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Hourglass, XCircle, Wallet, Bus, Calendar,
  Luggage, ChevronDown, ChevronRight, Info, Sparkles,
  Weight, Ruler, Shield, Timer, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

const STATUT_BG: Record<string, string> = {
  EN_ATTENTE: 'from-amber-400 to-orange-500',
  ACCEPTE: 'from-emerald-400 to-teal-500',
  REFUSE: 'from-red-400 to-rose-500',
};

const STATUT_ICON: Record<string, typeof Hourglass> = {
  EN_ATTENTE: Hourglass,
  ACCEPTE: CheckCircle2,
  REFUSE: XCircle,
};

interface MotifBagage {
  id: number;
  type: string;
  poidsKg: number;
  montant: number;
}

function parseMotif(motif: string): MotifBagage[] {
  return motif.split('\n').filter(Boolean).map(line => {
    const idMatch = line.match(/#(\d+)/);
    const typeMatch = line.match(/\((\w+),/);
    const poidsMatch = line.match(/([\d.]+)kg/);
    const montantMatch = line.match(/([\d.]+)\s*MAD/);
    return {
      id: idMatch ? parseInt(idMatch[1]) : 0,
      type: typeMatch ? typeMatch[1] : 'BAGAGE',
      poidsKg: poidsMatch ? parseFloat(poidsMatch[1]) : 0,
      montant: montantMatch ? parseFloat(montantMatch[1]) : 0,
    };
  });
}

const TYPE_COLORS: Record<string, { bg: string; dot: string }> = {
  CABINE: { bg: 'from-violet-500 to-purple-600', dot: 'bg-violet-500' },
  SOUTE: { bg: 'from-blue-500 to-cyan-600', dot: 'bg-blue-500' },
  SURDIMENSIONNE: { bg: 'from-amber-500 to-orange-600', dot: 'bg-amber-500' },
};

function PageParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 3,
    delay: Math.random() * 10,
    duration: 6 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-orange-300/20 to-red-400/10 dark:from-orange-500/10 dark:to-red-500/5"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -60 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 40],
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

function RemboursementCard({ r, index }: { r: Remboursement; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const bagages = parseMotif(r.motif);
  const totalRemb = bagages.reduce((sum, b) => sum + b.montant, 0);
  const StIcon = STATUT_ICON[r.statut] || AlertCircle;
  const stBg = STATUT_BG[r.statut] || 'from-slate-400 to-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', damping: 22, stiffness: 180 }}
      className="group relative overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-200/30 dark:hover:shadow-orange-900/20"
    >
      {/* Hover glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-400/5 to-red-500/5 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative p-6">
        {/* Top row: statut badge + date + montant */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className={cn('w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0', stBg)}
            >
              <StIcon size={20} className="text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm',
                  r.statut === 'EN_ATTENTE' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30' :
                  r.statut === 'ACCEPTE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30' :
                  'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border border-red-200/50 dark:border-red-800/30'
                )}>
                  <StIcon size={10} />
                  {STATUT_LABELS[r.statut] || r.statut}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                  {new Date(r.dateDemande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Demande</span>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest',
                  r.dateTraitement
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 dark:from-emerald-500/10 dark:to-teal-500/10 dark:text-emerald-400'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-400'
                )}>
                  {r.dateTraitement
                    ? `Traité le ${new Date(r.dateTraitement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'En cours'}
                </span>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 + index * 0.05 }}
            className="text-right shrink-0"
          >
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mb-0.5">Montant</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 drop-shadow-sm">
              +{r.montant} MAD
            </p>
          </motion.div>
        </div>

        {/* Bagages list (always visible, first item shown) */}
        {bagages.length > 0 && (
          <div className="space-y-2 mb-4">
            {bagages.slice(0, expanded ? bagages.length : 2).map((b, i) => {
              const tc = TYPE_COLORS[b.type] || { bg: 'from-slate-500 to-slate-600', dot: 'bg-slate-500' };
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="flex items-center justify-between gap-3 py-2.5 px-4 bg-slate-50/80 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 group/item hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-slate-50 dark:ring-offset-zinc-900', tc.dot)} />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg text-white bg-gradient-to-r shadow-sm',
                        tc.bg
                      )}>
                        {b.type === 'SURDIMENSIONNE' ? 'Surdim.' : b.type}
                      </span>
                      <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">#{b.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Weight size={11} />
                        {b.poidsKg} kg
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 shrink-0">
                    +{b.montant} MAD
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Voir détails / Masquer button */}
        {bagages.length > 2 && (
          <motion.button
            onClick={() => setExpanded(!expanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 mx-auto px-5 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-500/20 dark:hover:to-amber-500/20 transition-all border border-orange-200/50 dark:border-orange-800/30 shadow-sm"
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <ChevronDown size={14} />
            </motion.div>
            {expanded ? 'Masquer les détails' : `Voir détails (${bagages.length - 2} de plus)`}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default function MesRemboursementsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/fr/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadRemboursements();
  }, [user]);

  const loadRemboursements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/voyageur/reservations/remboursements');
      const data = response.data;
      setRemboursements(data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRemboursements();
    setRefreshing(false);
  };

  const stats = {
    total: remboursements.length,
    enAttente: remboursements.filter(r => r.statut === 'EN_ATTENTE').length,
    acceptes: remboursements.filter(r => r.statut === 'ACCEPTE').length,
    refuses: remboursements.filter(r => r.statut === 'REFUSE').length,
  };

  const totalMontant = remboursements.reduce((s, r) => s + r.montant, 0);

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
          <p className="text-[10px] text-slate-300 dark:text-zinc-600 mt-1">Récupération de vos remboursements...</p>
        </div>
      </div>
    );
  }

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
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-yellow-300/5 rounded-full blur-3xl" />

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

        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10"
        />

        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-6">
            <motion.div whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}>
              <Link
                href="/fr/voyageur/dashboard"
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
                Mes remboursements
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="text-sm text-white/70 mt-1 font-medium"
              >
                Suivez l&apos;état de vos demandes de remboursement
              </motion.p>
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.05, rotate: refreshing ? 0 : 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 transition-all backdrop-blur-md border border-white/15 shadow-lg shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={20} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-black/10 to-transparent" />
      </motion.div>

      {/* ═══ STATS CARDS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', damping: 22 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total', value: stats.total, color: 'from-orange-500 to-red-500', bg: 'bg-white/90 dark:bg-zinc-900/90 border-slate-100 dark:border-zinc-800', textColor: 'text-slate-900 dark:text-white', valueColor: 'text-slate-900 dark:text-white' },
          { label: 'En attente', value: stats.enAttente, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-800/30', textColor: 'text-amber-700 dark:text-amber-400', valueColor: 'text-amber-600' },
          { label: 'Acceptés', value: stats.acceptes, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-800/30', textColor: 'text-emerald-700 dark:text-emerald-400', valueColor: 'text-emerald-600' },
          { label: 'Refusés', value: stats.refuses, color: 'from-red-400 to-rose-500', bg: 'bg-red-50/90 dark:bg-red-500/10 border-red-200/50 dark:border-red-800/30', textColor: 'text-red-700 dark:text-red-400', valueColor: 'text-red-600' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.06, type: 'spring', damping: 22 }}
            whileHover={{ y: -3, scale: 1.02 }}
            className={cn(
              'relative overflow-hidden rounded-[2rem] p-5 shadow-lg backdrop-blur-xl border transition-all duration-300',
              card.bg
            )}
          >
            <div className={cn('absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br rounded-full blur-2xl opacity-20', card.color)} />
            <p className={cn('text-3xl font-black', card.valueColor)}>{card.value}</p>
            <p className={cn('text-[10px] font-bold uppercase tracking-wider mt-1', card.textColor)}>{card.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Total général */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.16, type: 'spring', damping: 20 }}
        className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-[2rem] p-6 shadow-xl shadow-amber-500/30 border border-amber-400/20"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15"
            >
              <TrendingUp size={22} className="text-white" />
            </motion.div>
            <div>
              <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Montant total des remboursements</p>
              <p className="text-white/70 text-xs mt-0.5">{stats.total} demande{stats.total > 1 ? 's' : ''}</p>
            </div>
          </div>
          <motion.span
            key={totalMontant}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="text-3xl font-black text-white drop-shadow-lg"
          >
            {totalMontant} MAD
          </motion.span>
        </div>
      </motion.div>

      {/* ═══ ERROR ═══ */}
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

      {/* ═══ LIST ═══ */}
      <AnimatePresence mode="wait">
        {remboursements.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-24 px-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-xl"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, -8, 0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Wallet size={40} className="text-slate-300 dark:text-zinc-600" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-orange-400/20 rounded-full blur-md"
              />
            </motion.div>
            <p className="text-sm font-black text-slate-400 dark:text-zinc-500">Aucun remboursement</p>
            <p className="text-[10px] text-slate-300 dark:text-zinc-600 mt-1.5 font-medium text-center max-w-xs">
              Vous n&apos;avez pas encore de demande de remboursement. Les remboursements sont créés automatiquement lors de la suppression de bagages.
            </p>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-4">
            {remboursements.map((r, i) => (
              <RemboursementCard key={r.id} r={r} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

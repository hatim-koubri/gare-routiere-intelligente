'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reclamationApi } from '@/lib/api/voyageur/reclamations';
import { Reclamation, TypeReclamation } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Package, Clock,
  HeadphonesIcon, HelpCircle, Plus,
  ChevronRight, AlertCircle, CheckCircle2,
  XCircle, RefreshCw, MessageSquare, Search,
  Building2, Calendar, Tag, Sparkles,
  Ticket, MapPin
} from 'lucide-react';

const typeConfig: Record<TypeReclamation, {
  label: string; icon: any; color: string; bg: string;
  gradient: string; glow: string; badge: string;
}> = {
  BAGAGE_PERDU: {
    label: 'Bagage perdu', icon: AlertTriangle,
    color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10',
    gradient: 'from-rose-500 to-pink-600', glow: 'shadow-rose-200/50 dark:shadow-rose-800/20',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  },
  BAGAGE_ENDOMMAGE: {
    label: 'Bagage endommagé', icon: Package,
    color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10',
    gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-200/50 dark:shadow-amber-800/20',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
  RETARD: {
    label: 'Retard', icon: Clock,
    color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10',
    gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-200/50 dark:shadow-blue-800/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  },
  SERVICE_CLIENT: {
    label: 'Service client', icon: HeadphonesIcon,
    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10',
    gradient: 'from-orange-500 to-red-500', glow: 'shadow-orange-200/50 dark:shadow-orange-800/20',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  },
  AUTRE: {
    label: 'Autre', icon: HelpCircle,
    color: 'text-slate-600 dark:text-zinc-400', bg: 'bg-slate-50 dark:bg-zinc-800',
    gradient: 'from-slate-500 to-zinc-600', glow: 'shadow-slate-200/50 dark:shadow-zinc-800/20',
    badge: 'bg-slate-100 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300',
  },
};

const statutConfig: Record<string, {
  label: string; icon: any; color: string; dot: string; gradient: string;
}> = {
  OUVERTE: {
    label: 'Ouverte', icon: AlertCircle,
    color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
    dot: 'bg-amber-500', gradient: 'from-amber-400 to-yellow-500',
  },
  EN_COURS: {
    label: 'En cours', icon: RefreshCw,
    color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
    dot: 'bg-blue-500', gradient: 'from-blue-400 to-indigo-500',
  },
  RESOLUE: {
    label: 'Résolue', icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
    dot: 'bg-emerald-500', gradient: 'from-emerald-400 to-teal-500',
  },
  REJETEE: {
    label: 'Rejetée', icon: XCircle,
    color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10',
    dot: 'bg-red-500', gradient: 'from-red-400 to-rose-500',
  },
};

export default function MesReclamationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [selected, setSelected] = useState<Reclamation | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/fr/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reclamationApi.getAll();
      setReclamations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = reclamations.filter(r => {
    if (filterStatut !== 'TOUS' && r.statut !== filterStatut) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.sujet.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mes réclamations</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">Suivez l'état de vos réclamations</p>
        </div>
        <Link
          href="/fr/voyageur/reclamations/creer"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
        >
          <Plus size={16} />
          Nouvelle réclamation
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {/* ── Premium Search ── */}
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-0 pointer-events-none">
            <Search size={16} className="text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une réclamation..."
            className="relative w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-2xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-0 transition-all duration-300 shadow-sm group-hover:shadow-md"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-600 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l8 8M9 1l-8 8" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Premium Filter Select ── */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="relative appearance-none w-full sm:w-auto px-5 py-3 pr-11 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-0 transition-all duration-300 shadow-sm group-hover:shadow-md cursor-pointer min-w-[140px]"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="OUVERTE">Ouverte</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLUE">Résolue</option>
            <option value="REJETEE">Rejetée</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-orange-500 transition-colors duration-300">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5l3 3 3-3" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-12 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 dark:text-zinc-400 font-medium">Aucune réclamation trouvée</p>
          <Link
            href="/fr/voyageur/reclamations/creer"
            className="inline-flex items-center gap-2 mt-4 text-orange-500 text-sm font-bold hover:text-orange-600"
          >
            <Plus size={14} /> Créer une réclamation
          </Link>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} className="space-y-4">
          {filtered.map(r => {
            const tc = typeConfig[r.type];
            const sc = statutConfig[r.statut];
            const StatutIcon = sc.icon;
            const TypeIcon = tc.icon;
            return (
              <motion.button
                key={r.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                onClick={() => setSelected(r)}
                className="group relative w-full text-left bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                {/* Gradient top border */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tc.gradient} opacity-80`} />

                {/* Hover glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${tc.gradient} opacity-0 group-hover:opacity-5 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none`} />

                <div className="relative p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center flex-shrink-0 shadow-lg ${tc.glow} group-hover:scale-110 transition-transform duration-300`}>
                      <TypeIcon size={20} className="text-white" />
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      {/* Top row: type + date */}
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tc.badge}`}>
                          {tc.label}
                        </span>
                        <span className="text-slate-300 dark:text-zinc-600">·</span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(r.dateCreation).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short',
                          })}
                        </span>
                      </div>

                      {/* Sujet */}
                      <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                        {r.sujet}
                      </p>

                      {/* Metadata chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {r.reservationId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                            <Ticket size={10} />
                            #{r.reservationId}
                          </span>
                        )}
                        {r.trajetInfo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 truncate max-w-[180px]">
                            <MapPin size={10} />
                            {r.trajetInfo}
                          </span>
                        )}
                        {r.compagnieNom && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                            <Building2 size={10} />
                            {r.compagnieNom}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: status + arrow */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-sm ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${r.statut === 'EN_COURS' ? 'animate-pulse' : ''}`} />
                        <StatutIcon size={11} />
                        {sc.label}
                      </span>
                      <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                        className="text-slate-300 dark:text-zinc-600 group-hover:text-orange-400 transition-colors duration-200"
                      >
                        <ChevronRight size={18} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {selected && (() => {
          const tc = typeConfig[selected.type];
          const sc = statutConfig[selected.statut];
          const StatutIcon = sc.icon;
          const TypeIcon = tc.icon;
          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* ══════ HERO HEADER ══════ */}
              <div className={`relative bg-gradient-to-br ${tc.gradient} px-6 pt-8 pb-20 overflow-hidden`}>
                {/* Decorative orbs */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-4 right-12 w-16 h-16 bg-white/5 rounded-full blur-xl pointer-events-none" />

                {/* Top row: badge + date */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider">
                    <Tag size={11} />
                    {tc.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-white/80 text-[11px] font-medium">
                    <Calendar size={11} />
                    {new Date(selected.dateCreation).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Icon + Sujet */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10">
                    <TypeIcon size={30} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-xl font-black text-white leading-tight drop-shadow-sm">
                      {selected.sujet}
                    </h3>
                  </div>
                </div>

                {/* Status badge pinned at bottom of hero */}
                <div className="absolute -bottom-5 left-6 right-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-black/10 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${sc.dot} shadow-sm`} />
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Statut</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                          <StatutIcon size={14} className={sc.color.split(' ')[0]} />
                          {sc.label}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles size={16} className="text-orange-400" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* ══════ BODY ══════ */}
              <div className="px-6 pt-8 pb-4 space-y-5">

                {/* Description */}
                <div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2">
                    <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                    Description détaillée
                  </p>
                  <div className="relative p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500 rounded-l-2xl" />
                    <p className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed pl-3">
                      {selected.description}
                    </p>
                  </div>
                </div>

                {/* Metadata cards */}
                {(selected.reservationId || selected.trajetInfo || (selected.compagnieId && selected.compagnieNom)) && (
                  <div>
                    <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2">
                      <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                      Informations
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {selected.reservationId && (
                        <div className="group p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 hover:border-orange-200 dark:hover:border-orange-800/30 transition-all duration-200">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Réservation</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white">#{selected.reservationId}</p>
                        </div>
                      )}
                      {selected.trajetInfo && (
                        <div className="group p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 hover:border-orange-200 dark:hover:border-orange-800/30 transition-all duration-200">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Trajet</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Clock size={13} className="text-orange-400" />
                            {selected.trajetInfo}
                          </p>
                        </div>
                      )}
                      {selected.compagnieId && selected.compagnieNom && (
                        <div className="group p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 hover:border-orange-200 dark:hover:border-orange-800/30 transition-all duration-200">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Compagnie</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Building2 size={13} className="text-orange-400" />
                            {selected.compagnieNom}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Réponse du responsable */}
                {selected.reponseResponsable && (
                  <div>
                    <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2">
                      <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                      Réponse du responsable
                    </p>
                    <div className="relative p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 overflow-hidden">
                      <div className="absolute top-3 right-3 text-orange-200 dark:text-orange-700">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                        </svg>
                      </div>
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <MessageSquare size={14} className="text-white" />
                        </div>
                        <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mt-1">
                          {selected.statut === 'RESOLUE' ? 'Votre réclamation a été résolue' : 'Réponse de notre équipe'}
                        </p>
                      </div>
                      <p className="text-sm text-orange-800 dark:text-orange-300 whitespace-pre-wrap leading-relaxed pl-11">
                        {selected.reponseResponsable}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                    <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                    Chronologie
                  </p>
                  <div className="space-y-0">
                    <div className="flex items-start gap-3 relative pb-4 pl-4 border-l-2 border-emerald-400">
                      <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900 shadow-sm" />
                      <div className="pl-2">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Réclamation créée</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(selected.dateCreation).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {selected.reponseResponsable && (
                      <div className="flex items-start gap-3 relative pb-4 pl-4 border-l-2 border-orange-400">
                        <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-orange-400 border-2 border-white dark:border-zinc-900 shadow-sm" />
                        <div className="pl-2">
                          <p className="text-xs font-bold text-orange-600 dark:text-orange-400">Réponse reçue</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Notre équipe a répondu à votre réclamation</p>
                        </div>
                      </div>
                    )}
                    {selected.statut === 'RESOLUE' && (
                      <div className="flex items-start gap-3 relative pl-4 border-l-2 border-emerald-400">
                        <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900 shadow-sm" />
                        <div className="pl-2">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Résolue</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Votre réclamation a été marquée comme résolue</p>
                        </div>
                      </div>
                    )}
                    {selected.statut === 'REJETEE' && (
                      <div className="flex items-start gap-3 relative pl-4 border-l-2 border-red-400">
                        <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-red-400 border-2 border-white dark:border-zinc-900 shadow-sm" />
                        <div className="pl-2">
                          <p className="text-xs font-bold text-red-600 dark:text-red-400">Rejetée</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Votre réclamation a été rejetée</p>
                        </div>
                      </div>
                    )}
                    {(selected.statut === 'OUVERTE' || selected.statut === 'EN_COURS') && (
                      <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex items-start gap-3 relative pl-4 border-l-2 border-dashed border-slate-300 dark:border-zinc-600"
                      >
                        <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-slate-300 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900" />
                        <div className="pl-2">
                          <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">En attente de traitement</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Notre équipe traite votre réclamation</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* ══════ FOOTER ══════ */}
              <div className="px-6 py-5 border-t border-slate-100 dark:border-zinc-800 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-zinc-900 dark:to-transparent">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-200/50 dark:shadow-none"
                  >
                    Fermer
                  </button>
                  {selected.reclamationId && (
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      #{selected.reclamationId}
                    </span>
                  )}
                </div>
                <p className="text-center text-[10px] text-slate-400 dark:text-zinc-600 mt-3">
                  Réponse garantie sous 48h ouvrées
                </p>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { adminBusApi } from '@/lib/api/admin/bus';
import { apiClient } from '@/lib/api/client';
import { Compagnie } from '@/types';
import { CompagnieCard } from '@/components/ui/compagnie-card';
import { AddCompagnieModal } from '@/components/admin/compagnies/AddCompagnieModal';
import {
  Building2, Search, Plus, LayoutGrid, List,
  Mail, Phone, X, RefreshCw, CheckCircle2, XCircle, UserPlus,
  Users, Shield, Hash, AlertCircle,
  Eye, Sparkles, Loader2, Smartphone,
  AtSign, BadgeCheck, BusFront, Activity
} from 'lucide-react';

interface ResponsableInfo {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type ViewMode = 'cards' | 'table';

const CARD_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-700',
];

const containerVariants = {
  hidden: { opacity: 0 } as const,
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 } as const,
  } as const,
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 } as const,
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 22, stiffness: 180 } as const,
  } as const,
};

export default function CompagniesPage() {
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [busData, setBusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const [showRespModal, setShowRespModal] = useState(false);
  const [respCompagnieId, setRespCompagnieId] = useState<number | null>(null);
  const [respCompagnieNom, setRespCompagnieNom] = useState('');
  const [respNom, setRespNom] = useState('');
  const [respPrenom, setRespPrenom] = useState('');
  const [respEmail, setRespEmail] = useState('');
  const [respPassword, setRespPassword] = useState('');
  const [respTelephone, setRespTelephone] = useState('');
  const [respSending, setRespSending] = useState(false);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoCompagnie, setInfoCompagnie] = useState<Compagnie | null>(null);
  const [infoResponsables, setInfoResponsables] = useState<ResponsableInfo[]>([]);

  useEffect(() => {
    loadCompagnies();
  }, []);

  const loadCompagnies = async () => {
    setLoading(true);
    setError('');
    try {
      const [comp, bus] = await Promise.all([
        adminCompagnieApi.getAll(),
        adminBusApi.getAll().catch(() => []),
      ]);
      setCompagnies(Array.isArray(comp) ? comp : []);
      setBusData(Array.isArray(bus) ? bus : []);
    } catch {
      setError('Impossible de charger les compagnies');
    } finally {
      setLoading(false);
    }
  };

  const openRespModal = (compagnieId: number, compagnieNom: string) => {
    setRespCompagnieId(compagnieId);
    setRespCompagnieNom(compagnieNom);
    setRespNom('');
    setRespPrenom('');
    setRespEmail('');
    setRespPassword('');
    setRespTelephone('');
    setShowRespModal(true);
  };

  const handleAjouterResponsable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respCompagnieId) return;
    setRespSending(true);
    try {
      await adminCompagnieApi.ajouterResponsable(respCompagnieId, {
        nom: respNom, prenom: respPrenom, email: respEmail,
        password: respPassword, telephone: respTelephone || undefined,
      });
      setShowRespModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setRespSending(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await adminCompagnieApi.create(data);
      setShowModal(false);
      loadCompagnies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const openInfoModal = async (compagnie: Compagnie) => {
    setInfoCompagnie(compagnie);
    setShowInfoModal(true);
    setInfoResponsables([]);
    try {
      const res = await apiClient.get(`/admin/compagnies/${compagnie.id}/responsables`, {
        validateStatus: () => true,
      });
      if (res.status === 200 && Array.isArray(res.data)) {
        setInfoResponsables(res.data);
      }
    } catch {
      setInfoResponsables([]);
    }
  };

  const filtered = useMemo(() => {
    return compagnies.filter(c => {
      const matchSearch =
        c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? c.actif :
        !c.actif;
      return matchSearch && matchStatus;
    });
  }, [compagnies, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: compagnies.length,
    actives: compagnies.filter(c => c.actif).length,
    inactives: compagnies.filter(c => !c.actif).length,
  }), [compagnies]);

  const getInitials = (nom: string) =>
    nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">

        {/* ════════════════════════════════════════════
           HERO HEADER
        ════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160 }}
          className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-10 md:p-14"
        >
          {/* Sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 2, 0],
              }}
              transition={{
                duration: 2.5 + i * 0.4,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Gradient orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-[100px]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: 'spring', damping: 18 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building2 size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                    Registre des Flottes
                  </h1>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                    Console de Gestion du Réseau
                  </p>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm mt-4 max-w-lg leading-relaxed"
              >
                Gérez l&apos;ensemble des compagnies partenaires, leurs flottes,
                responsables et accréditations opérationnelles.
              </motion.p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="hidden md:flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/20 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-white/25 transition-all shadow-lg"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus size={16} strokeWidth={3} />
              </div>
              <span>Nouvelle compagnie</span>
            </motion.button>
          </div>

          {/* Quick stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-8 flex-wrap"
          >
            {[
              { icon: Building2, label: 'Enregistrées', value: stats.total },
              { icon: BadgeCheck, label: 'Actives', value: stats.actives },
              { icon: AlertCircle, label: 'Inactives', value: stats.inactives },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <stat.icon size={14} className="text-emerald-200" />
                </div>
                <div>
                  <span className="text-white font-black text-lg">{stat.value}</span>
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider ml-2">{stat.label}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Mobile FAB */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="md:hidden absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center"
          >
            <Plus size={22} className="text-white" />
          </motion.button>
        </motion.div>

        {/* ════════════════════════════════════════════
           KPI CARDS
        ════════════════════════════════════════════ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total compagnies', value: stats.total, icon: Building2, filter: 'all' as StatusFilter, activeColor: 'emerald' },
            { label: 'Actives', value: stats.actives, icon: CheckCircle2, filter: 'active' as StatusFilter, activeColor: 'emerald' },
            { label: 'Inactives', value: stats.inactives, icon: XCircle, filter: 'inactive' as StatusFilter, activeColor: 'rose' },
          ].map((stat, i) => (
            <motion.button
              key={stat.filter}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStatusFilter(stat.filter)}
              className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                statusFilter === stat.filter
                  ? stat.activeColor === 'emerald'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/25'
                  : 'bg-white dark:bg-zinc-800/80 border-slate-100 dark:border-zinc-700/50 hover:border-emerald-200 dark:hover:border-emerald-700/50 shadow-sm'
              }`}
            >
              {statusFilter === stat.filter && (
                <motion.div
                  layoutId="activeKpi"
                  className={`absolute inset-0 ${
                    stat.activeColor === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                      : 'bg-gradient-to-br from-rose-600 to-pink-600'
                  }`}
                />
              )}
              <div className="relative z-10">
                <div className={`flex items-center gap-2 mb-1.5`}>
                  <stat.icon size={15} className={
                    statusFilter === stat.filter
                      ? 'text-white/80'
                      : stat.activeColor === 'emerald' ? 'text-emerald-500' : 'text-rose-400'
                  } />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    statusFilter === stat.filter
                      ? 'text-white/60'
                      : 'text-slate-400 dark:text-zinc-500'
                  }`}>
                    {stat.label}
                  </span>
                </div>
                <motion.span
                  key={stat.value}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className={`text-3xl font-bold ${
                    statusFilter === stat.filter
                      ? 'text-white'
                      : 'text-slate-800 dark:text-zinc-100'
                  }`}
                >
                  {stat.value}
                </motion.span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* ════════════════════════════════════════════
           SEARCH + TOGGLE
        ════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 20 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/30 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1 border border-slate-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2.5 rounded-xl transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </motion.div>

        {/* Result count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xs text-slate-400 dark:text-zinc-500 -mt-3"
        >
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          {searchQuery && <> pour « <span className="font-medium text-slate-600 dark:text-zinc-300">{searchQuery}</span> »</>}
          {statusFilter !== 'all' && <> · Filtre : <span className="font-medium text-slate-600 dark:text-zinc-300">{statusFilter === 'active' ? 'Actives' : 'Inactives'}</span></>}
        </motion.p>

        {/* ════════════════════════════════════════════
           LOADING / ERROR / EMPTY
        ════════════════════════════════════════════ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Chargement des compagnies…</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-8 text-center"
          >
            <AlertCircle size={36} className="text-rose-400 mx-auto mb-3" />
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">{error}</p>
            <button onClick={loadCompagnies} className="mt-4 bg-rose-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-500/25">
              Réessayer
            </button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-16 text-center"
          >
            <Building2 size={44} className="text-slate-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucune compagnie trouvée</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="mt-3 text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">
                Effacer la recherche
              </button>
            )}
          </motion.div>

        /* ════════════════════════════════════════════
           CARDS VIEW
        ════════════════════════════════════════════ */
        ) : viewMode === 'cards' ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.map((c) => (
              <motion.div
                key={c.id}
                variants={itemVariants}
                className="relative group"
              >
                <div onClick={() => openInfoModal(c)} className="cursor-pointer">
                  <CompagnieCard
                    compagnieId={c.id}
                    nom={c.nom}
                    code={c.code}
                    email={c.email}
                    telephone={c.telephone}
                    description={c.description}
                    actif={c.actif}
                    nbBus={busData.filter((b: any) => Number(b.compagnieId) === Number(c.id)).length}
                  />
                </div>
                {/* Responsable overlay button */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openRespModal(c.id, c.nom); }}
                    className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md text-slate-700 dark:text-zinc-300 px-3 py-2 rounded-xl text-[11px] font-bold border border-white/40 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-700/50 shadow-lg transition-all"
                  >
                    <UserPlus size={14} className="inline mr-1" /> Responsable
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

        /* ════════════════════════════════════════════
           TABLE VIEW
        ════════════════════════════════════════════ */
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-100 dark:border-zinc-700">
                    {['Compagnie', 'Code', 'Email', 'Téléphone', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-700/30">
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', damping: 25, stiffness: 200 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className={`w-10 h-10 bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
                          >
                            <span className="text-white text-xs font-bold">{getInitials(c.nom)}</span>
                          </motion.div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{c.nom}</p>
                            {c.description && <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-[180px]">{c.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-zinc-400">{c.email || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-zinc-400">{c.telephone || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          c.actif
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.actif ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                          {c.actif ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openInfoModal(c)}
                            className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg transition"
                          >
                            <Eye size={14} /> Voir infos
                          </button>
                          <button
                            onClick={() => openRespModal(c.id, c.nom)}
                            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg transition"
                          >
                            <UserPlus size={14} /> Responsable
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════
           MODAL CRÉATION (using premium component)
        ════════════════════════════════════════════ */}
        <AddCompagnieModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />

        {/* ════════════════════════════════════════════
           MODAL AJOUT RESPONSABLE — Premium
        ════════════════════════════════════════════ */}
        <AnimatePresence>
          {showRespModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setShowRespModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden"
              >
                {/* Orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"
                />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-cyan-400/10 to-emerald-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="relative z-10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-8 text-white">
                  {/* RIHLA branding */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 }}
                    className="flex items-center gap-1.5 mb-3"
                  >
                    {"RIHLA".split("").map((letter, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ y: 0 }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.08, ease: 'easeInOut' }}
                        className="text-lg font-black tracking-tighter select-none"
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>
                  <div className="flex justify-between items-start">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 }}
                    >
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase">Ajouter Responsable</h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        {respCompagnieNom} · Personnel Authorization
                      </p>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowRespModal(false)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                  <Users size={110} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>

                {/* Form */}
                <form onSubmit={handleAjouterResponsable} className="relative z-10 p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/40 dark:text-emerald-400/50 ml-1">
                        Prénom <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" required placeholder="Jean" value={respPrenom} onChange={e => setRespPrenom(e.target.value)}
                        className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.13 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/40 dark:text-emerald-400/50 ml-1">
                        Nom <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" required placeholder="Dupont" value={respNom} onChange={e => setRespNom(e.target.value)}
                        className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/40 dark:text-emerald-400/50 ml-1">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/20 dark:text-zinc-500" />
                      <input type="email" required placeholder="responsable@compagnie.ma" value={respEmail} onChange={e => setRespEmail(e.target.value)}
                        className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.19 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/40 dark:text-emerald-400/50 ml-1">
                      Mot de passe <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/20 dark:text-zinc-500" />
                      <input type="password" required placeholder="Min. 6 caractères" value={respPassword} onChange={e => setRespPassword(e.target.value)}
                        className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-900/40 dark:text-emerald-400/50 ml-1">Téléphone</label>
                    <div className="relative">
                      <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/20 dark:text-zinc-500" />
                      <input type="text" placeholder="+212 6XX-XXXXXX" value={respTelephone} onChange={e => setRespTelephone(e.target.value)}
                        className="w-full bg-emerald-50/50 dark:bg-zinc-800/80 border border-emerald-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-emerald-950 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-950/10 dark:focus:ring-emerald-400/20 focus:border-emerald-600/30 dark:focus:border-emerald-500/30 outline-none transition-all placeholder:text-emerald-900/20 dark:placeholder:text-zinc-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-3 pt-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit" disabled={respSending}
                      className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-[0_15px_35px_rgba(6,78,59,0.25)] hover:shadow-[0_20px_40px_rgba(6,78,59,0.35)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      {respSending ? (
                        <><Loader2 size={18} className="animate-spin" /> Ajout en cours...</>
                      ) : (
                        <><UserPlus size={18} /> Ajouter le responsable</>
                      )}
                    </motion.button>
                    <button type="button" onClick={() => setShowRespModal(false)}
                      className="px-8 bg-emerald-50 dark:bg-zinc-800 text-emerald-800/40 dark:text-zinc-400 font-bold py-4 rounded-2xl hover:bg-emerald-100/50 dark:hover:bg-zinc-700 hover:text-emerald-900 dark:hover:text-zinc-200 transition-all text-sm">
                      Annuler
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════
           MODAL INFOS — Premium
        ════════════════════════════════════════════ */}
        <AnimatePresence>
          {showInfoModal && infoCompagnie && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setShowInfoModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
              >
                {/* Orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"
                />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-cyan-400/10 to-emerald-500/10 rounded-full blur-3xl" />

                {/* Header with RIHLA branding */}
                <div className="relative z-10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-8 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 }}
                    className="flex items-center gap-1.5 mb-3"
                  >
                    {"RIHLA".split("").map((letter, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ y: 0 }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.08, ease: 'easeInOut' }}
                        className="text-lg font-black tracking-tighter select-none"
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>

                  <div className="flex justify-between items-start">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <Building2 size={28} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase">{infoCompagnie.nom}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-lg">
                            {infoCompagnie.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            infoCompagnie.actif
                              ? 'bg-emerald-400/20 text-emerald-200'
                              : 'bg-zinc-400/20 text-zinc-200'
                          }`}>
                            {infoCompagnie.actif ? '● Active' : '○ Inactive'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowInfoModal(false)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>

                  {/* Quick stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="flex items-center gap-4 mt-5 flex-wrap"
                  >
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
                      <BusFront size={14} className="text-emerald-200" />
                      <span className="text-sm font-bold">{busData.filter((b: any) => Number(b.compagnieId) === Number(infoCompagnie.id)).length}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">Bus</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
                      <Hash size={14} className="text-emerald-200" />
                      <span className="text-sm font-bold">#{infoCompagnie.id}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">ID</span>
                    </div>
                  </motion.div>

                  {infoCompagnie.description && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-white/70 text-sm mt-4 leading-relaxed max-w-lg"
                    >
                      {infoCompagnie.description}
                    </motion.p>
                  )}
                </div>

                {/* Body */}
                <div className="relative z-10 p-8 space-y-6">
                  {/* Contact */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-900/40 dark:text-emerald-400/50 mb-3 flex items-center gap-2">
                      <Mail size={14} className="text-emerald-500/60" />
                      Coordonnées & Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: Mail, label: 'Email', value: infoCompagnie.email || 'Non renseigné', highlight: !!infoCompagnie.email },
                        { icon: Phone, label: 'Téléphone', value: infoCompagnie.telephone || 'Non renseigné', highlight: !!infoCompagnie.telephone },
                        { icon: Shield, label: 'Statut', value: infoCompagnie.actif ? 'Actif — Autorisation accordée' : 'Inactif', highlight: true },
                        { icon: Activity, label: 'Bus associés', value: `${busData.filter((b: any) => Number(b.compagnieId) === Number(infoCompagnie.id)).length} véhicule(s)`, highlight: true },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 + i * 0.04 }}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-zinc-800/60 border border-emerald-900/5 dark:border-zinc-700/30"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                            <item.icon size={16} className="text-emerald-700 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/40 dark:text-emerald-400/50">{item.label}</p>
                            <p className={`text-sm font-bold truncate ${item.highlight ? 'text-emerald-950 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'}`}>{item.value}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Responsables */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-900/40 dark:text-emerald-400/50 flex items-center gap-2">
                        <Users size={14} className="text-emerald-500/60" />
                        Responsables
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowInfoModal(false);
                          setTimeout(() => openRespModal(infoCompagnie.id, infoCompagnie.nom), 300);
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-all flex items-center gap-1.5"
                      >
                        <UserPlus size={13} /> Ajouter
                      </motion.button>
                    </div>

                    {infoResponsables.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700">
                        <Users size={32} className="text-slate-200 dark:text-zinc-600 mx-auto mb-2" />
                        <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Aucun responsable assigné</p>
                        <p className="text-xs text-slate-300 dark:text-zinc-600 mt-1">Ajoutez-en via le bouton ci-dessus</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {infoResponsables.map((resp, i) => (
                          <motion.div
                            key={resp.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 dark:bg-zinc-800/60 border border-emerald-900/5 dark:border-zinc-700/30 hover:bg-emerald-100/50 dark:hover:bg-zinc-800 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {resp.prenom?.[0]?.toUpperCase()}{resp.nom?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-zinc-100 text-sm">{resp.prenom} {resp.nom}</p>
                                <p className="text-xs text-slate-400 dark:text-zinc-500">{resp.email}</p>
                              </div>
                            </div>
                            {resp.telephone && (
                              <span className="text-xs text-slate-400 dark:text-zinc-500">{resp.telephone}</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Footer */}
                <div className="relative z-10 px-8 pb-8">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInfoModal(false)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold text-sm shadow-lg hover:shadow-[0_15px_35px_rgba(6,78,59,0.25)] transition-all"
                  >
                    Fermer
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts';
import {
  Plus, X, Search, Megaphone, Calendar, Building2,
  CheckCircle2, XCircle, Loader2, AlertCircle, Sparkles,
  Clock, Hash, Users, Globe
} from 'lucide-react';

const COLORS = ['#7c3aed', '#0891b2', '#059669', '#f59e0b', '#dc2626', '#0d9488'];

interface Annonce {
  id: number;
  titreFr: string;
  titreAr?: string;
  contenuFr: string;
  contenuAr?: string;
  dateDebut?: string;
  dateFin?: string;
  active: boolean;
  compagnieId?: number;
}

interface Compagnie {
  id: number;
  nom: string;
}

const containerVariants = {
  hidden: { opacity: 0 } as const,
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 } as const,
  } as const,
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 } as const,
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, damping: 22, stiffness: 180 } as const,
  } as const,
};

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    titreFr: '', titreAr: '', contenuFr: '', contenuAr: '',
    dateDebut: '', dateFin: '', compagnieId: 0,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annoncesData, compagniesData] = await Promise.all([
        adminPromotionApi.getAnnonces(),
        adminCompagnieApi.getAll(),
      ]);
      setAnnonces(annoncesData);
      setCompagnies(compagniesData);
    } catch { console.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const filteredAnnonces = annonces.filter(a =>
    a.titreFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.titreAr && a.titreAr.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminPromotionApi.createAnnonce({ ...formData, compagnieId: formData.compagnieId || undefined });
      setShowModal(false);
      setFormData({ titreFr: '', titreAr: '', contenuFr: '', contenuAr: '', dateDebut: '', dateFin: '', compagnieId: 0 });
      loadData();
    } catch { alert('Erreur lors de la création'); }
  };

  const handleDesactiver = async (id: number) => {
    if (confirm('Désactiver cette annonce ?')) {
      await adminPromotionApi.desactiverAnnonce(id);
      loadData();
    }
  };

  const stats = useMemo(() => ({
    total: annonces.length,
    actives: annonces.filter(a => a.active).length,
    inactives: annonces.filter(a => !a.active).length,
  }), [annonces]);

  const annoncesByCompagnie = [
    { name: 'Global', annonces: annonces.filter(a => !a.compagnieId || a.compagnieId === 0).length },
    ...compagnies.map(c => ({
      name: c.nom,
      annonces: annonces.filter(a => Number(a.compagnieId) === Number(c.id)).length,
    }))
  ];

  const statutData = [
    { name: 'Actives', value: stats.actives, color: '#7c3aed' },
    { name: 'Désactivées', value: stats.inactives, color: '#94a3b8' },
  ];

  const getCompagnieName = (id?: number) =>
    id ? compagnies.find(c => c.id === id)?.nom || '—' : 'Globale';

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">

        {/* ═══ HERO HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160 }}
          className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-violet-700 via-violet-600 to-purple-600 p-10 md:p-14"
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
              style={{ top: `${10 + Math.random() * 80}%`, left: `${10 + Math.random() * 80}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            />
          ))}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-400/20 rounded-full blur-[100px]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: 'spring', damping: 18 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Megaphone size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                    Annonces
                  </h1>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                    Console de Communication
                  </p>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm mt-4 max-w-lg leading-relaxed"
              >
                Gérez l&apos;ensemble des annonces publiques et diffusion d&apos;informations aux voyageurs.
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
              <span>Nouvelle annonce</span>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-8 flex-wrap"
          >
            {[
              { icon: Megaphone, label: 'Total', value: stats.total },
              { icon: CheckCircle2, label: 'Actives', value: stats.actives },
              { icon: XCircle, label: 'Désactivées', value: stats.inactives },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <s.icon size={14} className="text-violet-200" />
                </div>
                <div>
                  <span className="text-white font-black text-lg">{s.value}</span>
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider ml-2">{s.label}</span>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="md:hidden absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center"
          >
            <Plus size={22} className="text-white" />
          </motion.button>
        </motion.div>

        {/* ═══ STATS KPI ═══ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total annonces', value: stats.total, icon: Megaphone, filter: 'all', color: 'violet' },
            { label: 'Actives', value: stats.actives, icon: CheckCircle2, filter: 'active', color: 'violet' },
            { label: 'Désactivées', value: stats.inactives, icon: XCircle, filter: 'inactive', color: 'slate' },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon size={15} className={s.color === 'violet' ? 'text-violet-500' : 'text-slate-400'} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{s.label}</span>
              </div>
              <motion.span
                key={s.value}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="text-3xl font-bold text-slate-800 dark:text-zinc-100"
              >
                {s.value}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ CHARTS ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5">
            <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-4">Annonces par compagnie</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={annoncesByCompagnie} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f5f3ff' }} />
                <Bar dataKey="annonces" name="Annonces" radius={[6, 6, 0, 0]}>
                  {annoncesByCompagnie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5">
            <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-4">Actives vs Désactivées</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={statutData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {statutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {statutData.map(d => (
                  <div key={d.name}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-500 dark:text-zinc-400">{d.name}</span>
                    </div>
                    <p className="text-3xl font-bold ml-5" style={{ color: d.color }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ SEARCH ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', damping: 20 }}
          className="relative"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher une annonce…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 dark:focus:ring-violet-400/30 focus:border-violet-500 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </motion.div>

        {/* ═══ RESULTS ═══ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Chargement des annonces…</p>
          </div>
        ) : filteredAnnonces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-16 text-center"
          >
            <Megaphone size={44} className="text-slate-200 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucune annonce trouvée</p>
          </motion.div>
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
                    {['Titre', 'Contenu', 'Début', 'Fin', 'Compagnie', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-700/30">
                  {filteredAnnonces.map((a, i) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', damping: 25, stiffness: 200 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{a.titreFr}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-zinc-400 max-w-xs truncate">{a.contenuFr}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-zinc-400">{formatDate(a.dateDebut)}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-zinc-400">{formatDate(a.dateFin)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">{getCompagnieName(a.compagnieId)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          a.active
                            ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800/30'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-violet-500' : 'bg-slate-400'}`} />
                          {a.active ? 'Active' : 'Désactivée'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {a.active && (
                          <button onClick={() => handleDesactiver(a.id)}
                            className="text-[11px] font-medium text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-all">
                            Désactiver
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══ MODAL CRÉATION ═══ */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                {/* Orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-violet-400/20 to-purple-500/20 rounded-full blur-3xl"
                />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-pink-400/10 to-violet-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="relative z-10 bg-gradient-to-br from-violet-800 via-violet-700 to-purple-700 p-8 text-white">
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
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase">Nouvelle Annonce</h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Publication & Diffusion</p>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowModal(false)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                  <Megaphone size={110} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="relative z-10 p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-900/40 dark:text-violet-400/50 ml-1">
                        Titre (Français) <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" required value={formData.titreFr}
                        onChange={e => setFormData({ ...formData, titreFr: e.target.value })}
                        className="w-full bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-violet-950 dark:text-zinc-100 focus:ring-4 focus:ring-violet-950/10 dark:focus:ring-violet-400/20 focus:border-violet-600/30 outline-none transition-all placeholder:text-violet-900/20 dark:placeholder:text-zinc-500" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.13 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-900/40 dark:text-violet-400/50 ml-1">
                        Titre (Arabe)
                      </label>
                      <input type="text" dir="rtl" value={formData.titreAr}
                        onChange={e => setFormData({ ...formData, titreAr: e.target.value })}
                        className="w-full bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-violet-950 dark:text-zinc-100 text-right focus:ring-4 focus:ring-violet-950/10 dark:focus:ring-violet-400/20 outline-none transition-all placeholder:text-violet-900/20" />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.16 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-900/40 dark:text-violet-400/50 ml-1">
                        Contenu (Français) <span className="text-rose-500">*</span>
                      </label>
                      <textarea required rows={3} value={formData.contenuFr}
                        onChange={e => setFormData({ ...formData, contenuFr: e.target.value })}
                        className="w-full bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-violet-950 dark:text-zinc-100 focus:ring-4 focus:ring-violet-950/10 dark:focus:ring-violet-400/20 focus:border-violet-600/30 outline-none transition-all resize-none placeholder:text-violet-900/20 dark:placeholder:text-zinc-500" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.19 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-900/40 dark:text-violet-400/50 ml-1">
                        Contenu (Arabe)
                      </label>
                      <textarea dir="rtl" rows={3} value={formData.contenuAr}
                        onChange={e => setFormData({ ...formData, contenuAr: e.target.value })}
                        className="w-full bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-violet-950 dark:text-zinc-100 text-right focus:ring-4 focus:ring-violet-950/10 dark:focus:ring-violet-400/20 outline-none transition-all resize-none placeholder:text-violet-900/20" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-900/40 dark:text-violet-400/50 ml-1">Date début</label>
                      <input type="datetime-local" value={formData.dateDebut}
                        onChange={e => setFormData({ ...formData, dateDebut: e.target.value })}
                        className="w-full bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-violet-950 dark:text-zinc-100 focus:ring-4 focus:ring-violet-950/10 dark:focus:ring-violet-400/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-900/40 dark:text-violet-400/50 ml-1">Date fin</label>
                      <input type="datetime-local" value={formData.dateFin}
                        onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
                        className="w-full bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-violet-950 dark:text-zinc-100 focus:ring-4 focus:ring-violet-950/10 dark:focus:ring-violet-400/20 outline-none transition-all" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-900/40 dark:text-violet-400/50 ml-1">Compagnie</label>
                    <select value={formData.compagnieId}
                      onChange={e => setFormData({ ...formData, compagnieId: parseInt(e.target.value) })}
                      className="w-full bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-violet-950 dark:text-zinc-100 focus:ring-4 focus:ring-violet-950/10 dark:focus:ring-violet-400/20 outline-none transition-all">
                      <option value={0}>Toutes les compagnies</option>
                      {compagnies.map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className="flex gap-3 pt-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-violet-700 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_15px_35px_rgba(109,40,217,0.25)] hover:shadow-[0_20px_40px_rgba(109,40,217,0.35)] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 size={18} /> Publier l&apos;annonce
                    </motion.button>
                    <button type="button" onClick={() => setShowModal(false)}
                      className="px-8 bg-violet-50 dark:bg-zinc-800 text-violet-800/40 dark:text-zinc-400 font-bold py-4 rounded-2xl hover:bg-violet-100/50 dark:hover:bg-zinc-700 hover:text-violet-900 dark:hover:text-zinc-200 transition-all text-sm">
                      Annuler
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}

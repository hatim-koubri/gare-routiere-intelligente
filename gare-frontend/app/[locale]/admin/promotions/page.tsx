'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { CodePromo, Compagnie, TarificationConfig } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts';
import {
  Plus, X, Tag, Search, Percent, Calendar, Building2,
  CheckCircle2, XCircle, Loader2, Sparkles, Clock, Hash, Users
} from 'lucide-react';

const COLORS = ['#f59e0b', '#0891b2', '#059669', '#7c3aed', '#dc2626', '#0d9488'];

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

export default function PromotionsPage() {
  const [promos, setPromos] = useState<CodePromo[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'promos' | 'tarification'>('promos');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    pourcentageReduction: 0,
    dateExpiration: '',
    nbUtilisationsMax: '',
    compagnieId: 0,
  });
  const [tarifConfig, setTarifConfig] = useState<TarificationConfig>({
    reductionTrenteJours: 20,
    reductionQuinzeJours: 10,
    supplementJourMeme: 10,
    seuilHaut: 80,
    supplementHaut: 15,
    seuilBas: 30,
    reductionBas: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promosData, compagniesData] = await Promise.all([
        adminPromotionApi.getPromos(),
        adminCompagnieApi.getAll(),
      ]);
      setPromos(Array.isArray(promosData) ? promosData : []);
      setCompagnies(Array.isArray(compagniesData) ? compagniesData : []);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminPromotionApi.createPromo({
        code: formData.code,
        pourcentageReduction: formData.pourcentageReduction,
        dateExpiration: formData.dateExpiration,
        nbUtilisationsMax: formData.nbUtilisationsMax ? parseInt(formData.nbUtilisationsMax) : undefined,
        compagnieId: formData.compagnieId || undefined,
      });
      setShowModal(false);
      setFormData({ code: '', pourcentageReduction: 0, dateExpiration: '', nbUtilisationsMax: '', compagnieId: 0 });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDesactiver = async (id: number) => {
    if (confirm('Désactiver ce code promo ?')) {
      await adminPromotionApi.desactiverPromo(id);
      loadData();
    }
  };

  const handleConfigurerTarification = async () => {
    try {
      await adminPromotionApi.configurerTarification(tarifConfig);
      alert('Configuration sauvegardée');
    } catch (error) {
      console.error('Erreur configuration', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const filteredPromos = promos.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (compagnies.find(c => c.id === p.compagnieId)?.nom || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: promos.length,
    actifs: promos.filter(p => p.actif && new Date(p.dateExpiration) > new Date()).length,
    expires: promos.filter(p => !p.actif || new Date(p.dateExpiration) <= new Date()).length,
  }), [promos]);

  const promosByCompagnie = [
    { name: 'Global', promos: promos.filter(p => !p.compagnieId || p.compagnieId === 0).length },
    ...compagnies.map(c => ({
      name: c.nom,
      promos: promos.filter(p => Number(p.compagnieId) === Number(c.id)).length,
    }))
  ];

  const now = new Date();
  const statutData = [
    { name: 'Actifs', value: stats.actifs, color: '#f59e0b' },
    { name: 'Expirés/Désactivés', value: stats.expires, color: '#94a3b8' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">

        {/* ═══ HERO HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160 }}
          className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-600 p-10 md:p-14"
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
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-400/20 rounded-full blur-[100px]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: 'spring', damping: 18 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Tag size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                    Promotions
                  </h1>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                    Console Tarifaire & Codes Promo
                  </p>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm mt-4 max-w-lg leading-relaxed"
              >
                Gérez les codes promotionnels et la tarification dynamique des réservations.
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
              <span>Nouveau code promo</span>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-8 flex-wrap"
          >
            {[
              { icon: Tag, label: 'Total', value: stats.total },
              { icon: CheckCircle2, label: 'Actifs', value: stats.actifs },
              { icon: XCircle, label: 'Expirés', value: stats.expires },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <s.icon size={14} className="text-amber-200" />
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
            { label: 'Total codes promo', value: stats.total, icon: Tag, color: 'amber' },
            { label: 'Actifs', value: stats.actifs, icon: CheckCircle2, color: 'amber' },
            { label: 'Expirés/Désactivés', value: stats.expires, icon: XCircle, color: 'slate' },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon size={15} className={s.color === 'amber' ? 'text-amber-500' : 'text-slate-400'} />
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
        {activeTab === 'promos' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5">
              <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-4">Codes promo par compagnie</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={promosByCompagnie} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#fffbeb' }} />
                  <Bar dataKey="promos" name="Codes" radius={[6, 6, 0, 0]}>
                    {promosByCompagnie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5">
              <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-4">Actifs vs Expirés</p>
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
        )}

        {/* ═══ TABS ═══ */}
        <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl w-fit border border-slate-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'promos'
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            Codes Promo
          </button>
          <button
            onClick={() => setActiveTab('tarification')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'tarification'
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            Tarification
          </button>
        </div>

        {/* ═══ SEARCH (promos tab) ═══ */}
        {activeTab === 'promos' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative"
          >
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher un code promo…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/30 focus:border-amber-500 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </motion.div>
        )}

        {/* ═══ PROMOS TABLE ═══ */}
        {activeTab === 'promos' && (
          loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">Chargement des promotions…</p>
            </div>
          ) : filteredPromos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-16 text-center"
            >
              <Tag size={44} className="text-slate-200 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucun code promo trouvé</p>
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
                      {['Code', 'Réduction', 'Expiration', 'Utilisations', 'Compagnie', 'Statut', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-700/30">
                    {filteredPromos.map((promo, i) => {
                      const expired = new Date(promo.dateExpiration) <= new Date();
                      return (
                        <motion.tr
                          key={promo.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, type: 'spring', damping: 25, stiffness: 200 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-zinc-700/30 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-800/30">
                              {promo.code}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{promo.pourcentageReduction}%</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-400">{new Date(promo.dateExpiration).toLocaleDateString('fr-FR')}</td>
                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-400">{promo.nbUtilisationsActuel} / {promo.nbUtilisationsMax || '∞'}</td>
                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-400">{compagnies.find(c => c.id === promo.compagnieId)?.nom || 'Toutes'}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                              promo.actif && !expired
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${promo.actif && !expired ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                              {promo.actif && !expired ? 'Actif' : expired ? 'Expiré' : 'Désactivé'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {promo.actif && (
                              <button onClick={() => handleDesactiver(promo.id)}
                                className="text-[11px] font-medium text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-all">
                                Désactiver
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )
        )}

        {/* ═══ TARIFICATION ═══ */}
        {activeTab === 'tarification' && (
          <div className="space-y-5">
            {/* Bloc 1 - Délai de réservation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-700/50 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center">
                  <Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm">Tarification par délai de réservation</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Réductions automatiques selon l'anticipation</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">30 jours à l'avance</p>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">-{tarifConfig.reductionTrenteJours}%</span>
                  </div>
                  <p className="text-xs text-emerald-600/70 mb-4">Réservation très anticipée</p>
                  <input type="range" min={0} max={50} step={1}
                    value={tarifConfig.reductionTrenteJours}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, reductionTrenteJours: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-emerald-500 mt-1"><span>0%</span><span>50%</span></div>
                </div>
                <div className="bg-teal-50 dark:bg-teal-950/30 rounded-2xl p-5 border border-teal-100 dark:border-teal-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">15 jours à l'avance</p>
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400">-{tarifConfig.reductionQuinzeJours}%</span>
                  </div>
                  <p className="text-xs text-teal-600/70 mb-4">Réservation anticipée</p>
                  <input type="range" min={0} max={50} step={1}
                    value={tarifConfig.reductionQuinzeJours}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, reductionQuinzeJours: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-teal-500 mt-1"><span>0%</span><span>50%</span></div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-5 border border-rose-100 dark:border-rose-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Jour même</p>
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">+{tarifConfig.supplementJourMeme}%</span>
                  </div>
                  <p className="text-xs text-rose-600/70 mb-4">Supplément last minute</p>
                  <input type="range" min={0} max={50} step={1}
                    value={tarifConfig.supplementJourMeme}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, supplementJourMeme: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-rose-400 mt-1"><span>0%</span><span>50%</span></div>
                </div>
              </div>
            </motion.div>

            {/* Bloc 2 - Smart Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-700/50 flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center">
                  <Percent size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm">Smart Pricing — Taux de remplissage</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Ajustement dynamique selon l'occupation du bus</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Bus très rempli</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-amber-700 dark:text-amber-400 font-medium">Seuil déclencheur</label>
                      <span className="text-sm font-black text-amber-700 dark:text-amber-400">{tarifConfig.seuilHaut}% occ.</span>
                    </div>
                    <input type="range" min={50} max={100} step={1}
                      value={tarifConfig.seuilHaut}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, seuilHaut: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-amber-400 mt-1"><span>50%</span><span>100%</span></div>
                  </div>
                  <div className="pt-2 border-t border-amber-100 dark:border-amber-800/30">
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-amber-700 dark:text-amber-400 font-medium">Supplément appliqué</label>
                      <span className="text-sm font-black text-amber-700 dark:text-amber-400">+{tarifConfig.supplementHaut}%</span>
                    </div>
                    <input type="range" min={0} max={50} step={1}
                      value={tarifConfig.supplementHaut}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, supplementHaut: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-amber-400 mt-1"><span>0%</span><span>50%</span></div>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-bold">📈</span> Si remplissage ≥ <strong>{tarifConfig.seuilHaut}%</strong> → prix +<strong>{tarifConfig.supplementHaut}%</strong>
                  </div>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-950/30 rounded-2xl p-5 border border-cyan-100 dark:border-cyan-800/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                    <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Bus peu rempli</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-cyan-700 dark:text-cyan-400 font-medium">Seuil déclencheur</label>
                      <span className="text-sm font-black text-cyan-700 dark:text-cyan-400">{tarifConfig.seuilBas}% occ.</span>
                    </div>
                    <input type="range" min={0} max={50} step={1}
                      value={tarifConfig.seuilBas}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, seuilBas: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-cyan-400 mt-1"><span>0%</span><span>50%</span></div>
                  </div>
                  <div className="pt-2 border-t border-cyan-100 dark:border-cyan-800/30">
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-cyan-700 dark:text-cyan-400 font-medium">Réduction appliquée</label>
                      <span className="text-sm font-black text-cyan-700 dark:text-cyan-400">-{tarifConfig.reductionBas}%</span>
                    </div>
                    <input type="range" min={0} max={50} step={1}
                      value={tarifConfig.reductionBas}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, reductionBas: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-cyan-400 mt-1"><span>0%</span><span>50%</span></div>
                  </div>
                  <div className="bg-cyan-100 dark:bg-cyan-900/30 rounded-xl p-3 text-xs text-cyan-700 dark:text-cyan-300">
                    <span className="font-bold">📉</span> Si remplissage ≤ <strong>{tarifConfig.seuilBas}%</strong> → prix -<strong>{tarifConfig.reductionBas}%</strong>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-end"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConfigurerTarification}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-sm"
              >
                <CheckCircle2 size={18} /> Sauvegarder la configuration
              </motion.button>
            </motion.div>
          </div>
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
                className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-100 dark:border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden"
              >
                {/* Orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full blur-3xl"
                />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-br from-orange-400/10 to-amber-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="relative z-10 bg-gradient-to-br from-amber-800 via-amber-700 to-yellow-700 p-8 text-white">
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
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase">Nouveau Code Promo</h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Création & Configuration</p>
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
                  <Tag size={110} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="relative z-10 p-8 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-900/40 dark:text-amber-400/50 ml-1">
                      Code promo <span className="text-rose-500">*</span>
                    </label>
                    <input type="text" required placeholder="PROMO20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-amber-50/50 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-mono font-bold text-amber-950 dark:text-zinc-100 focus:ring-4 focus:ring-amber-950/10 dark:focus:ring-amber-400/20 focus:border-amber-600/30 outline-none transition-all placeholder:text-amber-900/20 dark:placeholder:text-zinc-500" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.13 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-900/40 dark:text-amber-400/50 ml-1">
                      Réduction (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-900/20 dark:text-zinc-500" />
                      <input type="number" required min={1} max={100} placeholder="20"
                        value={formData.pourcentageReduction}
                        onChange={(e) => setFormData({ ...formData, pourcentageReduction: parseFloat(e.target.value) })}
                        className="w-full bg-amber-50/50 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-zinc-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-amber-950 dark:text-zinc-100 focus:ring-4 focus:ring-amber-950/10 dark:focus:ring-amber-400/20 outline-none transition-all" />
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.16 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-900/40 dark:text-amber-400/50 ml-1">
                        Date d'expiration <span className="text-rose-500">*</span>
                      </label>
                      <input type="datetime-local" required value={formData.dateExpiration}
                        onChange={(e) => setFormData({ ...formData, dateExpiration: e.target.value })}
                        className="w-full bg-amber-50/50 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-amber-950 dark:text-zinc-100 focus:ring-4 focus:ring-amber-950/10 dark:focus:ring-amber-400/20 outline-none transition-all" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.19 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-900/40 dark:text-amber-400/50 ml-1">
                        Utilisations max
                      </label>
                      <input type="number" min={1} placeholder="Illimité"
                        value={formData.nbUtilisationsMax}
                        onChange={(e) => setFormData({ ...formData, nbUtilisationsMax: e.target.value })}
                        className="w-full bg-amber-50/50 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-amber-950 dark:text-zinc-100 focus:ring-4 focus:ring-amber-950/10 dark:focus:ring-amber-400/20 outline-none transition-all placeholder:text-amber-900/20 dark:placeholder:text-zinc-500" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-900/40 dark:text-amber-400/50 ml-1">Compagnie (optionnel)</label>
                    <select value={formData.compagnieId}
                      onChange={(e) => setFormData({ ...formData, compagnieId: parseInt(e.target.value) })}
                      className="w-full bg-amber-50/50 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-zinc-700 rounded-2xl py-3.5 px-4 text-sm font-semibold text-amber-950 dark:text-zinc-100 focus:ring-4 focus:ring-amber-950/10 dark:focus:ring-amber-400/20 outline-none transition-all">
                      <option value={0}>Toutes les compagnies</option>
                      {compagnies.map((c) => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
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
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-amber-700 to-yellow-600 text-white font-bold py-4 rounded-2xl shadow-[0_15px_35px_rgba(217,119,6,0.25)] hover:shadow-[0_20px_40px_rgba(217,119,6,0.35)] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 size={18} /> Créer le code promo
                    </motion.button>
                    <button type="button" onClick={() => setShowModal(false)}
                      className="px-8 bg-amber-50 dark:bg-zinc-800 text-amber-800/40 dark:text-zinc-400 font-bold py-4 rounded-2xl hover:bg-amber-100/50 dark:hover:bg-zinc-700 hover:text-amber-900 dark:hover:text-zinc-200 transition-all text-sm">
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

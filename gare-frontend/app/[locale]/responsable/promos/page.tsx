'use client';

import { useState, useEffect } from 'react';
import { responsablePromoApi } from '@/lib/api/responsable/promos';
import { CodePromo, CodePromoRequest } from '@/types';
import {
  Tag, Plus, X, PowerOff, CheckCircle2, AlertTriangle, Clock,
  Search, RefreshCw, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export default function ResponsablePromosPage() {
  const [promos, setPromos] = useState<CodePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'expire' | 'epuise' | 'inactif'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState<CodePromoRequest>({
    code: '', pourcentageReduction: 10, dateExpiration: '', nbUtilisationsMax: undefined,
  });

  useEffect(() => { loadPromos(); }, []);

  const loadPromos = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await responsablePromoApi.getAll();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) { setError('Impossible de charger les codes promo'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const openCreateModal = () => {
    setFormData({ code: '', pourcentageReduction: 10, dateExpiration: '', nbUtilisationsMax: undefined });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await responsablePromoApi.create({
        ...formData, code: formData.code.toUpperCase(),
        dateExpiration: new Date(formData.dateExpiration).toISOString(),
      });
      setShowModal(false);
      loadPromos();
    } catch (err: any) { alert(err.response?.data?.message || 'Erreur lors de la création'); }
  };

  const handleActiver = async (promo: CodePromo) => {
    if (!confirm(`Réactiver le code "${promo.code}" ?`)) return;
    try { await responsablePromoApi.activer(promo.id); loadPromos(); }
    catch (err: any) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDesactiver = async (promo: CodePromo) => {
    if (!confirm(`Désactiver le code "${promo.code}" ?`)) return;
    try { await responsablePromoApi.desactiver(promo.id); loadPromos(); }
    catch (err: any) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const canReactiver = (p: CodePromo) => !p.actif && new Date(p.dateExpiration) > new Date();

  const promoStatus = (p: CodePromo): string => {
    if (!p.actif) return 'inactif';
    if (new Date(p.dateExpiration) < new Date()) return 'expire';
    if (p.nbUtilisationsMax && p.nbUtilisationsActuel >= p.nbUtilisationsMax) return 'epuise';
    return 'actif';
  };

  const getStatusBadge = (p: CodePromo): { label: string; icon: any; className: string } => {
    const s = promoStatus(p);
    if (s === 'inactif') return { label: 'Inactif', icon: PowerOff, className: 'bg-slate-100 text-slate-500 dark:bg-zinc-700 dark:text-zinc-400' };
    if (s === 'expire') return { label: 'Expiré', icon: Clock, className: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' };
    if (s === 'epuise') return { label: 'Épuisé', icon: AlertTriangle, className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' };
    return { label: 'Actif', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' };
  };

  const filtered = promos
    .filter(p => {
      const matchSearch = p.code.toLowerCase().includes(searchQuery.toLowerCase());
      let matchStatus = true;
      if (statusFilter === 'actif') matchStatus = promoStatus(p) === 'actif';
      if (statusFilter === 'expire') matchStatus = promoStatus(p) === 'expire';
      if (statusFilter === 'epuise') matchStatus = promoStatus(p) === 'epuise';
      if (statusFilter === 'inactif') matchStatus = promoStatus(p) === 'inactif';
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.dateExpiration).getTime() - new Date(a.dateExpiration).getTime());

  const actifCount = promos.filter(p => promoStatus(p) === 'actif').length;
  const totalCount = promos.length;

  return (
    <div className="space-y-6 pb-10">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Codes actifs', value: actifCount, gradient: 'from-emerald-400 to-teal-600', icon: CheckCircle2 },
          { label: 'Total codes', value: totalCount, gradient: 'from-orange-400 to-red-500', icon: Tag },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} shadow-md`}>
                <stat.icon size={16} className="text-white" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
          <input type="text" placeholder="Rechercher un code..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-600 dark:text-zinc-300">
          <option value="all">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="expire">Expiré</option>
          <option value="epuise">Épuisé</option>
          <option value="inactif">Inactif</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => loadPromos(true)}
            className="p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 transition"
            title="Actualiser"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Nouveau Code</button>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des codes promo…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag size={24} className="text-orange-400" /></div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucun code promo trouvé.</p>
          <button onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Créer un code promo</button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-700">
                  {['Code', 'Réduction', 'Expiration', 'Utilisations', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {filtered.map((p, idx) => {
                  const status = getStatusBadge(p);
                  const StatusIcon = status.icon;
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                      className={clsx('hover:bg-orange-50/40 dark:hover:bg-zinc-800/50 transition-colors', !p.actif && 'opacity-50')}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Sparkles size={16} className="text-white" /></div>
                          <span className="font-mono text-sm font-bold text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10">{p.code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800 dark:text-white text-lg">{p.pourcentageReduction}%</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" /> {new Date(p.dateExpiration).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">
                        <span className="bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl font-semibold">
                          {p.nbUtilisationsActuel}{p.nbUtilisationsMax ? ` / ${p.nbUtilisationsMax}` : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', status.className)}>
                          <StatusIcon size={12} /> {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.actif ? (
                          <button onClick={() => handleDesactiver(p)}
                            className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition" title="Désactiver"><PowerOff size={16} /></button>
                        ) : canReactiver(p) ? (
                          <button onClick={() => handleActiver(p)}
                            className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition" title="Réactiver"><CheckCircle2 size={16} /></button>
                        ) : null}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                  <Tag size={16} className="text-orange-500" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Nouveau code promo</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="promo-form" onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Code *</label>
                  <input type="text" required placeholder="Ex: PROMO20" value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold uppercase text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Réduction (%) *</label>
                    <input type="number" required min={1} max={100} value={formData.pourcentageReduction}
                      onChange={e => setFormData({ ...formData, pourcentageReduction: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Date expiration *</label>
                    <input type="datetime-local" required value={formData.dateExpiration}
                      onChange={e => setFormData({ ...formData, dateExpiration: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Utilisations max (optionnel)</label>
                  <input type="number" min={1} placeholder="Laisser vide pour illimité" value={formData.nbUtilisationsMax ?? ''}
                    onChange={e => setFormData({ ...formData, nbUtilisationsMax: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 shrink-0 flex gap-3">
              <button type="submit" form="promo-form"
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">Créer le code</button>
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-600 transition">Annuler</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

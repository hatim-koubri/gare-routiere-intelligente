'use client';

import { useState, useEffect } from 'react';
import { responsableReclamationApi } from '@/lib/api/responsable/reclamations';
import { Reclamation, StatutReclamation, TypeReclamation } from '@/types';
import {
  MessageSquare, Search, CheckCircle2, Clock, AlertTriangle, Eye, Send,
  LayoutGrid, List, RefreshCw, User, Calendar, Tag, X, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const statusConfig: Record<StatutReclamation, { label: string; className: string; icon: any }> = {
  OUVERTE: { label: 'Ouverte', className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', icon: AlertTriangle },
  EN_COURS: { label: 'En cours', className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', icon: Clock },
  RESOLUE: { label: 'Résolue', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', icon: CheckCircle2 },
  REJETEE: { label: 'Rejetée', className: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', icon: X },
};

const typeLabels: Record<TypeReclamation, string> = {
  BAGAGE_PERDU: 'Bagage perdu',
  BAGAGE_ENDOMMAGE: 'Bagage endommagé',
  RETARD: 'Retard',
  SERVICE_CLIENT: 'Service client',
  AUTRE: 'Autre',
};

const typeIcons: Record<TypeReclamation, string> = {
  BAGAGE_PERDU: '🧳',
  BAGAGE_ENDOMMAGE: '💼',
  RETARD: '⏰',
  SERVICE_CLIENT: '💬',
  AUTRE: '📋',
};

export default function ResponsableReclamationsPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Reclamation | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reponseText, setReponseText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await responsableReclamationApi.getAll();
      setReclamations(Array.isArray(data) ? data : []);
    } catch (err) { setError('Impossible de charger les réclamations'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const openDetail = async (r: Reclamation) => {
    setSelected(r);
    setReponseText(r.reponseResponsable || '');
    setShowDetail(true);
  };

  const handleResoudre = async (id: number) => {
    if (!confirm('Marquer cette réclamation comme résolue ?')) return;
    try { await responsableReclamationApi.resoudre(id); load(); }
    catch (err: any) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleRepondre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reponseText.trim()) return;
    setSending(true);
    try {
      await responsableReclamationApi.repondre(selected.id, { statut: 'RESOLUE', reponseResponsable: reponseText.trim() });
      setShowDetail(false);
      load();
    } catch (err: any) { alert(err.response?.data?.message || 'Erreur'); }
    finally { setSending(false); }
  };

  const filtered = reclamations.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = r.sujet.toLowerCase().includes(q) || (r.voyageurNom?.toLowerCase() || '').includes(q) || (r.voyageurPrenom?.toLowerCase() || '').includes(q);
    const matchStatus = statusFilter === 'all' || r.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const ouverteCount = reclamations.filter(r => r.statut === 'OUVERTE').length;
  const encoursCount = reclamations.filter(r => r.statut === 'EN_COURS').length;
  const resolueCount = reclamations.filter(r => r.statut === 'RESOLUE').length;

  return (
    <div className="space-y-6 pb-10">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ouvertes', value: ouverteCount, gradient: 'from-blue-400 to-indigo-600', icon: AlertTriangle },
          { label: 'En cours', value: encoursCount, gradient: 'from-amber-400 to-orange-500', icon: Clock },
          { label: 'Résolues', value: resolueCount, gradient: 'from-emerald-400 to-teal-600', icon: CheckCircle2 },
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
          <input type="text" placeholder="Rechercher sujet, voyageur..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-600 dark:text-zinc-300">
          <option value="all">Tous les statuts</option>
          <option value="OUVERTE">Ouverte</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLUE">Résolue</option>
          <option value="REJETEE">Rejetée</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => load(true)}
            className="p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 transition"
            title="Actualiser"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-xl">
            <button onClick={() => setViewMode('cards')}
              className={clsx('p-2 rounded-lg transition-all', viewMode === 'cards' ? 'bg-white dark:bg-zinc-700 shadow-sm text-orange-500' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300')}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('table')}
              className={clsx('p-2 rounded-lg transition-all', viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-orange-500' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300')}><List size={18} /></button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des réclamations…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-orange-400" /></div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucune réclamation trouvée.</p>
        </motion.div>
      ) : viewMode === 'table' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-700">
                  {['Type', 'Sujet', 'Voyageur', 'Date', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {filtered.map((r, idx) => {
                  const sc = statusConfig[r.statut];
                  const StatusIcon = sc.icon;
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-orange-50/40 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => openDetail(r)}>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <span>{typeIcons[r.type] || '📋'}</span> {typeLabels[r.type] || r.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm max-w-xs truncate">{r.sujet}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          {r.voyageurPrenom ? `${r.voyageurPrenom} ${r.voyageurNom}` : r.voyageurNom}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', sc.className)}>
                          <StatusIcon size={12} /> {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openDetail(r)}
                            className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition" title="Détails"><Eye size={16} /></button>
                          {r.statut !== 'RESOLUE' && r.statut !== 'REJETEE' && (
                            <button onClick={() => handleResoudre(r.id)}
                              className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition" title="Marquer résolue"><CheckCircle2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r, idx) => {
            const sc = statusConfig[r.statut];
            const StatusIcon = sc.icon;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                onClick={() => openDetail(r)}>
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center text-base">
                        {typeIcons[r.type] || '📋'}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{typeLabels[r.type] || r.type}</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                          <Calendar size={10} /> {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', sc.className)}>
                      <StatusIcon size={10} /> {sc.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-2 line-clamp-2">{r.sujet}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-3 mb-3">{r.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <User size={12} />
                    <span className="font-medium">{r.voyageurPrenom ? `${r.voyageurPrenom} ${r.voyageurNom}` : r.voyageurNom}</span>
                  </div>
                  {r.trajetInfo && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
                      <ArrowRight size={10} />
                      <span>{r.trajetInfo}</span>
                    </div>
                  )}
                </div>
                {r.statut !== 'RESOLUE' && r.statut !== 'REJETEE' && (
                  <div className="px-5 pb-4 pt-0 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openDetail(r)}
                      className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:opacity-90 transition shadow-sm flex items-center justify-center gap-1.5">
                      <Eye size={13} /> Traiter
                    </button>
                    <button onClick={() => handleResoudre(r.id)}
                      className="flex-1 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={13} /> Résoudre
                    </button>
                  </div>
                )}
                {r.statut === 'RESOLUE' && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={13} /> Réclamation résolue
                    </div>
                  </div>
                )}
                {r.statut === 'REJETEE' && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl text-center flex items-center justify-center gap-1.5">
                      <X size={13} /> Réclamation rejetée
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selected && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                  <MessageSquare size={16} className="text-orange-500" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Détail de la réclamation</h2>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex-1">{selected.sujet}</h3>
                <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0', statusConfig[selected.statut].className)}>
                  {statusConfig[selected.statut].label}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Type', value: typeLabels[selected.type] || selected.type, icon: Tag },
                  { label: 'Voyageur', value: selected.voyageurPrenom ? `${selected.voyageurPrenom} ${selected.voyageurNom}` : selected.voyageurNom, icon: User },
                  { label: 'Date', value: new Date(selected.dateCreation).toLocaleDateString('fr-FR'), icon: Calendar },
                  { label: 'Trajet', value: selected.trajetInfo || '—', icon: ArrowRight },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <item.icon size={11} /> {item.label}
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-zinc-200 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Description</p>
                <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-4 text-sm text-slate-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {selected.description}
                </div>
              </div>
              {selected.reponseResponsable && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Réponse</p>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/5 dark:to-red-500/5 rounded-xl p-4 text-sm text-slate-700 dark:text-zinc-200 whitespace-pre-wrap border border-orange-100 dark:border-orange-900 leading-relaxed">
                    {selected.reponseResponsable}
                  </div>
                </div>
              )}
              {selected.statut !== 'RESOLUE' && selected.statut !== 'REJETEE' && (
                <form onSubmit={handleRepondre} className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Votre réponse</label>
                    <textarea required rows={4} placeholder="Rédigez votre réponse..." value={reponseText}
                      onChange={e => setReponseText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={sending || !reponseText.trim()}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-orange-200/50 dark:shadow-none">
                      <Send size={15} /> {sending ? 'Envoi...' : 'Répondre & Résoudre'}
                    </button>
                    <button type="button" onClick={() => handleResoudre(selected.id)}
                      className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition">
                      <CheckCircle2 size={15} /> Résoudre sans réponse
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

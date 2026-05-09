'use client';

import { useState, useEffect } from 'react';
import { responsableReclamationApi } from '@/lib/api/responsable/reclamations';
import { Reclamation, ReponseReclamationRequest, StatutReclamation, TypeReclamation } from '@/types';
import {
  MessageSquare, Plus, X, Search, CheckCircle2, Clock, AlertTriangle, Eye, Send
} from 'lucide-react';
import { clsx } from 'clsx';

const statusConfig: Record<StatutReclamation, { label: string; className: string }> = {
  OUVERTE: { label: 'Ouverte', className: 'bg-blue-50 text-blue-600' },
  EN_COURS: { label: 'En cours', className: 'bg-amber-50 text-amber-600' },
  RESOLUE: { label: 'Résolue', className: 'bg-emerald-50 text-emerald-600' },
  REJETEE: { label: 'Rejetée', className: 'bg-red-50 text-red-600' },
};

const typeLabels: Record<TypeReclamation, string> = {
  BAGAGE_PERDU: 'Bagage perdu',
  BAGAGE_ENDOMMAGE: 'Bagage endommagé',
  RETARD: 'Retard',
  SERVICE_CLIENT: 'Service client',
  AUTRE: 'Autre',
};

export default function ResponsableReclamationsPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Reclamation | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reponseText, setReponseText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await responsableReclamationApi.getAll();
      setReclamations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les réclamations');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (r: Reclamation) => {
    setSelected(r);
    setReponseText(r.reponseResponsable || '');
    setShowDetail(true);
  };

  const handleResoudre = async (id: number) => {
    if (!confirm('Marquer cette réclamation comme résolue ?')) return;
    try {
      await responsableReclamationApi.resoudre(id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleRepondre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reponseText.trim()) return;
    setSending(true);
    try {
      await responsableReclamationApi.repondre(selected.id, {
        statut: 'RESOLUE',
        reponseResponsable: reponseText.trim(),
      });
      setShowDetail(false);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const filtered = reclamations.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = r.sujet.toLowerCase().includes(q) || (r.voyageurNom?.toLowerCase() || '').includes(q) || (r.voyageurPrenom?.toLowerCase() || '').includes(q);
    const matchStatus = statusFilter === 'all' || r.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Réclamations</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez les réclamations des voyageurs</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Rechercher sujet, voyageur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600">
          <option value="all">Tous les statuts</option>
          <option value="OUVERTE">Ouverte</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLUE">Résolue</option>
          <option value="REJETEE">Rejetée</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <MessageSquare size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucune réclamation trouvée.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Type', 'Sujet', 'Voyageur', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(r => {
                const sc = statusConfig[r.statut];
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-500">{typeLabels[r.type] || r.type}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 text-sm max-w-xs truncate">{r.sujet}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {r.voyageurPrenom ? `${r.voyageurPrenom} ${r.voyageurNom}` : r.voyageurNom}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', sc.className)}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetail(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Détails"><Eye size={16} /></button>
                        {r.statut !== 'RESOLUE' && r.statut !== 'REJETEE' && (
                          <button onClick={() => handleResoudre(r.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Marquer résolue"><CheckCircle2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showDetail && selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <MessageSquare size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Détail de la réclamation</h2>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-lg">{selected.sujet}</span>
                <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', statusConfig[selected.statut].className)}>
                  {statusConfig[selected.statut].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</p>
                  <p className="font-semibold text-slate-700">{typeLabels[selected.type] || selected.type}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Voyageur</p>
                  <p className="font-semibold text-slate-700">{selected.voyageurPrenom ? `${selected.voyageurPrenom} ${selected.voyageurNom}` : selected.voyageurNom}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="font-semibold text-slate-700">{new Date(selected.dateCreation).toLocaleDateString('fr-FR')}</p>
                </div>
                {selected.trajetInfo && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trajet</p>
                    <p className="font-semibold text-slate-700">{selected.trajetInfo}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {selected.description}
                </div>
              </div>

              {selected.reponseResponsable && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Réponse</p>
                  <div className="bg-indigo-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                    {selected.reponseResponsable}
                  </div>
                </div>
              )}

              {selected.statut !== 'RESOLUE' && selected.statut !== 'REJETEE' && (
                <form onSubmit={handleRepondre} className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Votre réponse</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Rédigez votre réponse..."
                      value={reponseText}
                      onChange={e => setReponseText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={sending || !reponseText.trim()}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      <Send size={15} />
                      {sending ? 'Envoi...' : 'Répondre & Résoudre'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResoudre(selected.id)}
                      className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-100 transition"
                    >
                      <CheckCircle2 size={15} />
                      Résoudre sans réponse
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

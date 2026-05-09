'use client';

import { useState, useEffect } from 'react';
import { responsableRemboursementApi } from '@/lib/api/responsable/remboursements';
import { Remboursement, StatutRemboursement } from '@/types';
import {
  ArrowLeftRight, Search, X, Eye, CheckCircle2, XCircle
} from 'lucide-react';
import { clsx } from 'clsx';

const statusConfig: Record<StatutRemboursement, { label: string; className: string }> = {
  EN_ATTENTE: { label: 'En attente', className: 'bg-amber-50 text-amber-600' },
  ACCEPTE: { label: 'Accepté', className: 'bg-emerald-50 text-emerald-600' },
  REFUSE: { label: 'Refusé', className: 'bg-red-50 text-red-600' },
};

export default function ResponsableRemboursementsPage() {
  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Remboursement | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await responsableRemboursementApi.getAll();
      setRemboursements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les demandes de remboursement');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (r: Remboursement) => {
    setSelected(r);
    setShowDetail(true);
  };

  const handleAccepter = async (id: number) => {
    if (!confirm('Accepter ce remboursement ? La réservation sera marquée comme remboursée.')) return;
    setProcessing(true);
    try {
      await responsableRemboursementApi.accepter(id);
      setShowDetail(false);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefuser = async (id: number) => {
    if (!confirm('Refuser ce remboursement ?')) return;
    setProcessing(true);
    try {
      await responsableRemboursementApi.refuser(id);
      setShowDetail(false);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = remboursements.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (r.voyageurNom?.toLowerCase() || '').includes(q) || (r.voyageurPrenom?.toLowerCase() || '').includes(q) || r.motif.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Remboursements</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez les demandes de remboursement des voyageurs</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Rechercher voyageur, motif..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600">
          <option value="all">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="ACCEPTE">Accepté</option>
          <option value="REFUSE">Refusé</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <ArrowLeftRight size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucune demande de remboursement trouvée.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Voyageur', 'Montant', 'Motif', 'Date demande', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(r => {
                const sc = statusConfig[r.statut];
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {r.voyageurPrenom ? `${r.voyageurPrenom} ${r.voyageurNom}` : r.voyageurNom}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 text-sm">{r.montant.toFixed(2)} DH</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-xs truncate">{r.motif}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(r.dateDemande).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', sc.className)}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetail(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Détails"><Eye size={16} /></button>
                        {r.statut === 'EN_ATTENTE' && (
                          <>
                            <button onClick={() => handleAccepter(r.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Accepter"><CheckCircle2 size={16} /></button>
                            <button onClick={() => handleRefuser(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Refuser"><XCircle size={16} /></button>
                          </>
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
                  <ArrowLeftRight size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Détail du remboursement</h2>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Remboursement #{selected.id}</p>
                </div>
                <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', statusConfig[selected.statut].className)}>
                  {statusConfig[selected.statut].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Voyageur</p>
                  <p className="font-semibold text-slate-700">{selected.voyageurPrenom ? `${selected.voyageurPrenom} ${selected.voyageurNom}` : selected.voyageurNom}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date demande</p>
                  <p className="font-semibold text-slate-700">{new Date(selected.dateDemande).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Montant</p>
                  <p className="font-semibold text-slate-700">{selected.montant.toFixed(2)} DH</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Réservation</p>
                  <p className="font-semibold text-slate-700">#{selected.reservationId}</p>
                </div>
                {selected.dateTraitement && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date traitement</p>
                    <p className="font-semibold text-slate-700">{new Date(selected.dateTraitement).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Motif</p>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {selected.motif}
                </div>
              </div>

              {selected.statut === 'EN_ATTENTE' && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleAccepter(selected.id)}
                    disabled={processing}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    {processing ? 'Traitement...' : 'Accepter le remboursement'}
                  </button>
                  <button
                    onClick={() => handleRefuser(selected.id)}
                    disabled={processing}
                    className="flex items-center gap-2 bg-red-50 text-red-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    Refuser
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

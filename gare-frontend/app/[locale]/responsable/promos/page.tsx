'use client';

import { useState, useEffect } from 'react';
import { responsablePromoApi } from '@/lib/api/responsable/promos';
import { CodePromo, CodePromoRequest } from '@/types';
import {
  Tag, Plus, X, PowerOff, CheckCircle2, AlertTriangle, Clock,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ResponsablePromosPage() {
  const [promos, setPromos] = useState<CodePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'expire' | 'epuise' | 'inactif'>('all');

  const [formData, setFormData] = useState<CodePromoRequest>({
    code: '',
    pourcentageReduction: 10,
    dateExpiration: '',
    nbUtilisationsMax: undefined,
  });

  useEffect(() => { loadPromos(); }, []);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const data = await responsablePromoApi.getAll();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les codes promo');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ code: '', pourcentageReduction: 10, dateExpiration: '', nbUtilisationsMax: undefined });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await responsablePromoApi.create({
        ...formData,
        code: formData.code.toUpperCase(),
        dateExpiration: new Date(formData.dateExpiration).toISOString(),
      });
      setShowModal(false);
      loadPromos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleActiver = async (promo: CodePromo) => {
    if (!confirm(`Réactiver le code "${promo.code}" ?`)) return;
    try {
      await responsablePromoApi.activer(promo.id);
      loadPromos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDesactiver = async (promo: CodePromo) => {
    if (!confirm(`Désactiver le code "${promo.code}" ?`)) return;
    try {
      await responsablePromoApi.desactiver(promo.id);
      loadPromos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
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
    if (s === 'inactif') return { label: 'Inactif', icon: PowerOff, className: 'bg-slate-100 text-slate-500' };
    if (s === 'expire') return { label: 'Expiré', icon: Clock, className: 'bg-red-50 text-red-600' };
    if (s === 'epuise') return { label: 'Épuisé', icon: AlertTriangle, className: 'bg-amber-50 text-amber-600' };
    return { label: 'Actif', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' };
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Codes Promo</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez les codes promotionnels de votre compagnie</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={15} /> Nouveau Code
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text" placeholder="Rechercher un code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600"
        >
          <option value="all">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="expire">Expiré</option>
          <option value="epuise">Épuisé</option>
          <option value="inactif">Inactif</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <Tag size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucun code promo trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Code', 'Réduction', 'Expiration', 'Utilisations', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => {
                const status = getStatusBadge(p);
                const StatusIcon = status.icon;
                return (
                  <tr key={p.id} className={clsx('hover:bg-slate-50 transition-colors', !p.actif && 'opacity-50')}>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">{p.code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 text-sm">{p.pourcentageReduction}%</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(p.dateExpiration).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {p.nbUtilisationsActuel}{p.nbUtilisationsMax ? ` / ${p.nbUtilisationsMax}` : ''}
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', status.className)}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {p.actif ? (
                        <button
                          onClick={() => handleDesactiver(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Désactiver"
                        >
                          <PowerOff size={16} />
                        </button>
                      ) : canReactiver(p) ? (
                        <button
                          onClick={() => handleActiver(p)}
                          className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          title="Réactiver"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Tag size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Nouveau code promo</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="promo-form" onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Code *</label>
                  <input
                    type="text" required placeholder="Ex: PROMO20"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Réduction (%) *</label>
                    <input
                      type="number" required min={1} max={100}
                      value={formData.pourcentageReduction}
                      onChange={e => setFormData({ ...formData, pourcentageReduction: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date expiration *</label>
                    <input
                      type="datetime-local" required
                      value={formData.dateExpiration}
                      onChange={e => setFormData({ ...formData, dateExpiration: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Utilisations max (optionnel)</label>
                  <input
                    type="number" min={1} placeholder="Laisser vide pour illimité"
                    value={formData.nbUtilisationsMax ?? ''}
                    onChange={e => setFormData({ ...formData, nbUtilisationsMax: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              <button type="submit" form="promo-form" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
                Créer le code
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

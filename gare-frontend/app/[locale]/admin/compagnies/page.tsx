'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { adminBusApi } from '@/lib/api/admin/bus';
import { Compagnie } from '@/types';
import { CompagnieCard } from '@/components/ui/compagnie-card';
import {
  Building2, Search, Plus, LayoutGrid, List,
  Mail, Phone, X, RefreshCw, CheckCircle2, XCircle, UserPlus
} from 'lucide-react';

const CARD_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-700',
];

type StatusFilter = 'all' | 'active' | 'inactive';
type ViewMode = 'cards' | 'table';

export default function CompagniesPage() {
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [busData, setBusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [formData, setFormData] = useState({
    nom: '', code: '', email: '', telephone: '', description: '',
  });

  const [showRespModal, setShowRespModal] = useState(false);
  const [respCompagnieId, setRespCompagnieId] = useState<number | null>(null);
  const [respNom, setRespNom] = useState('');
  const [respPrenom, setRespPrenom] = useState('');
  const [respEmail, setRespEmail] = useState('');
  const [respPassword, setRespPassword] = useState('');
  const [respTelephone, setRespTelephone] = useState('');
  const [respSending, setRespSending] = useState(false);

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

  const openRespModal = (compagnieId: number) => {
    setRespCompagnieId(compagnieId);
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
      alert('Responsable ajouté avec succès');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setRespSending(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCompagnieApi.create(formData);
      setShowModal(false);
      setFormData({ nom: '', code: '', email: '', telephone: '', description: '' });
      loadCompagnies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
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
      <div className="space-y-6 pb-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Compagnies</h1>
            <p className="text-slate-500 text-sm mt-0.5">{stats.total} compagnie{stats.total > 1 ? 's' : ''} enregistrée{stats.total > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadCompagnies}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:border-emerald-300 transition"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="relative group overflow-hidden bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/40 flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={16} strokeWidth={3} />
              </div>
              <span>Nouvelle compagnie</span>
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-2xl border p-5 text-left transition-all ${
              statusFilter === 'all'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'
            }`}
          >
            <div className={`text-3xl font-bold ${statusFilter === 'all' ? 'text-white' : 'text-slate-800'}`}>{stats.total}</div>
            <div className={`text-xs mt-0.5 font-medium ${statusFilter === 'all' ? 'text-emerald-100' : 'text-slate-500'}`}>Total compagnies</div>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`rounded-2xl border p-5 text-left transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'
            }`}
          >
            <div className={`flex items-center gap-2 mb-1`}>
              <CheckCircle2 size={16} className={statusFilter === 'active' ? 'text-emerald-200' : 'text-emerald-500'} />
            </div>
            <div className={`text-3xl font-bold ${statusFilter === 'active' ? 'text-white' : 'text-emerald-600'}`}>{stats.actives}</div>
            <div className={`text-xs font-medium ${statusFilter === 'active' ? 'text-emerald-100' : 'text-slate-500'}`}>Actives</div>
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`rounded-2xl border p-5 text-left transition-all ${
              statusFilter === 'inactive'
                ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                : 'bg-white border-slate-100 shadow-sm hover:border-rose-100'
            }`}
          >
            <div className="mb-1">
              <XCircle size={16} className={statusFilter === 'inactive' ? 'text-rose-200' : 'text-rose-400'} />
            </div>
            <div className={`text-3xl font-bold ${statusFilter === 'inactive' ? 'text-white' : 'text-rose-500'}`}>{stats.inactives}</div>
            <div className={`text-xs font-medium ${statusFilter === 'inactive' ? 'text-rose-100' : 'text-slate-500'}`}>Inactives</div>
          </button>
        </div>

        {/* ── Barre recherche + toggle vue ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Toggle vue */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* ── Résultat filtre ── */}
        <p className="text-xs text-slate-400 -mt-2">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          {searchQuery && <> pour « <span className="font-medium text-slate-600">{searchQuery}</span> »</>}
          {statusFilter !== 'all' && <> · Filtre : <span className="font-medium text-slate-600">{statusFilter === 'active' ? 'Actives' : 'Inactives'}</span></>}
        </p>

        {/* ── États loading / error / empty ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Chargement des compagnies…</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
            <p className="text-rose-600 font-medium text-sm">{error}</p>
            <button onClick={loadCompagnies} className="mt-3 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-700 transition">
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
            <Building2 size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aucune compagnie trouvée</p>
          </div>

        /* ── Vue Cartes ── */
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((c, i) => (
              <div key={c.id} className="relative group">
                <CompagnieCard
                  index={i}
                  compagnieId={c.id}
                  nom={c.nom}
                  code={c.code}
                  email={c.email}
                  telephone={c.telephone}
                  description={c.description}
                  actif={c.actif}
                  nbBus={busData.filter((b: any) => Number(b.compagnieId) === Number(c.id)).length}
                />
                <button
                  onClick={() => openRespModal(c.id)}
                  className="absolute top-3 right-12 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shadow-sm"
                >
                  <UserPlus size={13} className="inline mr-1" /> Responsable
                </button>
              </div>
            ))}
          </div>

        /* ── Vue Tableau ── */
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Compagnie', 'Code', 'Email', 'Téléphone', 'Statut', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-bold">{getInitials(c.nom)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{c.nom}</p>
                          {c.description && <p className="text-xs text-slate-400 truncate max-w-[180px]">{c.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{c.email || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{c.telephone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.actif ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                        {c.actif ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openRespModal(c.id)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition"
                      >
                        <UserPlus size={13} /> Responsable
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Modal création ── */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Building2 size={16} className="text-emerald-600" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Nouvelle compagnie</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreate} className="space-y-4">
                  {[
                    { label: 'Nom', key: 'nom', type: 'text', required: true, placeholder: 'Ex: CTM Voyages' },
                    { label: 'Code', key: 'code', type: 'text', required: true, placeholder: 'Ex: CTM' },
                    { label: 'Email', key: 'email', type: 'email', required: false, placeholder: 'contact@compagnie.ma' },
                    { label: 'Téléphone', key: 'telephone', type: 'text', required: false, placeholder: '+212 5XX-XXXXXX' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {field.label}{field.required && ' *'}
                      </label>
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={(formData as any)[field.key]}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Description de la compagnie…"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
                    >
                      Créer la compagnie
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal ajout responsable ── */}
        {showRespModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <UserPlus size={16} className="text-emerald-600" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Ajouter un responsable</h2>
                </div>
                <button onClick={() => setShowRespModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAjouterResponsable} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom *</label>
                      <input type="text" required placeholder="Jean" value={respPrenom} onChange={e => setRespPrenom(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</label>
                      <input type="text" required placeholder="Dupont" value={respNom} onChange={e => setRespNom(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email *</label>
                    <input type="email" required placeholder="responsable@compagnie.ma" value={respEmail} onChange={e => setRespEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mot de passe *</label>
                    <input type="password" required placeholder="Min. 6 caractères" value={respPassword} onChange={e => setRespPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</label>
                    <input type="text" placeholder="+212 6XX-XXXXXX" value={respTelephone} onChange={e => setRespTelephone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={respSending}
                      className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:bg-slate-300">
                      {respSending ? 'Ajout en cours...' : 'Ajouter le responsable'}
                    </button>
                    <button type="button" onClick={() => setShowRespModal(false)}
                      className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
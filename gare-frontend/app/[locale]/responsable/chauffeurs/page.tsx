'use client';

import { useState, useEffect } from 'react';
import { responsableChauffeurApi } from '@/lib/api/responsable/chauffeurs';
import { Chauffeur, ChauffeurRequest, ChauffeurUpdateRequest } from '@/types';
import {
  Users, Plus, X, Edit, UserX, Umbrella, PowerOff,
  CheckCircle2, AlertCircle, Clock, Search, LayoutGrid, List
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ResponsableChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState<Chauffeur | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'conge' | 'inactif'>('all');

  const [formData, setFormData] = useState<ChauffeurRequest>({
    nom: '', prenom: '', email: '', password: '', telephone: '', numeroPermis: '', dateEmbauche: '',
  });

  const [editFormData, setEditFormData] = useState<ChauffeurUpdateRequest>({
    nom: '', prenom: '', telephone: '', numeroPermis: '', dateEmbauche: '',
  });

  useEffect(() => {
    loadChauffeurs();
  }, []);

  const loadChauffeurs = async () => {
    setLoading(true);
    try {
      const data = await responsableChauffeurApi.getAll();
      setChauffeurs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les chauffeurs');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingChauffeur(null);
    setFormData({ nom: '', prenom: '', email: '', password: '', telephone: '', numeroPermis: '', dateEmbauche: '' });
    setShowModal(true);
  };

  const openEditModal = (chauffeur: Chauffeur) => {
    setEditingChauffeur(chauffeur);
    setEditFormData({
      nom: chauffeur.nom,
      prenom: chauffeur.prenom,
      telephone: chauffeur.telephone || '',
      numeroPermis: chauffeur.numeroPermis || '',
      dateEmbauche: chauffeur.dateEmbauche || '',
    });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await responsableChauffeurApi.create(formData);
      setShowModal(false);
      loadChauffeurs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChauffeur) return;
    try {
      await responsableChauffeurApi.update(editingChauffeur.id, editFormData);
      setShowModal(false);
      loadChauffeurs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleToggleConge = async (chauffeur: Chauffeur) => {
    const action = chauffeur.enConge ? 'retirer du congé' : 'mettre en congé';
    if (!confirm(`Voulez-vous ${action} ${chauffeur.prenom} ${chauffeur.nom} ?`)) return;
    try {
      await responsableChauffeurApi.toggleConge(chauffeur.id);
      loadChauffeurs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleActiver = async (chauffeur: Chauffeur) => {
    if (!confirm(`Voulez-vous réactiver ${chauffeur.prenom} ${chauffeur.nom} ?`)) return;
    try {
      await responsableChauffeurApi.activer(chauffeur.id);
      loadChauffeurs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'activation');
    }
  };

  const handleDesactiver = async (chauffeur: Chauffeur) => {
    if (!confirm(`Voulez-vous vraiment désactiver ${chauffeur.prenom} ${chauffeur.nom} ?`)) return;
    try {
      await responsableChauffeurApi.desactiver(chauffeur.id);
      loadChauffeurs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la désactivation');
    }
  };

  const getStatusBadge = (ch: Chauffeur) => {
    if (!ch.actif) return { label: 'Inactif', icon: PowerOff, className: 'bg-slate-100 text-slate-500' };
    if (ch.enConge) return { label: 'Congé', icon: Umbrella, className: 'bg-amber-50 text-amber-600' };
    return { label: 'Actif', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' };
  };

  const filteredChauffeurs = chauffeurs.filter(ch => {
    const q = searchQuery.toLowerCase();
    const matchSearch = ch.nom.toLowerCase().includes(q) || ch.prenom.toLowerCase().includes(q) || ch.email.toLowerCase().includes(q) || (ch.numeroPermis || '').toLowerCase().includes(q);
    let matchStatus = true;
    if (statusFilter === 'actif') matchStatus = ch.actif && !ch.enConge;
    if (statusFilter === 'conge') matchStatus = ch.actif && ch.enConge;
    if (statusFilter === 'inactif') matchStatus = !ch.actif;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chauffeurs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez les chauffeurs de votre compagnie</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={15} /> Nouveau Chauffeur
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher nom, email, permis..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="conge">En congé</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl">
          <button onClick={() => setViewMode('table')} className={clsx('p-2 rounded-lg transition-all', viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50')}><List size={18} /></button>
          <button onClick={() => setViewMode('cards')} className={clsx('p-2 rounded-lg transition-all', viewMode === 'cards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50')}><LayoutGrid size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filteredChauffeurs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <Users size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucun chauffeur trouvé.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Chauffeur', 'Contact', 'Permis', 'Emb.' ,'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredChauffeurs.map(ch => (
                <tr key={ch.id} className={clsx('hover:bg-slate-50 transition-colors', !ch.actif && 'opacity-50')}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 text-sm">{ch.prenom} {ch.nom}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-600">{ch.email}</p>
                    {ch.telephone && <p className="text-xs text-slate-400">{ch.telephone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">{ch.numeroPermis || '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{ch.dateEmbauche ? new Date(ch.dateEmbauche).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge chauffeur={ch} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {ch.actif ? (
                        <>
                          <button onClick={() => openEditModal(ch)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Modifier"><Edit size={16} /></button>
                          <button onClick={() => handleToggleConge(ch)} className={clsx('p-1.5 rounded-lg transition', ch.enConge ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50')} title={ch.enConge ? 'Retour de congé' : 'Mettre en congé'}>{ch.enConge ? <CheckCircle2 size={16} /> : <Umbrella size={16} />}</button>
                          <button onClick={() => handleDesactiver(ch)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Désactiver"><PowerOff size={16} /></button>
                        </>
                      ) : (
                        <button onClick={() => handleActiver(ch)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition" title="Réactiver"><PowerOff size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChauffeurs.map(ch => (
            <div key={ch.id} className={clsx('bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col', !ch.actif && 'opacity-60')}>
              <div className="p-5 flex-1 border-b border-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{ch.prenom[0]}{ch.nom[0]}</span>
                  </div>
                  <StatusBadge chauffeur={ch} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">{ch.prenom} {ch.nom}</h3>
                <p className="text-sm text-slate-500 mb-3">{ch.email}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Permis</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">{ch.numeroPermis || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Emb.</p>
                    <p className="text-sm font-semibold text-slate-700">{ch.dateEmbauche ? new Date(ch.dateEmbauche).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-slate-50 flex gap-1">
                {ch.actif ? (
                  <>
                    <button onClick={() => openEditModal(ch)} className="flex-1 py-2 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition"><Edit size={16} /></button>
                    <button onClick={() => handleToggleConge(ch)} className={clsx('flex-1 py-2 flex items-center justify-center rounded-xl transition', ch.enConge ? 'text-emerald-600 hover:bg-white' : 'text-slate-500 hover:text-amber-600 hover:bg-white')}>{ch.enConge ? <CheckCircle2 size={16} /> : <Umbrella size={16} />}</button>
                    <button onClick={() => handleDesactiver(ch)} className="flex-1 py-2 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-white rounded-xl transition"><PowerOff size={16} /></button>
                  </>
                ) : (
                  <button onClick={() => handleActiver(ch)} className="flex-1 py-2 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-white rounded-xl transition"><PowerOff size={16} /> Réactiver</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création / Modif */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Users size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingChauffeur ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              {editingChauffeur ? (
                <form id="chauffeur-form" onSubmit={handleUpdate} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</label>
                      <input type="text" required placeholder="Ex: Dupont" value={editFormData.nom} onChange={e => setEditFormData({ ...editFormData, nom: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom *</label>
                      <input type="text" required placeholder="Ex: Jean" value={editFormData.prenom} onChange={e => setEditFormData({ ...editFormData, prenom: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</label>
                      <input type="text" placeholder="Ex: 0612345678" value={editFormData.telephone} onChange={e => setEditFormData({ ...editFormData, telephone: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">N° Permis *</label>
                      <input type="text" required placeholder="Ex: P-123456" value={editFormData.numeroPermis} onChange={e => setEditFormData({ ...editFormData, numeroPermis: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date d'embauche</label>
                      <input type="date" value={editFormData.dateEmbauche} onChange={e => setEditFormData({ ...editFormData, dateEmbauche: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </form>
              ) : (
                <form id="chauffeur-form" onSubmit={handleCreate} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</label>
                      <input type="text" required placeholder="Ex: Dupont" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Prénom *</label>
                      <input type="text" required placeholder="Ex: Jean" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email *</label>
                      <input type="email" required placeholder="Ex: jean.dupont@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mot de passe *</label>
                      <input type="password" required minLength={8} placeholder="Min. 8 caractères" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</label>
                      <input type="text" placeholder="Ex: 0612345678" value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">N° Permis *</label>
                      <input type="text" required placeholder="Ex: P-123456" value={formData.numeroPermis} onChange={e => setFormData({ ...formData, numeroPermis: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date d'embauche</label>
                      <input type="date" value={formData.dateEmbauche} onChange={e => setFormData({ ...formData, dateEmbauche: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              <button type="submit" form="chauffeur-form" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
                {editingChauffeur ? 'Enregistrer' : 'Créer le chauffeur'}
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

function StatusBadge({ chauffeur }: { chauffeur: Chauffeur }) {
  if (!chauffeur.actif) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
        <PowerOff size={12} /> Inactif
      </span>
    );
  }
  if (chauffeur.enConge) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
        <Umbrella size={12} /> Congé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
      <CheckCircle2 size={12} /> Actif
    </span>
  );
}

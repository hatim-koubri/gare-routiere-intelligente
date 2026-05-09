'use client';

import { useState, useEffect } from 'react';
import { responsableAnnonceApi } from '@/lib/api/responsable/annonces';
import { Annonce, AnnonceRequest } from '@/types';
import {
  Megaphone, Plus, X, Edit, PowerOff, CheckCircle2,
  Search, ArrowLeftRight, Globe, FileText
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ResponsableAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Annonce | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFr, setShowFr] = useState(true);

  const [formData, setFormData] = useState<AnnonceRequest>({
    titreFr: '', titreAr: '', contenuFr: '', contenuAr: '', dateDebut: '', dateFin: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await responsableAnnonceApi.getAll();
      setAnnonces(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les annonces');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    setFormData({ titreFr: '', titreAr: '', contenuFr: '', contenuAr: '', dateDebut: '', dateFin: '' });
    setShowModal(true);
  };

  const openEditModal = (a: Annonce) => {
    setEditing(a);
    setFormData({
      titreFr: a.titreFr, titreAr: a.titreAr || '', contenuFr: a.contenuFr, contenuAr: a.contenuAr || '',
      dateDebut: a.dateDebut || '', dateFin: a.dateFin || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await responsableAnnonceApi.update(editing.id, formData);
      } else {
        await responsableAnnonceApi.create(formData);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleToggle = async (a: Annonce) => {
    const action = a.active ? 'désactiver' : 'activer';
    if (!confirm(`${action} l'annonce "${a.titreFr}" ?`)) return;
    try {
      await responsableAnnonceApi.toggle(a.id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const filtered = annonces.filter(a =>
    a.titreFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.titreAr || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Annonces</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez les annonces de votre compagnie</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
          <Plus size={15} /> Nouvelle annonce
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button
          onClick={() => setShowFr(!showFr)}
          className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
        >
          <Globe size={15} />
          {showFr ? 'FR' : 'AR'}
          <ArrowLeftRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <Megaphone size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucune annonce trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(a => (
            <div key={a.id} className={clsx('bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col', !a.active && 'opacity-60')}>
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Megaphone size={18} className="text-indigo-600" />
                  </div>
                  <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', a.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                    {a.active ? <CheckCircle2 size={12} /> : <PowerOff size={12} />}
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2" dir={showFr ? 'ltr' : 'rtl'}>
                  <h3 className="font-bold text-slate-800 text-base">
                    {showFr ? a.titreFr : (a.titreAr || a.titreFr)}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {showFr ? a.contenuFr : (a.contenuAr || a.contenuFr)}
                  </p>
                </div>

                {a.dateDebut && (
                  <p className="text-xs text-slate-400 mt-3">
                    Du {new Date(a.dateDebut).toLocaleDateString('fr-FR')}
                    {a.dateFin && ` au ${new Date(a.dateFin).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
              </div>

              <div className="p-2 bg-slate-50 flex gap-1">
                <button onClick={() => openEditModal(a)} className="flex-1 py-2 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition"><Edit size={16} /></button>
                <button onClick={() => handleToggle(a)} className={clsx('flex-1 py-2 flex items-center justify-center rounded-xl transition', a.active ? 'text-slate-500 hover:text-rose-600 hover:bg-white' : 'text-emerald-600 hover:bg-white')}>
                  {a.active ? <PowerOff size={16} /> : <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center"><Megaphone size={16} className="text-indigo-600" /></div>
                <h2 className="text-base font-bold text-slate-900">{editing ? 'Modifier' : 'Nouvelle'} annonce</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="annonce-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Titre (FR) *</label>
                    <input type="text" required value={formData.titreFr} onChange={e => setFormData({ ...formData, titreFr: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div dir="rtl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">العنوان (AR)</label>
                    <input type="text" value={formData.titreAr} onChange={e => setFormData({ ...formData, titreAr: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Contenu (FR) *</label>
                    <textarea required rows={4} value={formData.contenuFr} onChange={e => setFormData({ ...formData, contenuFr: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div dir="rtl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">المحتوى (AR)</label>
                    <textarea rows={4} value={formData.contenuAr} onChange={e => setFormData({ ...formData, contenuAr: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date début</label>
                    <input type="datetime-local" value={formData.dateDebut} onChange={e => setFormData({ ...formData, dateDebut: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date fin</label>
                    <input type="datetime-local" value={formData.dateFin} onChange={e => setFormData({ ...formData, dateFin: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              <button type="submit" form="annonce-form" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
                {editing ? 'Enregistrer' : 'Créer l\'annonce'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

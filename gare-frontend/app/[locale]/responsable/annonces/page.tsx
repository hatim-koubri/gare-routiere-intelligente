'use client';

import { useState, useEffect } from 'react';
import { responsableAnnonceApi } from '@/lib/api/responsable/annonces';
import { Annonce, AnnonceRequest } from '@/types';
import {
  Megaphone, Plus, X, Edit, PowerOff, CheckCircle2,
  Search, ArrowLeftRight, Globe, FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Megaphone size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Annonces</h1>
              <p className="text-sm text-white/80">Gérez les annonces de votre compagnie</p>
            </div>
          </div>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm border border-white/10">
            <Plus size={15} /> Nouvelle annonce
          </button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
        </div>
        <button onClick={() => setShowFr(!showFr)}
          className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition">
          <Globe size={15} />
          {showFr ? 'FR' : 'AR'}
          <ArrowLeftRight size={12} />
        </button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des annonces…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone size={24} className="text-orange-400" /></div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucune annonce trouvée.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a, idx) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className={clsx('bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col', !a.active && 'opacity-60')}>
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                    <Megaphone size={18} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', a.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400')}>
                    {a.active ? <CheckCircle2 size={12} /> : <PowerOff size={12} />}
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2" dir={showFr ? 'ltr' : 'rtl'}>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {showFr ? a.titreFr : (a.titreAr || a.titreFr)}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-3">
                    {showFr ? a.contenuFr : (a.contenuAr || a.contenuFr)}
                  </p>
                </div>

                {a.dateDebut && (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-3 flex items-center gap-1">
                    <FileText size={10} />
                    Du {new Date(a.dateDebut).toLocaleDateString('fr-FR')}
                    {a.dateFin && ` au ${new Date(a.dateFin).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
              </div>

              <div className="p-2 bg-slate-50 dark:bg-zinc-800/50 flex gap-1">
                <button onClick={() => openEditModal(a)}
                  className="flex-1 py-2 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-orange-500 hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleToggle(a)}
                  className={clsx('flex-1 py-2 flex items-center justify-center rounded-xl transition', a.active ? 'text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-white dark:hover:bg-zinc-700' : 'text-emerald-500 hover:bg-white dark:hover:bg-zinc-700')}>
                  {a.active ? <PowerOff size={16} /> : <CheckCircle2 size={16} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                  <Megaphone size={16} className="text-orange-500" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{editing ? 'Modifier' : 'Nouvelle'} annonce</h2>
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="annonce-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Titre (FR) *</label>
                    <input type="text" required value={formData.titreFr} onChange={e => setFormData({ ...formData, titreFr: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                  </div>
                  <div dir="rtl">
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">العنوان (AR)</label>
                    <input type="text" value={formData.titreAr} onChange={e => setFormData({ ...formData, titreAr: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Contenu (FR) *</label>
                    <textarea required rows={4} value={formData.contenuFr} onChange={e => setFormData({ ...formData, contenuFr: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none text-slate-900 dark:text-white" />
                  </div>
                  <div dir="rtl">
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">المحتوى (AR)</label>
                    <textarea rows={4} value={formData.contenuAr} onChange={e => setFormData({ ...formData, contenuAr: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Date début</label>
                    <input type="datetime-local" value={formData.dateDebut} onChange={e => setFormData({ ...formData, dateDebut: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Date fin</label>
                    <input type="datetime-local" value={formData.dateFin} onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 shrink-0 flex gap-3">
              <button type="submit" form="annonce-form"
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
                {editing ? 'Enregistrer' : "Créer l'annonce"}
              </button>
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-700 transition">
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

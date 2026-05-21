'use client';

import { useState, useEffect } from 'react';
import { responsableLigneApi } from '@/lib/api/responsable/lignes';
import { Ligne, LigneRequest, Arret } from '@/types';
import {
  Route, Plus, X, Search, MapPin, Clock, Euro,
  ArrowUp, ArrowDown, PowerOff,
  Edit, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

type FormMode = 'create' | 'edit';

interface FormState {
  villeDepart: string;
  villeArrivee: string;
  dureeMinutes: string;
  prixBase: string;
  arrets: Arret[];
}

const emptyForm = (): FormState => ({
  villeDepart: '',
  villeArrivee: '',
  dureeMinutes: '',
  prixBase: '',
  arrets: [],
});

function formToRequest(form: FormState): LigneRequest {
  return {
    villeDepart: form.villeDepart,
    villeArrivee: form.villeArrivee,
    dureeMinutes: form.dureeMinutes ? Number(form.dureeMinutes) : undefined,
    prixBase: Number(form.prixBase),
    compagnieId: 0,
    arrets: form.arrets.map((a, i) => ({ ...a, ordre: i + 1 })),
  };
}

export default function ResponsableLignesPage() {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await responsableLigneApi.getAll();
      if (!cancelled) { setLignes(Array.isArray(data) ? data : []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadLignes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await responsableLigneApi.getAll();
    setLignes(Array.isArray(data) ? data : []);
    setRefreshing(false);
  };

  const openCreate = () => {
    setFormMode('create'); setEditingId(null); setForm(emptyForm()); setShowModal(true);
  };

  const openEdit = (ligne: Ligne) => {
    setFormMode('edit'); setEditingId(ligne.id);
    setForm({
      villeDepart: ligne.villeDepart, villeArrivee: ligne.villeArrivee,
      dureeMinutes: ligne.dureeMinutes?.toString() ?? '', prixBase: ligne.prixBase.toString(),
      arrets: (ligne.arrets || []).map(a => ({
        id: a.id, ville: a.ville, ordre: a.ordre, dureePauseMinutes: a.dureePauseMinutes, heurePrevueOffsetMinutes: a.heurePrevueOffsetMinutes,
      })),
    });
    setShowModal(true);
  };

  const handleDesactiver = async (ligne: Ligne) => {
    if (!confirm(`Désactiver la ligne ${ligne.villeDepart} → ${ligne.villeArrivee} ?`)) return;
    try {
      await responsableLigneApi.desactiver(ligne.id);
      setLignes(prev => prev.map(l => l.id === ligne.id ? { ...l, actif: false } : l));
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.message : 'Erreur';
      alert(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.villeDepart || !form.villeArrivee || !form.prixBase) { alert('Veuillez remplir tous les champs obligatoires.'); return; }
    setSubmitting(true);
    try {
      const payload = formToRequest(form);
      if (formMode === 'edit' && editingId) { await responsableLigneApi.update(editingId, payload); }
      else { await responsableLigneApi.create(payload); }
      setShowModal(false);
      const data = await responsableLigneApi.getAll();
      setLignes(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.message : 'Erreur';
      alert(msg);
    } finally { setSubmitting(false); }
  };

  const addArret = () => { setForm(prev => ({ ...prev, arrets: [...prev.arrets, { ville: '', ordre: prev.arrets.length + 1, dureePauseMinutes: 0, heurePrevueOffsetMinutes: undefined }] })); };
  const removeArret = (index: number) => { setForm(prev => ({ ...prev, arrets: prev.arrets.filter((_, i) => i !== index).map((a, i) => ({ ...a, ordre: i + 1 })) })); };
  const moveArret = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.arrets.length) return;
    setForm(prev => { const arr = [...prev.arrets]; [arr[index], arr[target]] = [arr[target], arr[index]]; return { ...prev, arrets: arr.map((a, i) => ({ ...a, ordre: i + 1 })) }; });
  };
  const updateArret = (index: number, field: keyof Arret, value: string | number | undefined) => {
    setForm(prev => { const arr = [...prev.arrets]; arr[index] = { ...arr[index], [field]: value }; return { ...prev, arrets: arr }; });
  };

  const filtered = lignes.filter(l =>
    l.villeDepart.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.villeArrivee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = lignes.filter(l => l.actif).length;
  const inactiveCount = lignes.filter(l => !l.actif).length;

  return (
    <div className="space-y-6 pb-10">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Lignes actives', value: activeCount, gradient: 'from-emerald-400 to-teal-600', icon: CheckCircle2 },
          { label: 'Lignes inactives', value: inactiveCount, gradient: 'from-slate-400 to-slate-600', icon: PowerOff },
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
          <input type="text" placeholder="Rechercher par ville..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => loadLignes(true)}
            className="p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 transition"
            title="Actualiser"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Nouvelle Ligne</button>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des lignes…</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route size={24} className="text-orange-400" /></div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucune ligne trouvée.</p>
          <button onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Créer la première ligne</button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-700">
                  {['Ville départ', 'Ville arrivée', 'Durée', 'Prix base', 'Arrêts', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {filtered.map((l, idx) => (
                  <motion.tr key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                    className={`hover:bg-orange-50/40 dark:hover:bg-zinc-800/50 transition-colors ${!l.actif ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Route size={16} className="text-white" /></div>
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">{l.villeDepart}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 dark:text-zinc-600 text-sm">→</span>
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">{l.villeArrivee}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-semibold">
                        <Clock size={12} className="text-orange-400" /> {l.dureeMinutes ? `${l.dureeMinutes} min` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-zinc-200">{l.prixBase} DH</td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-semibold">
                        <MapPin size={12} className="text-orange-400" /> {l.arrets?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {l.actif ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={12} /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-zinc-700 dark:text-zinc-400"><AlertCircle size={12} /> Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(l)} disabled={!l.actif}
                          className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition disabled:opacity-50" title="Modifier"><Edit size={16} /></button>
                        {l.actif && (
                          <button onClick={() => handleDesactiver(l)}
                            className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition" title="Désactiver"><PowerOff size={16} /></button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                  <Route size={16} className="text-orange-500" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{formMode === 'edit' ? 'Modifier la ligne' : 'Nouvelle ligne'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="ligne-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Ville départ <span className="text-rose-500">*</span></label>
                    <input type="text" required placeholder="Ex: Casablanca" value={form.villeDepart}
                      onChange={e => setForm(prev => ({ ...prev, villeDepart: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Ville arrivée <span className="text-rose-500">*</span></label>
                    <input type="text" required placeholder="Ex: Marrakech" value={form.villeArrivee}
                      onChange={e => setForm(prev => ({ ...prev, villeArrivee: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5"><Clock size={12} className="inline mr-1" />Durée (min)</label>
                    <input type="number" min={1} placeholder="Ex: 180" value={form.dureeMinutes}
                      onChange={e => setForm(prev => ({ ...prev, dureeMinutes: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5"><Euro size={12} className="inline mr-1" />Prix base (DH) <span className="text-rose-500">*</span></label>
                    <input type="number" required min={0} step={0.5} placeholder="Ex: 150" value={form.prixBase}
                      onChange={e => setForm(prev => ({ ...prev, prixBase: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-zinc-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide"><MapPin size={12} className="inline mr-1" />Arrêts intermédiaires</p>
                    <button type="button" onClick={addArret}
                      className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition"><Plus size={13} /> Ajouter un arrêt</button>
                  </div>
                  {form.arrets.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4 bg-slate-50 dark:bg-zinc-800 rounded-xl">Aucun arrêt intermédiaire.</p>
                  )}
                  <div className="space-y-2">
                    {form.arrets.map((arret, index) => (
                      <div key={index} className="flex items-start gap-2 bg-slate-50 dark:bg-zinc-800 rounded-xl p-3">
                        <div className="flex flex-col gap-0.5 pt-1">
                          <button type="button" onClick={() => moveArret(index, -1)} disabled={index === 0}
                            className="p-0.5 text-slate-400 hover:text-orange-500 disabled:opacity-30 transition"><ArrowUp size={12} /></button>
                          <button type="button" onClick={() => moveArret(index, 1)} disabled={index === form.arrets.length - 1}
                            className="p-0.5 text-slate-400 hover:text-orange-500 disabled:opacity-30 transition"><ArrowDown size={12} /></button>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono pt-1.5 w-6">#{index + 1}</div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input type="text" required placeholder="Ville de l'arrêt" value={arret.ville}
                            onChange={e => updateArret(index, 'ville', e.target.value)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                          <div className="flex gap-2">
                            <input type="number" min={0} placeholder="Pause (min)" value={arret.dureePauseMinutes ?? ''}
                              onChange={e => updateArret(index, 'dureePauseMinutes', e.target.value ? Number(e.target.value) : 0)}
                              className="w-full px-2.5 py-2 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" title="Durée de pause" />
                            <input type="number" min={0} placeholder="Offset (min)" value={arret.heurePrevueOffsetMinutes ?? ''}
                              onChange={e => updateArret(index, 'heurePrevueOffsetMinutes', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full px-2.5 py-2 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" title="Offset horaire" />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeArret(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition flex-shrink-0"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 shrink-0 flex gap-3">
              <button type="submit" form="ligne-form" disabled={submitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-200/50 dark:shadow-none">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</> : (formMode === 'edit' ? 'Enregistrer' : 'Créer la ligne')}
              </button>
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-600 transition">Annuler</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

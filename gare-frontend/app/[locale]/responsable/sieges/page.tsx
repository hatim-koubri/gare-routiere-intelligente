'use client';

import { useState, useEffect, useMemo } from 'react';
import { responsableSiegeApi } from '@/lib/api/responsable/sieges';
import { responsableTrajetApi } from '@/lib/api/responsable/trajets';
import { SiegeBlocage, Trajet } from '@/types';
import {
  ArmchairIcon, Lock, Search, RotateCcw, X, User, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';

function getStateClass(s: SiegeBlocage, selected: string | null): string {
  if (s.occupe) return 'bg-red-100 text-red-600 border-red-200 cursor-not-allowed';
  if (s.bloque) return 'bg-amber-100 text-amber-600 border-amber-200 cursor-pointer';
  if (s.verrouilleTemporaire) return 'bg-blue-50 text-blue-400 border-blue-100 cursor-not-allowed';
  if (selected === s.numeroSiege) return 'bg-indigo-100 text-indigo-600 border-indigo-300 ring-2 ring-indigo-400';
  return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 cursor-pointer';
}

function getStateLabel(s: SiegeBlocage): string {
  if (s.occupe) return 'Occupé';
  if (s.bloque) return 'Bloqué';
  if (s.verrouilleTemporaire) return 'Verrouillé';
  return 'Libre';
}

export default function ResponsableSiegesPage() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [selectedTrajetId, setSelectedTrajetId] = useState<number | ''>('');
  const [sieges, setSieges] = useState<SiegeBlocage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedSiege, setSelectedSiege] = useState<SiegeBlocage | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [motifBlocage, setMotifBlocage] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await responsableTrajetApi.getAll();
        setTrajets(Array.isArray(data) ? data : []);
      } catch {
        setError('Impossible de charger les trajets');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (selectedTrajetId === '') return;
      setLoading(true);
      setError('');
      try {
        const data = await responsableSiegeApi.getByTrajet(selectedTrajetId);
        setSieges(Array.isArray(data) ? data : []);
      } catch {
        setError('Impossible de charger le plan des sièges');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedTrajetId]);

  const rows = useMemo(() => {
    const map = new Map<number, SiegeBlocage[]>();
    const order = ['A', 'B', 'C', 'D'];
    for (const s of sieges) {
      if (!map.has(s.numeroRangee)) map.set(s.numeroRangee, []);
      map.get(s.numeroRangee)!.push(s);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => order.indexOf(a.positionRangee) - order.indexOf(b.positionRangee));
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [sieges]);

  const handleSiegeClick = (s: SiegeBlocage) => {
    if (s.occupe || s.verrouilleTemporaire) return;
    setSelectedSiege(s);
    if (s.bloque) {
      if (confirm(`Débloquer le siège ${s.numeroSiege} ?`)) {
        setProcessing(true);
        responsableSiegeApi.debloquer(s.id).then(() => {
          setSieges(prev => prev.map(p => p.id === s.id ? { ...p, bloque: false, motifBlocage: undefined, dateBlocage: undefined } : p));
        }).catch((err: Error & { response?: { data?: { message?: string } } }) => {
          alert(err.response?.data?.message || 'Erreur lors du déblocage');
        }).finally(() => setProcessing(false));
      }
    } else {
      setShowBlockModal(true);
      setMotifBlocage('');
    }
  };

  const handleBloquer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiege || !motifBlocage.trim() || selectedTrajetId === '') return;
    setProcessing(true);
    try {
      const updated = await responsableSiegeApi.bloquer({
        trajetId: selectedTrajetId,
        numeroSiege: selectedSiege.numeroSiege,
        motifBlocage: motifBlocage.trim(),
      });
      setSieges(prev => prev.map(p => p.id === selectedSiege.id ? {
        ...p,
        bloque: true,
        motifBlocage: updated.motifBlocage,
        dateBlocage: updated.dateBlocage,
      } : p));
      setShowBlockModal(false);
      setSelectedSiege(null);
    } catch {
      alert('Erreur lors du blocage');
    } finally {
      setProcessing(false);
    }
  };

  const stats = useMemo(() => {
    const total = sieges.length;
    const libres = sieges.filter(s => !s.occupe && !s.bloque && !s.verrouilleTemporaire).length;
    const occupes = sieges.filter(s => s.occupe).length;
    const bloques = sieges.filter(s => s.bloque).length;
    const verrouilles = sieges.filter(s => s.verrouilleTemporaire).length;
    return { total, libres, occupes, bloques, verrouilles };
  }, [sieges]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestion des Sièges</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visualisez, bloquez et débloquez des sièges par trajet</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      )}

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={selectedTrajetId}
            onChange={e => setSelectedTrajetId(e.target.value ? Number(e.target.value) : '')}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-600"
          >
            <option value="">Sélectionner un trajet...</option>
            {trajets.map(t => (
              <option key={t.id} value={t.id}>
                {t.villeDepart || t.ligne?.villeDepart} → {t.villeArrivee || t.ligne?.villeArrivee} — {t.dateDepart ? new Date(t.dateDepart).toLocaleDateString('fr-FR') : ''}
              </option>
            ))}
          </select>
        </div>
        {selectedTrajetId !== '' && (
          <button onClick={() => { setSelectedTrajetId(''); setSieges([]); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-xl transition">
            <RotateCcw size={14} /> Réinitialiser
          </button>
        )}
      </div>

      {selectedTrajetId !== '' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, className: 'text-slate-700 bg-slate-50' },
            { label: 'Libres', value: stats.libres, className: 'text-emerald-700 bg-emerald-50' },
            { label: 'Occupés', value: stats.occupes, className: 'text-red-700 bg-red-50' },
            { label: 'Bloqués', value: stats.bloques, className: 'text-amber-700 bg-amber-50' },
          ].map(stat => (
            <div key={stat.label} className={clsx('rounded-xl p-3 text-center', stat.className)}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : selectedTrajetId === '' ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <ArmchairIcon size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Sélectionnez un trajet pour afficher le plan des sièges.</p>
        </div>
      ) : sieges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <ArmchairIcon size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucun siège trouvé pour ce trajet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-wrap gap-4 mb-6 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> Libre</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Occupé</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Bloqué</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-100" /> Verrouillé</span>
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            {rows.map(([rangee, siegesRow]) => (
              <div key={rangee} className="flex items-center justify-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-5 text-right">{rangee}</span>
                {siegesRow.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSiegeClick(s)}
                    disabled={s.occupe || s.verrouilleTemporaire}
                    title={`${s.numeroSiege} — ${getStateLabel(s)}${s.bloque && s.motifBlocage ? ` : ${s.motifBlocage}` : ''}`}
                    className={clsx(
                      'w-12 h-12 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all duration-150',
                      getStateClass(s, selectedSiege?.numeroSiege === s.numeroSiege ? s.numeroSiege : null)
                    )}
                  >
                    {s.bloque ? <Lock size={12} /> : s.occupe ? <User size={12} /> : <ArmchairIcon size={12} />}
                    <span className="text-[9px] mt-0.5">{s.positionRangee}</span>
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-400 w-5">{rangee}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showBlockModal && selectedSiege && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Lock size={16} className="text-amber-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Bloquer le siège {selectedSiege.numeroSiege}</h2>
              </div>
              <button onClick={() => setShowBlockModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>

            <form onSubmit={handleBloquer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Motif du blocage</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Siège réservé pour un usage interne..."
                  value={motifBlocage}
                  onChange={e => setMotifBlocage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>Le siege ne sera plus disponible a la reservation tant qu&apos;il est bloque.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={processing || !motifBlocage.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50"
                >
                  <Lock size={15} />
                  {processing ? 'Blocage...' : 'Bloquer le siège'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

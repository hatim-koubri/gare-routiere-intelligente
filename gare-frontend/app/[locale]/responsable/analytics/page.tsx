'use client';

import { useState, useEffect, useMemo } from 'react';
import { responsablePreferenceApi } from '@/lib/api/responsable/preferences';
import { responsableAvisApi } from '@/lib/api/responsable/avis';
import { responsableTrajetApi } from '@/lib/api/responsable/trajets';
import { PreferenceNonSatisfaite, Trajet, AvisResponseDTO } from '@/types';
import {
  BarChart3, Search, AlertTriangle, Star, MessageSquareText,
  Clock, Armchair, User, TrendingUp
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

type TabKey = 'avis' | 'preferences';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'avis', label: 'Avis des voyageurs' },
  { key: 'preferences', label: 'Préférences de voisinage' },
];

const genreConfig: Record<string, { label: string; className: string }> = {
  HOMME: { label: 'Homme', className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  FEMME: { label: 'Femme', className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
};

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-zinc-700'}
        />
      ))}
    </span>
  );
}

function AvisTab() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [avis, setAvis] = useState<AvisResponseDTO[]>([]);
  const [selectedTrajetId, setSelectedTrajetId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [trajetsData, avisData] = await Promise.all([
          responsableTrajetApi.getAll(),
          responsableAvisApi.getAll(),
        ]);
        setTrajets(Array.isArray(trajetsData) ? trajetsData : []);
        setAvis(Array.isArray(avisData) ? avisData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (selectedTrajetId === '') return avis;
    return avis.filter(a => a.trajetId === selectedTrajetId);
  }, [selectedTrajetId, avis]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const avgPonctualite = filtered.reduce((s, a) => s + a.notePonctualite, 0) / filtered.length;
    const avgConfort = filtered.reduce((s, a) => s + a.noteConfort, 0) / filtered.length;
    const avgChauffeur = filtered.reduce((s, a) => s + a.noteChauffeur, 0) / filtered.length;
    const avgGeneral = (avgPonctualite + avgConfort + avgChauffeur) / 3;
    return { avgPonctualite, avgConfort, avgChauffeur, avgGeneral, total: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
          <select
            value={selectedTrajetId}
            onChange={e => setSelectedTrajetId(e.target.value ? Number(e.target.value) : '')}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none font-medium text-slate-600 dark:text-zinc-300"
          >
            <option value="">Tous les trajets</option>
            {trajets.map(t => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.villeDepart || t.ligne?.villeDepart} → {t.villeArrivee || t.ligne?.villeArrivee} — {t.dateDepart ? new Date(t.dateDepart).toLocaleDateString('fr-FR') : ''}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des avis…</p>
        </div>
      ) : (
        <>
          {stats && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl p-4 text-center border border-orange-100 dark:border-orange-900/50">
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.avgGeneral.toFixed(1)}</p>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-300 mt-1 flex items-center justify-center gap-1"><TrendingUp size={12} /> Note moyenne</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.avgPonctualite.toFixed(1)}</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 mt-1 flex items-center justify-center gap-1"><Clock size={12} /> Ponctualité</p>
              </div>
              <div className="bg-sky-50 dark:bg-sky-500/10 rounded-xl p-4 text-center border border-sky-100 dark:border-sky-900/50">
                <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">{stats.avgConfort.toFixed(1)}</p>
                <p className="text-xs font-semibold text-sky-600 dark:text-sky-300 mt-1 flex items-center justify-center gap-1"><Armchair size={12} /> Confort</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 text-center border border-amber-100 dark:border-amber-900/50">
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.avgChauffeur.toFixed(1)}</p>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-300 mt-1 flex items-center justify-center gap-1"><User size={12} /> Chauffeur</p>
              </div>
            </motion.div>
          )}

          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquareText size={24} className="text-orange-400" /></div>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucun avis pour ce trajet.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, idx) => {
                const avg = (a.notePonctualite + a.noteConfort + a.noteChauffeur) / 3;
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 flex items-center justify-center">
                          <User size={18} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{a.voyageurPrenom} {a.voyageurNom}</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500">
                            Trajet #{a.trajetId} — {a.villeDepart} → {a.villeArrivee} — {a.dateDepart ? new Date(a.dateDepart).toLocaleDateString('fr-FR') : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 px-3 py-1.5 rounded-full">
                        <Star size={14} className="fill-orange-500 text-orange-500" />
                        <span className="font-bold text-orange-700 dark:text-orange-400 text-sm">{avg.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-3 text-sm">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                        <Clock size={14} className="text-slate-400" /> Ponctualité <StarRating value={a.notePonctualite} />
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                        <Armchair size={14} className="text-slate-400" /> Confort <StarRating value={a.noteConfort} />
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                        <User size={14} className="text-slate-400" /> Chauffeur <StarRating value={a.noteChauffeur} />
                      </span>
                    </div>
                    {a.commentaire && (
                      <p className="text-sm text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 italic">
                        &ldquo;{a.commentaire}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
                      {a.dateAvis ? new Date(a.dateAvis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PreferencesTab() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [preferences, setPreferences] = useState<PreferenceNonSatisfaite[]>([]);
  const [selectedTrajetId, setSelectedTrajetId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [trajetsData, prefsData] = await Promise.all([
          responsableTrajetApi.getAll(),
          responsablePreferenceApi.getNonSatisfaites(),
        ]);
        setTrajets(Array.isArray(trajetsData) ? trajetsData : []);
        setPreferences(Array.isArray(prefsData) ? prefsData : []);
      } catch {
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (selectedTrajetId === '') return preferences;
    return preferences.filter(p => p.trajetId === selectedTrajetId);
  }, [selectedTrajetId, preferences]);

  const totalNonSatisfaites = filtered.length;
  const femmesImpactees = filtered.filter(p => p.genre === 'FEMME').length;
  const hommesImpactes = filtered.filter(p => p.genre === 'HOMME').length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      )}

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
          <select
            value={selectedTrajetId}
            onChange={e => setSelectedTrajetId(e.target.value ? Number(e.target.value) : '')}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none font-medium text-slate-600 dark:text-zinc-300"
          >
            <option value="">Tous les trajets</option>
            {trajets.map(t => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.villeDepart || t.ligne?.villeDepart} → {t.villeArrivee || t.ligne?.villeArrivee} — {t.dateDepart ? new Date(t.dateDepart).toLocaleDateString('fr-FR') : ''}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des préférences…</p>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-xl p-4 text-center border border-amber-100 dark:border-amber-900/50">
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{totalNonSatisfaites}</p>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-300 mt-1">Non satisfaites</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-4 text-center border border-rose-100 dark:border-rose-900/50">
              <p className="text-3xl font-bold text-rose-700 dark:text-rose-400">{femmesImpactees}</p>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-300 mt-1">Femmes impactées</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900/50">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{hommesImpactes}</p>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 mt-1">Hommes impactés</p>
            </div>
          </motion.div>

          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={24} className="text-orange-400" /></div>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucune préférence non satisfaite.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-700">
                      {['Passager', 'Siège', 'Genre', 'Voisin', 'Siège voisin', 'Type', 'Trajet'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                    {filtered.map((p, idx) => (
                      <tr key={`${p.membreId}-${p.trajetId}`}
                        className="hover:bg-orange-50/40 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800 dark:text-white text-sm">{p.prenom} {p.nom}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-sm text-slate-700 dark:text-zinc-300">{p.siege}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', genreConfig[p.genre]?.className || 'bg-slate-50 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400')}>
                            {genreConfig[p.genre]?.label || p.genre}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-zinc-300">{p.voisinGenre === 'HOMME' ? 'Homme' : 'Femme'}</td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-sm text-slate-700 dark:text-zinc-300">{p.voisinSiege}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <AlertTriangle size={12} />
                            {p.probleme}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-zinc-400">#{p.trajetId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default function ResponsableAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('avis');

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Analytique</h1>
            <p className="text-sm text-white/80">Tableau de bord analytique de votre compagnie</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.key
                ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {activeTab === 'avis' && <AvisTab />}
      {activeTab === 'preferences' && <PreferencesTab />}
    </div>
  );
}

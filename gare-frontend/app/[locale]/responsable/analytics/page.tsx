'use client';

import { useState, useEffect, useMemo } from 'react';
import { responsablePreferenceApi } from '@/lib/api/responsable/preferences';
import { responsableAvisApi } from '@/lib/api/responsable/avis';
import { responsableTrajetApi } from '@/lib/api/responsable/trajets';
import { PreferenceNonSatisfaite, Trajet, AvisResponseDTO } from '@/types';
import {
  BarChart3, Search, AlertTriangle, Star, MessageSquareText,
  Clock, Armchair, User
} from 'lucide-react';
import { clsx } from 'clsx';

type TabKey = 'avis' | 'preferences';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'avis', label: 'Avis des voyageurs' },
  { key: 'preferences', label: 'Préférences de voisinage' },
];

const genreConfig: Record<string, { label: string; className: string }> = {
  HOMME: { label: 'Homme', className: 'bg-blue-50 text-blue-600' },
  FEMME: { label: 'Femme', className: 'bg-rose-50 text-rose-600' },
};

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
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
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={selectedTrajetId}
            onChange={e => setSelectedTrajetId(e.target.value ? Number(e.target.value) : '')}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-600"
          >
            <option value="">Tous les trajets</option>
            {trajets.map(t => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.villeDepart || t.ligne?.villeDepart} → {t.villeArrivee || t.ligne?.villeArrivee} — {t.dateDepart ? new Date(t.dateDepart).toLocaleDateString('fr-FR') : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-indigo-700">{stats.avgGeneral.toFixed(1)}</p>
                <p className="text-xs font-semibold text-indigo-600 mt-1">Note moyenne</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">{stats.avgPonctualite.toFixed(1)}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-1">Ponctualité</p>
              </div>
              <div className="bg-sky-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-sky-700">{stats.avgConfort.toFixed(1)}</p>
                <p className="text-xs font-semibold text-sky-600 mt-1">Confort</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-amber-700">{stats.avgChauffeur.toFixed(1)}</p>
                <p className="text-xs font-semibold text-amber-600 mt-1">Chauffeur</p>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
              <MessageSquareText size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Aucun avis pour ce trajet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(a => {
                const avg = (a.notePonctualite + a.noteConfort + a.noteChauffeur) / 3;
                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User size={18} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{a.voyageurPrenom} {a.voyageurNom}</p>
                          <p className="text-xs text-slate-400">
                            Trajet #{a.trajetId} — {a.villeDepart} → {a.villeArrivee} — {a.dateDepart ? new Date(a.dateDepart).toLocaleDateString('fr-FR') : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full">
                        <Star size={14} className="fill-indigo-600 text-indigo-600" />
                        <span className="font-bold text-indigo-700 text-sm">{avg.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-3 text-sm">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Clock size={14} /> Ponctualité <StarRating value={a.notePonctualite} />
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Armchair size={14} /> Confort <StarRating value={a.noteConfort} />
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <User size={14} /> Chauffeur <StarRating value={a.noteChauffeur} />
                      </span>
                    </div>
                    {a.commentaire && (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 italic">
                        "{a.commentaire}"
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {a.dateAvis ? new Date(a.dateAvis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
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
            <option value="">Tous les trajets</option>
            {trajets.map(t => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.villeDepart || t.ligne?.villeDepart} → {t.villeArrivee || t.ligne?.villeArrivee} — {t.dateDepart ? new Date(t.dateDepart).toLocaleDateString('fr-FR') : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-700">{totalNonSatisfaites}</p>
              <p className="text-xs font-semibold text-amber-600 mt-1">Non satisfaites</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-rose-700">{femmesImpactees}</p>
              <p className="text-xs font-semibold text-rose-600 mt-1">Femmes impactées</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{hommesImpactes}</p>
              <p className="text-xs font-semibold text-blue-600 mt-1">Hommes impactés</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
              <BarChart3 size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Aucune préférence non satisfaite.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Passager', 'Siège', 'Genre', 'Voisin', 'Siège voisin', 'Type', 'Trajet'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(p => (
                    <tr key={`${p.membreId}-${p.trajetId}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 text-sm">{p.prenom} {p.nom}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-sm text-slate-700">{p.siege}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', genreConfig[p.genre]?.className || 'bg-slate-50 text-slate-600')}>
                          {genreConfig[p.genre]?.label || p.genre}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{p.voisinGenre === 'HOMME' ? 'Homme' : 'Femme'}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-sm text-slate-700">{p.voisinSiege}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                          <AlertTriangle size={12} />
                          {p.probleme}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">#{p.trajetId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analytique</h1>
          <p className="text-slate-500 text-sm mt-0.5">Tableau de bord analytique de votre compagnie</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'avis' && <AvisTab />}
      {activeTab === 'preferences' && <PreferencesTab />}
    </div>
  );
}

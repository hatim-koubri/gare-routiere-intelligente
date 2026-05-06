'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import {
  Search, Star, Clock, ArrowLeft, Building2,
  TrendingUp, Trophy, Zap, Award, ArrowRight,
  MapPin, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface ComparaisonCompagnie {
  compagnieNom: string;
  prix: number;
  dureeMinutes: number;
  note: number;
}

function StarsRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < Math.floor(note)
            ? 'text-amber-400 fill-amber-400'
            : 'text-slate-200 fill-slate-200'}
        />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-slate-600">{note.toFixed(1)}</span>
    </div>
  );
}

export default function ComparaisonPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [villeDepart, setVilleDepart] = useState('');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [resultats, setResultats] = useState<ComparaisonCompagnie[]>([]);
  const [loading, setLoading] = useState(false);
  const [rechercheFaite, setRechercheFaite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'prix' | 'duree' | 'note'>('prix');
  const [sortAsc, setSortAsc] = useState(true);

  if (!authLoading && !user) {
    router.push('/fr/auth/login');
    return null;
  }

  const handleSearch = async () => {
    if (!villeDepart.trim() || !villeArrivee.trim()) {
      setError('Veuillez saisir une ville de départ et une ville d\'arrivée');
      return;
    }
    setLoading(true);
    setRechercheFaite(true);
    setError(null);
    try {
      const res = await apiClient.get('/voyageur/recherche/comparaison', {
        params: { villeDepart, villeArrivee }
      });
      setResultats(res.data || []);
      if (!res.data?.length) setError('Aucune compagnie trouvée pour ce trajet');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la comparaison');
      setResultats([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (min: number) => {
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return `${m} min`;
    if (!m) return `${h} h`;
    return `${h} h ${m} min`;
  };

  const sorted = [...resultats].sort((a, b) => {
    const val = sortBy === 'prix' ? a.prix - b.prix
      : sortBy === 'duree' ? a.dureeMinutes - b.dureeMinutes
      : b.note - a.note;
    return sortAsc ? val : -val;
  });

  const best = {
    prix: resultats.length ? resultats.reduce((m, c) => c.prix < m.prix ? c : m, resultats[0]) : null,
    duree: resultats.length ? resultats.reduce((m, c) => c.dureeMinutes < m.dureeMinutes ? c : m, resultats[0]) : null,
    note: resultats.length ? resultats.reduce((m, c) => c.note > m.note ? c : m, resultats[0]) : null,
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(p => !p);
    else { setSortBy(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
      : <ChevronDown size={13} className="text-slate-300" />;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Comparer les compagnies</h1>
          <p className="text-slate-500 text-sm mt-0.5">Trouvez la meilleure offre pour votre trajet</p>
        </div>
        <Link
          href="/fr/voyageur/dashboard"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
      </div>

      {/* ── Formulaire ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <MapPin size={15} className="text-violet-500" />
          Saisir le trajet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {[
            { label: 'Ville de départ', placeholder: 'Ex: Casablanca', value: villeDepart, onChange: setVilleDepart },
            { label: 'Ville d\'arrivée', placeholder: 'Ex: Marrakech', value: villeArrivee, onChange: setVilleArrivee },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {f.label}
              </label>
              <input
                type="text"
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition placeholder:text-slate-300"
              />
            </div>
          ))}
        </div>

        {error && !rechercheFaite && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={17} />
          }
          Comparer les compagnies
        </button>
      </div>

      {/* ── Résultats ── */}
      {rechercheFaite && !loading && (
        <>
          {error ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={22} className="text-amber-600" />
              </div>
              <p className="font-semibold text-amber-800 mb-1">Aucun résultat</p>
              <p className="text-sm text-amber-600">{error}</p>
            </div>
          ) : resultats.length > 0 ? (
            <>
              {/* Podium des meilleurs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Meilleur prix',
                    Icon: Trophy,
                    data: best.prix,
                    value: `${best.prix?.prix} MAD`,
                    color: 'text-emerald-700',
                    bg: 'from-emerald-50 to-teal-50',
                    border: 'border-emerald-200',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                  },
                  {
                    label: 'Trajet le plus rapide',
                    Icon: Zap,
                    data: best.duree,
                    value: fmt(best.duree?.dureeMinutes ?? 0),
                    color: 'text-violet-700',
                    bg: 'from-violet-50 to-purple-50',
                    border: 'border-violet-200',
                    iconBg: 'bg-violet-100',
                    iconColor: 'text-violet-600',
                  },
                  {
                    label: 'Meilleure note',
                    Icon: Award,
                    data: best.note,
                    value: `${best.note?.note?.toFixed(1)}/5`,
                    color: 'text-amber-700',
                    bg: 'from-amber-50 to-yellow-50',
                    border: 'border-amber-200',
                    iconBg: 'bg-amber-100',
                    iconColor: 'text-amber-600',
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <card.Icon size={17} className={card.iconColor} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                        <p className="font-semibold text-slate-800 text-sm mt-0.5">{card.data?.compagnieNom}</p>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Tableau comparatif */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={16} className="text-violet-500" />
                    {villeDepart} → {villeArrivee}
                    <span className="text-slate-400 font-normal text-sm">({resultats.length} compagnies)</span>
                  </h2>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Compagnie</th>
                        <th
                          className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-violet-600 transition select-none"
                          onClick={() => toggleSort('prix')}
                        >
                          <span className="flex items-center gap-1.5">Prix <SortIcon col="prix" /></span>
                        </th>
                        <th
                          className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-violet-600 transition select-none"
                          onClick={() => toggleSort('duree')}
                        >
                          <span className="flex items-center gap-1.5">Durée <SortIcon col="duree" /></span>
                        </th>
                        <th
                          className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-violet-600 transition select-none"
                          onClick={() => toggleSort('note')}
                        >
                          <span className="flex items-center gap-1.5">Note <SortIcon col="note" /></span>
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sorted.map((comp, idx) => {
                        const isBestPrice = best.prix?.compagnieNom === comp.compagnieNom;
                        const isBestDuration = best.duree?.compagnieNom === comp.compagnieNom;
                        const isBestNote = best.note?.compagnieNom === comp.compagnieNom;
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 transition-colors ${idx === 0 ? 'bg-violet-50/30' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Building2 size={16} className="text-violet-600" />
                                </div>
                                <span className="font-semibold text-slate-800 text-sm">{comp.compagnieNom}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-900">{comp.prix} MAD</span>
                              {isBestPrice && (
                                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                                  🏆 Meilleur
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="flex items-center gap-1.5 text-slate-600 text-sm">
                                <Clock size={13} className="text-slate-400" />
                                {fmt(comp.dureeMinutes)}
                                {isBestDuration && (
                                  <span className="ml-1 text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold">
                                    ⚡ Rapide
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <StarsRating note={comp.note} />
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                href={`/fr/recherche?depart=${encodeURIComponent(villeDepart)}&arrivee=${encodeURIComponent(villeArrivee)}&compagnie=${encodeURIComponent(comp.compagnieNom)}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition"
                              >
                                Réserver <ArrowRight size={13} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {sorted.map((comp, idx) => {
                    const isBestPrice = best.prix?.compagnieNom === comp.compagnieNom;
                    return (
                      <div key={idx} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                              <Building2 size={14} className="text-violet-600" />
                            </div>
                            <span className="font-semibold text-slate-800 text-sm">{comp.compagnieNom}</span>
                          </div>
                          <Link
                            href={`/fr/recherche?depart=${encodeURIComponent(villeDepart)}&arrivee=${encodeURIComponent(villeArrivee)}&compagnie=${encodeURIComponent(comp.compagnieNom)}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg"
                          >
                            Réserver <ArrowRight size={12} />
                          </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-slate-400 mb-0.5">Prix</p>
                            <p className="font-bold text-slate-800 text-sm">{comp.prix} MAD</p>
                            {isBestPrice && <p className="text-[10px] text-emerald-600 mt-0.5">🏆 Meilleur</p>}
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-slate-400 mb-0.5">Durée</p>
                            <p className="font-bold text-slate-700 text-sm">{fmt(comp.dureeMinutes)}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-slate-400 mb-1">Note</p>
                            <div className="flex justify-center">
                              <Star size={12} className="text-amber-400 fill-amber-400" />
                              <span className="text-xs font-bold text-slate-700 ml-1">{comp.note}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Comparaison en cours…</p>
        </div>
      )}
    </div>
  );
}
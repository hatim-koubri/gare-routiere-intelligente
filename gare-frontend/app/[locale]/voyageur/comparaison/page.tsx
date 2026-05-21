'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import {
  Search, Star, Clock, ArrowLeft, Building2,
  TrendingUp, Trophy, Zap, Award, ArrowRight,
  MapPin, AlertCircle, ChevronDown, ChevronUp, GitCompare, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComparaisonCompagnie {
  compagnieNom: string;
  prix: number;
  dureeMinutes: number;
  note: number;
  nbAvis: number;
}

function StarsRating({ note, nbAvis = 0 }: { note: number; nbAvis?: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12}
            className={i < Math.floor(note) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-zinc-700 fill-slate-200 dark:fill-zinc-700'}
          />
        ))}
        <span className="ml-1.5 text-xs font-black text-slate-700 dark:text-zinc-300">{note.toFixed(1)}</span>
      </div>
      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{nbAvis} avis</span>
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

  if (!authLoading && !user) { router.push('/fr/auth/login'); return null; }

  const handleSearch = async () => {
    if (!villeDepart.trim() || !villeArrivee.trim()) { setError('Veuillez saisir une ville de départ et une ville d\'arrivée'); return; }
    setLoading(true); setRechercheFaite(true); setError(null);
    try {
      const res = await apiClient.get('/voyageur/recherche/comparaison', { params: { villeDepart, villeArrivee } });
      setResultats(res.data || []);
      if (!res.data?.length) setError('Aucune compagnie trouvée pour ce trajet');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la comparaison');
      setResultats([]);
    } finally { setLoading(false); }
  };

  const fmt = (min: number) => {
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return `${m} min`;
    if (!m) return `${h} h`;
    return `${h} h ${m} min`;
  };

  const sorted = [...resultats].sort((a, b) => {
    const val = sortBy === 'prix' ? a.prix - b.prix : sortBy === 'duree' ? a.dureeMinutes - b.dureeMinutes : b.note - a.note;
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
      ? sortAsc ? <ChevronUp size={13} className="text-orange-500" /> : <ChevronDown size={13} className="text-orange-500" />
      : <ChevronDown size={13} className="text-slate-300 dark:text-zinc-600" />;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-md" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl flex items-center justify-center flex-shrink-0">
              <GitCompare size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={13} className="text-orange-200" />
                <span className="text-orange-100 text-xs font-bold uppercase tracking-widest">Analyse comparative</span>
              </div>
              <h1 className="text-2xl font-black leading-tight">Comparer les compagnies</h1>
              <p className="text-orange-100 text-sm mt-0.5">Trouvez la meilleure offre prix / durée / avis</p>
            </div>
          </div>
          <Link
            href="/fr/voyageur/dashboard"
            className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/25 transition"
          >
            <ArrowLeft size={15} /> Retour
          </Link>
        </div>
      </motion.div>

      {/* ── Search Form ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-50 dark:border-zinc-800">
          <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin size={16} className="text-orange-500" /> Saisir votre trajet
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {[
              { label: 'Ville de départ', placeholder: 'Ex: Casablanca', value: villeDepart, set: setVilleDepart, icon: '🛫' },
              { label: 'Ville d\'arrivée', placeholder: 'Ex: Marrakech', value: villeArrivee, set: setVilleArrivee, icon: '🛬' },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                  {f.icon} {f.label}
                </label>
                <input
                  type="text"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                />
              </div>
            ))}
          </div>

          <AnimatePresence>
            {error && !rechercheFaite && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold"
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-black text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200/50 dark:shadow-none"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={17} />}
            Lancer la comparaison
          </button>
        </div>
      </motion.div>

      {/* ── Loading ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-orange-200/30" />
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">Comparaison des compagnies en cours…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {rechercheFaite && !loading && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {error ? (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={24} className="text-amber-600 dark:text-amber-400" />
                </div>
                <p className="font-black text-amber-800 dark:text-amber-300 mb-1">Aucun résultat</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
              </div>
            ) : resultats.length > 0 ? (
              <>
                {/* ── Podium ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Meilleur prix', Icon: Trophy, data: best.prix, value: `${best.prix?.prix} MAD`, gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', val_color: 'text-emerald-700 dark:text-emerald-400' },
                    { label: 'Trajet le plus rapide', Icon: Zap, data: best.duree, value: fmt(best.duree?.dureeMinutes ?? 0), gradient: 'from-orange-500 to-red-500', bg: 'from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10', border: 'border-orange-200 dark:border-orange-500/20', val_color: 'text-orange-700 dark:text-orange-400' },
                    { label: 'Meilleure note', Icon: Award, data: best.note, value: `${best.note?.note?.toFixed(1)}/5`, gradient: 'from-amber-500 to-yellow-500', bg: 'from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10', border: 'border-amber-200 dark:border-amber-500/20', val_color: 'text-amber-700 dark:text-amber-400' },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                          <card.Icon size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wide">{card.label}</p>
                          <p className="font-black text-slate-800 dark:text-white text-sm">{card.data?.compagnieNom}</p>
                        </div>
                      </div>
                      <p className={`text-3xl font-black ${card.val_color}`}>{card.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* ── Tableau Desktop ── */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-orange-500" />
                      {villeDepart} → {villeArrivee}
                      <span className="text-slate-400 dark:text-zinc-500 font-normal text-sm">({resultats.length} compagnies)</span>
                    </h2>
                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">Triez les colonnes →</span>
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800">
                          <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Compagnie</th>
                          {(['prix', 'duree', 'note'] as const).map(col => (
                            <th key={col}
                              className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-orange-500 transition select-none"
                              onClick={() => toggleSort(col)}
                            >
                              <span className="flex items-center gap-1.5">
                                {col === 'prix' ? 'Prix' : col === 'duree' ? 'Durée' : 'Note'}
                                <SortIcon col={col} />
                              </span>
                            </th>
                          ))}
                          <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                        {sorted.map((comp, idx) => {
                          const isFirst = idx === 0;
                          const isBestPrice = best.prix?.compagnieNom === comp.compagnieNom;
                          const isBestDuration = best.duree?.compagnieNom === comp.compagnieNom;
                          const isBestNote = best.note?.compagnieNom === comp.compagnieNom;
                          return (
                            <motion.tr
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className={`transition-colors ${isFirst ? 'bg-orange-50/40 dark:bg-orange-500/5' : 'hover:bg-orange-50/30 dark:hover:bg-zinc-800/50'}`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isFirst ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10'}`}>
                                    <Building2 size={15} className={isFirst ? 'text-white' : 'text-orange-500'} />
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-800 dark:text-white text-sm">{comp.compagnieNom}</p>
                                    {isFirst && <span className="text-[10px] font-black text-orange-500 uppercase tracking-wide">⭐ Recommandé</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-slate-900 dark:text-white">{comp.prix} MAD</span>
                                  {isBestPrice && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black">🏆 Moins cher</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 text-sm font-semibold">
                                    <Clock size={13} className="text-orange-400" /> {fmt(comp.dureeMinutes)}
                                  </span>
                                  {isBestDuration && <span className="text-[10px] bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-black">⚡ Rapide</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <StarsRating note={comp.note} nbAvis={comp.nbAvis} />
                                  {isBestNote && <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-black">🥇 Top</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Link
                                  href={`/fr/recherche?depart=${encodeURIComponent(villeDepart)}&arrivee=${encodeURIComponent(villeArrivee)}&compagnie=${encodeURIComponent(comp.compagnieNom)}`}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black rounded-xl hover:opacity-90 transition shadow-md shadow-orange-200/40 dark:shadow-none"
                                >
                                  Réserver <ArrowRight size={13} />
                                </Link>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Mobile Cards ── */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800">
                    {sorted.map((comp, idx) => {
                      const isBestPrice = best.prix?.compagnieNom === comp.compagnieNom;
                      return (
                        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${idx === 0 ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-orange-100 dark:bg-orange-500/10'}`}>
                                <Building2 size={14} className={idx === 0 ? 'text-white' : 'text-orange-500'} />
                              </div>
                              <div>
                                <p className="font-black text-slate-800 dark:text-white text-sm">{comp.compagnieNom}</p>
                                {idx === 0 && <p className="text-[10px] text-orange-500 font-black">⭐ Recommandé</p>}
                              </div>
                            </div>
                            <Link
                              href={`/fr/recherche?depart=${encodeURIComponent(villeDepart)}&arrivee=${encodeURIComponent(villeArrivee)}&compagnie=${encodeURIComponent(comp.compagnieNom)}`}
                              className="flex items-center gap-1 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black rounded-xl hover:opacity-90 transition shadow-sm shadow-orange-200/40 dark:shadow-none"
                            >
                              Réserver <ArrowRight size={11} />
                            </Link>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1 font-bold uppercase tracking-wide">Prix</p>
                              <p className="font-black text-slate-800 dark:text-white text-sm">{comp.prix} MAD</p>
                              {isBestPrice && <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-black">🏆</p>}
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1 font-bold uppercase tracking-wide">Durée</p>
                              <p className="font-black text-slate-700 dark:text-zinc-300 text-sm">{fmt(comp.dureeMinutes)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1 font-bold uppercase tracking-wide">Note</p>
                              <div className="flex items-center justify-center gap-0.5">
                                <Star size={11} className="text-amber-400 fill-amber-400" />
                                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">{comp.note.toFixed(1)}</span>
                              </div>
                              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">{comp.nbAvis} avis</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
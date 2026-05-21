'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { favorisApi, FavoriDTO } from '@/lib/api/voyageur/favoris';
import {
  Heart, Trash2, ArrowRight, Search, Bus,
  LayoutGrid, Table2, Clock, Star
} from 'lucide-react';
import { motion } from 'framer-motion';

type ViewMode = 'cards' | 'table';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CompagnieBadge({ nom }: { nom: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    'CTM': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'Supratours': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'Ghazala': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'SAT': { bg: 'bg-purple-100', text: 'text-purple-700' },
  };
  const c = colors[nom] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
      {nom}
    </span>
  );
}

export default function FavorisPage() {
  const router = useRouter();
  const [favoris, setFavoris] = useState<FavoriDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    loadFavoris();
  }, []);

  const loadFavoris = async () => {
    try {
      const data = await favorisApi.getAll();
      setFavoris(data);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const supprimer = async (ligneId: number) => {
    try {
      await favorisApi.supprimer(ligneId);
      setFavoris(prev => prev.filter(f => f.ligneId !== ligneId));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mes favoris</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">{favoris.length} trajet{favoris.length !== 1 ? 's' : ''} favori{favoris.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-zinc-700 text-orange-500 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 text-orange-500 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'}`}
            >
              <Table2 size={16} />
            </button>
          </div>
          <button
            onClick={() => router.push('/fr/recherche')}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            <Search size={16} />
            Nouvelle recherche
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 animate-pulse">
              <div className="h-6 bg-slate-100 dark:bg-zinc-800 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : favoris.length === 0 ? (
        /* ── Empty state ── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-500/10 dark:to-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Heart size={28} className="text-rose-400" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-zinc-300 mb-2">Aucun favori</h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mb-5">Ajoutez vos trajets fréquents pour y accéder rapidement</p>
          <button
            onClick={() => router.push('/fr/recherche')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            <Search size={16} />
            Rechercher un trajet
          </button>
        </motion.div>
      ) : viewMode === 'cards' ? (
        /* ── VUE CARTES ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {favoris.map((f, index) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
            >
              {/* Top gradient band */}
              <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500" />

              <div className="p-6">
                {/* Heart icon + date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-500/10 dark:to-pink-500/10 rounded-xl flex items-center justify-center">
                    <Heart size={20} className="text-rose-500" />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Clock size={11} />
                    {formatDate(f.dateCreation)}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="text-left">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Départ</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{f.villeDepart}</p>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <Bus size={16} className="text-orange-500 mb-1" />
                    <div className="w-8 border-t-2 border-dashed border-slate-200 dark:border-zinc-700" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Arrivée</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{f.villeArrivee}</p>
                  </div>
                </div>

                {/* Compagnie */}
                <div className="flex items-center justify-center mb-4">
                  <CompagnieBadge nom={f.compagnieNom} />
                </div>

                {/* Prix */}
                <div className="text-center mb-4">
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Prix à partir de</p>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-red-500">{f.prixBase} <span className="text-sm">DH</span></p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-zinc-800">
                  <button
                    onClick={() => supprimer(f.ligneId)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                  >
                    <Trash2 size={14} />
                    Retirer
                  </button>
                  <button
                    onClick={() => router.push(`/fr/recherche?villeDepart=${f.villeDepart}&villeArrivee=${f.villeArrivee}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm shadow-orange-200/50 dark:shadow-none"
                  >
                    <Search size={14} />
                    Rechercher
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── VUE TABLEAU ── */
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50">
                  <th className="text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-5 py-4">
                    <div className="flex items-center gap-2"><Star size={12} />Favori</div>
                  </th>
                  <th className="text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-5 py-4">Trajet</th>
                  <th className="text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-5 py-4">Compagnie</th>
                  <th className="text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-5 py-4">Ajouté le</th>
                  <th className="text-right text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-5 py-4">Prix</th>
                  <th className="text-right text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {favoris.map((f) => (
                  <tr key={f.id} className="hover:bg-orange-50/30 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="w-9 h-9 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center justify-center">
                        <Heart size={16} className="text-rose-500" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{f.villeDepart}</span>
                        <ArrowRight size={12} className="text-orange-400" />
                        <span className="font-bold text-slate-800 dark:text-white">{f.villeArrivee}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><CompagnieBadge nom={f.compagnieNom} /></td>
                    <td className="px-5 py-4 text-slate-500 dark:text-zinc-400 text-xs">{formatDate(f.dateCreation)}</td>
                    <td className="px-5 py-4 text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{f.prixBase} DH</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => supprimer(f.ligneId)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                          title="Retirer des favoris"
                        >
                          <Trash2 size={15} />
                        </button>
                        <Link
                          href={`/fr/recherche?villeDepart=${f.villeDepart}&villeArrivee=${f.villeArrivee}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs font-bold hover:opacity-90 transition"
                        >
                          <Search size={12} />
                          Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import {
  Calendar, Clock, Bus, Search,
  ArrowRight, User, History, CheckCircle2, XCircle,
  LayoutGrid, Table2, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TicketInfo {
  id: number;
  statut?: string;
  numeroSiege?: string;
  nomPassager?: string;
  prenomPassager?: string;
}

interface TrajetHistorique {
  id: number;
  trajet?: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule?: string;
    quaiNumero?: number;
    prixBase?: number;
  };
  dateDepart?: string;
  villeDepart?: string;
  villeArrivee?: string;
  compagnieNom?: string;
  statut: string;
  prixTotal: number;
  nombrePassagers?: number;
  membres?: { id: number }[];
  tickets?: TicketInfo[];
}

type ViewMode = 'cards' | 'table';

function getVoyageStatut(r: TrajetHistorique): { label: string; color: string; bg: string; border: string; Icon: React.ElementType } {
  const dateDep = r.trajet?.dateDepart ? new Date(r.trajet.dateDepart) : null;
  const isMissed = dateDep && dateDep < new Date() && r.statut === 'CONFIRMEE' && r.tickets?.some(t => t.statut === 'ACTIF');

  if (isMissed) return { label: 'RATÉ', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', Icon: XCircle };
  if (r.statut === 'CONFIRMEE' || r.statut === 'TERMINE') return { label: 'TERMINÉ', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', Icon: CheckCircle2 };
  if (r.statut === 'ANNULEE') return { label: 'ANNULÉ', color: 'text-slate-600 dark:text-zinc-400', bg: 'bg-slate-100 dark:bg-zinc-700', border: 'border-slate-200 dark:border-zinc-600', Icon: XCircle };
  if (r.statut === 'REMBOURSEE') return { label: 'REMBOURSÉ', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', Icon: History };
  if (r.statut === 'EN_ATTENTE') return { label: 'EN ATTENTE', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', Icon: Clock };
  return { label: r.statut, color: 'text-slate-600 dark:text-zinc-400', bg: 'bg-slate-100 dark:bg-zinc-700', border: 'border-slate-200 dark:border-zinc-600', Icon: Clock };
}

export default function HistoriquePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [historique, setHistorique] = useState<TrajetHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAnnee, setFilterAnnee] = useState<string>('TOUS');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    if (!authLoading && !user) router.push('/fr/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadHistorique();
  }, [user]);

  const loadHistorique = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/voyageur/reservations');
      const reservations = res.data || [];
      const passes = reservations.filter((r: any) => {
        if (!r.trajet?.dateDepart) return false;
        return new Date(r.trajet.dateDepart) < new Date();
      });
      setHistorique(passes);
    } catch {
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  const annees = [...new Set(historique.map(r => new Date(r.trajet?.dateDepart || '').getFullYear().toString()))].sort();

  const filtered = historique.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      const match = r.trajet?.villeDepart?.toLowerCase().includes(q) ||
        r.trajet?.villeArrivee?.toLowerCase().includes(q) ||
        r.trajet?.compagnieNom?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterAnnee !== 'TOUS') {
      const annee = new Date(r.trajet?.dateDepart || '').getFullYear().toString();
      if (annee !== filterAnnee) return false;
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mes historiques</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">
            {filtered.length} trajet{filtered.length !== 1 ? 's' : ''} passé{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-zinc-700 text-orange-500 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 text-orange-500 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'}`}
            >
              <Table2 size={16} />
            </button>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/50 dark:shadow-none">
            <History size={18} className="text-white" />
          </div>
        </div>
      </motion.div>

      {/* ── Filtres ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-4"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par ville ou compagnie..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>
          <select
            value={filterAnnee}
            onChange={e => setFilterAnnee(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          >
            <option value="TOUS">Toutes les années</option>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </motion.div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        /* ── Empty state ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <History size={28} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-zinc-300 mb-2">Aucun historique</h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500">Vous n&apos;avez pas encore de trajets passés.</p>
        </motion.div>
      ) : viewMode === 'cards' ? (
        /* ── VUE CARTES ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((r, index) => {
            const dateDep = r.trajet?.dateDepart ? new Date(r.trajet.dateDepart) : null;
            const st = getVoyageStatut(r);

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/fr/voyageur/reservations/${r.id}`} className="block group">
                  <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    {/* Top band */}
                    <div className={`h-1.5 ${
                      st.label === 'RATÉ' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                      st.label === 'TERMINÉ' ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                      'bg-gradient-to-r from-slate-300 to-slate-400'
                    }`} />

                    <div className="p-6">
                      {/* Badge + ID */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.bg} ${st.color} ${st.border} border`}>
                          <st.Icon size={12} />
                          {st.label}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">#{r.id}</span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="text-left">
                          <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Départ</p>
                          <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{r.trajet?.villeDepart ?? '?'}</p>
                        </div>
                        <div className="flex flex-col items-center px-2">
                          <Bus size={16} className="text-orange-500 mb-1" />
                          <div className="w-8 border-t-2 border-dashed border-slate-200 dark:border-zinc-700" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Arrivée</p>
                          <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{r.trajet?.villeArrivee ?? '?'}</p>
                        </div>
                      </div>

                      {/* Date + Heure */}
                      {dateDep && (
                        <div className="flex items-center justify-center gap-3 mb-4 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 rounded-xl py-2.5 px-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-orange-400" />
                            {dateDep.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-slate-200 dark:text-zinc-600">|</span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-orange-400" />
                            {dateDep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
                          <User size={11} />
                          {r.nombrePassagers || r.membres?.length || 1} passager(s)
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{r.prixTotal?.toFixed(0)} MAD</p>
                        </div>
                      </div>

                      {/* Hover link */}
                      <div className="mt-3 flex items-center justify-center gap-1 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                        <Eye size={13} />
                        Voir détails <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── VUE TABLEAU ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50">
                  {['N°', 'Trajet', 'Compagnie', 'Date', 'Heure', 'Prix', 'Statut', ''].map((h, i) => (
                    <th key={i} className={`text-left text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-5 py-4 ${i === 5 ? 'text-right' : i === 6 ? 'text-center' : i === 7 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {filtered.map((r) => {
                  const dateDep = r.trajet?.dateDepart ? new Date(r.trajet.dateDepart) : null;
                  const st = getVoyageStatut(r);
                  return (
                    <tr key={r.id} className="hover:bg-orange-50/30 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-5 py-4 text-xs font-mono text-slate-400 dark:text-zinc-500">#{r.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white">{r.trajet?.villeDepart ?? '?'}</span>
                          <ArrowRight size={12} className="text-orange-400" />
                          <span className="font-bold text-slate-800 dark:text-white">{r.trajet?.villeArrivee ?? '?'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-zinc-400">{r.trajet?.compagnieNom ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-zinc-400">
                        {dateDep ? dateDep.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-zinc-400">
                        {dateDep ? dateDep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{r.prixTotal?.toFixed(0)} MAD</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.color} ${st.border} border`}>
                          <st.Icon size={10} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/fr/voyageur/reservations/${r.id}`}
                          className="inline-flex items-center gap-1 text-orange-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Détails <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

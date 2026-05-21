'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import {
  Calendar, Clock, MapPin, Eye, Search, Filter,
  ChevronRight, Ticket, Bus, AlertCircle, RefreshCw,
  CheckCircle2, XCircle, Hourglass, ArrowRight, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Reservation {
  id: number;
  dateReservation: string;
  prixTotal: number;
  statut: string;
  nbModif?: number;
  trajet?: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule?: string;
    quaiNumero?: number;
    dureeMinutes?: number;
  };
  tickets?: Array<{
    id: number;
    numeroSiege: string;
    nomPassager: string;
    prenomPassager: string;
    statut?: string;
  }>;
}

const STATUTS = [
  { value: 'all', label: 'Tous' },
  { value: 'CONFIRMEE', label: 'Confirmées' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'ANNULEE', label: 'Annulées' },
  { value: 'REMBOURSEE', label: 'Remboursées' },
];

function StatutBadge({ statut }: { statut: string }) {
  const cfg: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    CONFIRMEE: { label: 'Confirmée', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', Icon: CheckCircle2 },
    EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', Icon: Hourglass },
    ANNULEE: { label: 'Annulée', cls: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20', Icon: XCircle },
    REMBOURSEE: { label: 'Remboursée', cls: 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-zinc-700 dark:text-zinc-400 dark:border-zinc-600', Icon: AlertCircle },
  };
  const { label, cls, Icon } = cfg[statut] ?? { label: statut, cls: 'bg-slate-50 text-slate-600 border border-slate-200', Icon: AlertCircle };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

export default function MesReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filtered, setFiltered] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/fr/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadReservations();
  }, [user]);

  useEffect(() => {
    let res = [...reservations];
    if (statut !== 'all') res = res.filter(r => r.statut === statut);
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(r =>
        r.trajet?.villeDepart?.toLowerCase().includes(q) ||
        r.trajet?.villeArrivee?.toLowerCase().includes(q) ||
        r.trajet?.compagnieNom?.toLowerCase().includes(q) ||
        r.id.toString().includes(q)
      );
    }
    setFiltered(res);
  }, [search, statut, reservations]);

  const loadReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/voyageur/reservations');
      setReservations(res.data || []);
      setFiltered(res.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  };

  const canModify = (r: Reservation) => {
    if (!r.trajet?.dateDepart) return false;
    const h = (new Date(r.trajet.dateDepart).getTime() - Date.now()) / 3600000;
    return r.statut === 'CONFIRMEE' && h > 24;
  };

  const canChangeSieges = (r: Reservation) => {
    if (!r.trajet?.dateDepart) return false;
    return r.statut === 'CONFIRMEE' && new Date(r.trajet.dateDepart) > new Date();
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement de vos réservations…</p>
      </div>
    );
  }

  const stats = {
    total: reservations.length,
    confirmees: reservations.filter(r => r.statut === 'CONFIRMEE').length,
    attente: reservations.filter(r => r.statut === 'EN_ATTENTE').length,
    annulees: reservations.filter(r => r.statut === 'ANNULEE').length,
  };

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mes réservations</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">
            {reservations.length} réservation{reservations.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-500 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 transition"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/fr/recherche"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            <Zap size={15} />
            Nouvelle réservation
          </Link>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total', value: stats.total, gradient: 'from-slate-400 to-slate-600', bg: 'bg-slate-50 dark:bg-zinc-800/50', text: 'text-slate-700 dark:text-zinc-300' },
          { label: 'Confirmées', value: stats.confirmees, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'En attente', value: stats.attente, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
          { label: 'Annulées', value: stats.annulees, gradient: 'from-red-400 to-rose-500', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className={`${s.bg} rounded-2xl p-4 text-center border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30 transition-all`}
          >
            <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filtres ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-4"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par ville, compagnie ou n°…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUTS.map(s => (
              <button
                key={s.value}
                onClick={() => setStatut(s.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  statut === s.value
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-200/50'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-zinc-700 hover:text-orange-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Erreur ── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          <button onClick={loadReservations} className="ml-auto text-red-600 dark:text-red-400 text-sm font-semibold hover:underline">
            Réessayer
          </button>
        </div>
      )}

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-12 text-center"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={24} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-zinc-300 mb-2">
            {search || statut !== 'all' ? 'Aucun résultat' : 'Aucune réservation'}
          </h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mb-4">
            {search || statut !== 'all'
              ? "Essayez d'autres filtres"
              : 'Commencez par réserver un voyage'}
          </p>
          {search || statut !== 'all' ? (
            <button
              onClick={() => { setSearch(''); setStatut('all'); }}
              className="text-orange-500 text-sm font-bold hover:underline"
            >
              Effacer les filtres
            </button>
          ) : (
            <Link
              href="/fr/recherche"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none"
            >
              Rechercher un trajet <ArrowRight size={14} />
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((res, index) => {
            const dateDep = res.trajet?.dateDepart ? new Date(res.trajet.dateDepart) : null;
            const isUpcoming = dateDep && dateDep > new Date() && res.statut === 'CONFIRMEE';
            const isMissed = dateDep && dateDep < new Date() && res.statut === 'CONFIRMEE' && res.tickets?.some(t => t.statut === 'ACTIF');
            const isPastTrip = dateDep && dateDep < new Date() && res.statut === 'CONFIRMEE' && !isMissed;

            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm hover:shadow-md dark:hover:shadow-none transition-all duration-200 overflow-hidden
                  ${isUpcoming
                    ? 'border-l-4 border-l-orange-400 border-slate-100 dark:border-zinc-800'
                    : 'border-slate-100 dark:border-zinc-800'
                  }`}
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left: Icon + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isUpcoming
                          ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-md shadow-orange-200/50'
                          : 'bg-slate-100 dark:bg-zinc-800'
                      }`}>
                        <Bus size={20} className={isUpcoming ? 'text-white' : 'text-slate-500 dark:text-zinc-400'} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <StatutBadge statut={res.statut} />
                          {isMissed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                              <XCircle size={11} />
                              Voyage raté
                            </span>
                          )}
                          {isPastTrip && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-600">
                              <Clock size={11} />
                              Voyage passé
                            </span>
                          )}
                          <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">#{res.id}</span>
                          {res.nbModif && res.nbModif > 0 && (
                            <span className="text-xs bg-orange-50 dark:bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                              Modifiée {res.nbModif}×
                            </span>
                          )}
                        </div>

                        <p className="font-black text-slate-800 dark:text-white">
                          {res.trajet?.villeDepart ?? '?'} → {res.trajet?.villeArrivee ?? '?'}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Bus size={11} className="text-orange-400" />
                            {res.trajet?.compagnieNom ?? 'Compagnie inconnue'}
                          </span>
                          {dateDep && (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-orange-400" />
                                {dateDep.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-orange-400" />
                                {dateDep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                          {res.trajet?.quaiNumero && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-orange-400" />
                              Quai {res.trajet.quaiNumero}
                            </span>
                          )}
                        </div>

                        {res.tickets && res.tickets.length > 0 && (
                          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
                            <Ticket size={11} />
                            {res.tickets.length} billet(s) · Sièges : {res.tickets.map(t => t.numeroSiege).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Price + Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 md:flex-col md:items-end">
                      <p className="text-lg font-black text-slate-800 dark:text-white">{res.prixTotal} MAD</p>

                      <div className="flex items-center gap-2">
                        {isUpcoming && canChangeSieges(res) && (
                          <Link
                            href={`/fr/voyageur/reservations/${res.id}/changer-sieges`}
                            className="px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 rounded-xl text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-500/20 transition"
                          >
                            Changer sièges
                          </Link>
                        )}
                        {isUpcoming && canModify(res) && (
                          <Link
                            href={`/fr/voyageur/reservations/${res.id}/modifier`}
                            className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 transition"
                          >
                            Modifier
                          </Link>
                        )}
                        <Link
                          href={`/fr/voyageur/reservations/${res.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm shadow-orange-200/50 dark:shadow-none"
                        >
                          <Eye size={13} />
                          Détails
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
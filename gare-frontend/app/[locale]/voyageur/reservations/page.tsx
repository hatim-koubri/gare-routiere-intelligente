'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import {
  Calendar, Clock, MapPin, Eye, Search, Filter,
  ChevronRight, Ticket, Bus, AlertCircle, RefreshCw,
  CheckCircle2, XCircle, Hourglass, ArrowRight
} from 'lucide-react';

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
    CONFIRMEE: { label: 'Confirmée', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', Icon: CheckCircle2 },
    EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200', Icon: Hourglass },
    ANNULEE: { label: 'Annulée', cls: 'bg-red-50 text-red-600 border border-red-200', Icon: XCircle },
    REMBOURSEE: { label: 'Remboursée', cls: 'bg-slate-50 text-slate-600 border border-slate-200', Icon: AlertCircle },
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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement de vos réservations…</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes réservations</h1>
          <p className="text-slate-500 text-sm mt-0.5">{reservations.length} réservation{reservations.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:border-slate-300 transition"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/fr/recherche"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Ticket size={15} />
            Nouvelle réservation
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Confirmées', value: stats.confirmees, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'En attente', value: stats.attente, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Annulées', value: stats.annulees, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par ville, compagnie ou n°…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUTS.map(s => (
              <button
                key={s.value}
                onClick={() => setStatut(s.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  statut === s.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={loadReservations} className="ml-auto text-red-600 text-sm font-medium hover:underline">
            Réessayer
          </button>
        </div>
      )}

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={24} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">
            {search || statut !== 'all' ? 'Aucun résultat' : 'Aucune réservation'}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {search || statut !== 'all'
              ? 'Essayez d\'autres filtres'
              : 'Commencez par réserver un voyage'}
          </p>
          {search || statut !== 'all' ? (
            <button
              onClick={() => { setSearch(''); setStatut('all'); }}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Effacer les filtres
            </button>
          ) : (
            <Link
              href="/fr/recherche"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Rechercher un trajet <ArrowRight size={14} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((res) => {
            const dateDep = res.trajet?.dateDepart ? new Date(res.trajet.dateDepart) : null;
            const isUpcoming = dateDep && dateDep > new Date() && res.statut === 'CONFIRMEE';

            return (
              <div
                key={res.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
                  ${isUpcoming ? 'border-l-4 border-l-emerald-500 border-slate-100' : 'border-slate-100'}`}
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left: Icon + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isUpcoming ? 'bg-emerald-50' : 'bg-blue-50'
                      }`}>
                        <Bus size={20} className={isUpcoming ? 'text-emerald-600' : 'text-blue-600'} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <StatutBadge statut={res.statut} />
                          <span className="text-xs text-slate-400">#{res.id}</span>
                          {res.nbModif && res.nbModif > 0 && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              Modifiée {res.nbModif}×
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-slate-800">
                          {res.trajet?.villeDepart ?? '?'} → {res.trajet?.villeArrivee ?? '?'}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Bus size={11} className="text-slate-400" />
                            {res.trajet?.compagnieNom ?? 'Compagnie inconnue'}
                          </span>
                          {dateDep && (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" />
                                {dateDep.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-slate-400" />
                                {dateDep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                          {res.trajet?.quaiNumero && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              Quai {res.trajet.quaiNumero}
                            </span>
                          )}
                        </div>

                        {res.tickets && res.tickets.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                            <Ticket size={11} />
                            {res.tickets.length} billet(s) · Sièges : {res.tickets.map(t => t.numeroSiege).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Price + Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 md:flex-col md:items-end">
                      <p className="text-lg font-bold text-slate-800">{res.prixTotal} MAD</p>

                      <div className="flex items-center gap-2">
                        {isUpcoming && canChangeSieges(res) && (
                          <Link
                            href={`/fr/voyageur/reservations/${res.id}/changer-sieges`}
                            className="px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-semibold hover:bg-orange-100 transition"
                          >
                            Changer sièges
                          </Link>
                        )}
                        {isUpcoming && canModify(res) && (
                          <Link
                            href={`/fr/voyageur/reservations/${res.id}/modifier`}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                          >
                            Modifier
                          </Link>
                        )}
                        <Link
                          href={`/fr/voyageur/reservations/${res.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                        >
                          <Eye size={13} />
                          Détails
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
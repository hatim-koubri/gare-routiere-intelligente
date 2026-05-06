'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Clock, Calendar, Ticket,
  TrendingUp, CheckCircle2, AlertCircle, RefreshCw,
  Sparkles, ChevronRight, Bus, Wallet, Search, Star
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Reservation {
  id: number;
  dateReservation: string;
  prixTotal: number;
  statut: string;
  trajet?: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule?: string;
    quaiNumero?: number;
  };
  tickets?: Array<{
    id: number;
    numeroSiege: string;
    nomPassager: string;
    prenomPassager: string;
  }>;
}

interface Recommendation {
  id: number;
  dateDepart: string;
  villeDepart: string;
  villeArrivee: string;
  compagnieNom: string;
  prixBase: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={color} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { text: string; class: string }> = {
    CONFIRMEE: { text: 'Confirmée', class: 'bg-emerald-100 text-emerald-700' },
    EN_ATTENTE: { text: 'En attente', class: 'bg-amber-100 text-amber-700' },
    ANNULEE: { text: 'Annulée', class: 'bg-red-100 text-red-700' },
    REMBOURSEE: { text: 'Remboursée', class: 'bg-slate-100 text-slate-600' },
  };
  const cfg = map[statut] ?? { text: statut, class: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.class}`}>
      {cfg.text}
    </span>
  );
}

export default function VoyageurDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommandations, setRecommandations] = useState<Recommendation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/fr/auth/login');
      else if (user.role !== 'VOYAGEUR') {
        if (user.role === 'ADMIN') router.push('/fr/admin');
        else if (user.role === 'CHAUFFEUR') router.push('/fr/chauffeur/dashboard');
        else router.push('/fr/auth/login');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'VOYAGEUR') {
      loadAll();
    }
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadReservations(), loadRecommandations()]);
    setLoading(false);
  };

  const loadReservations = async () => {
    try {
      const res = await apiClient.get('/voyageur/reservations');
      setReservations(res.data || []);
    } catch { setReservations([]); }
  };

  const loadRecommandations = async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get('/voyageur/recherche/recommandations', {
        params: { voyageurId: user.id }
      });
      setRecommandations(res.data || []);
    } catch { setRecommandations([]); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement de votre tableau de bord…</p>
      </div>
    );
  }

  if (!user || user.role !== 'VOYAGEUR') return null;

  const today = new Date();
  const confirmees = reservations.filter(r => r.statut === 'CONFIRMEE');
  const reservationsAvenir = confirmees.filter(r => r.trajet?.dateDepart && new Date(r.trajet.dateDepart) > today);
  const reservationsPassees = confirmees.filter(r => r.trajet?.dateDepart && new Date(r.trajet.dateDepart) <= today);
  const totalDepense = confirmees.reduce((s, r) => s + (r.prixTotal || 0), 0);
  const dernieres = [...reservations]
    .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime())
    .slice(0, 4);

  const nextVoyage = reservationsAvenir[0];

  return (
    <div className="space-y-6 pb-10">

      {/* ── Hero Greeting ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-blue-200">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">
              {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              Bonjour, {user.prenom} 👋
            </h1>
            <p className="text-blue-200 mt-1 text-sm">
              {reservationsAvenir.length > 0
                ? `Vous avez ${reservationsAvenir.length} voyage${reservationsAvenir.length > 1 ? 's' : ''} à venir`
                : 'Prêt pour votre prochain voyage ?'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/fr/recherche"
              className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-all shadow-sm"
            >
              <Search size={16} />
              Rechercher
            </Link>
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition"
              title="Actualiser"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Prochain voyage ── */}
      {nextVoyage ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <h2 className="font-semibold text-slate-800 text-sm">Prochain voyage</h2>
            <span className="ml-auto text-xs text-slate-400">
              dans {Math.ceil((new Date(nextVoyage.trajet!.dateDepart).getTime() - today.getTime()) / 86400000)} j
            </span>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                {/* Route visuelle */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Départ</p>
                    <p className="font-bold text-slate-800 text-lg">{nextVoyage.trajet?.villeDepart}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="flex-1 h-px bg-slate-200" />
                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bus size={14} className="text-white" />
                    </div>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Arrivée</p>
                    <p className="font-bold text-slate-800 text-lg">{nextVoyage.trajet?.villeArrivee}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    {new Date(nextVoyage.trajet!.dateDepart).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long'
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-500" />
                    {new Date(nextVoyage.trajet!.dateDepart).toLocaleTimeString('fr-FR', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bus size={14} className="text-blue-500" />
                    {nextVoyage.trajet?.compagnieNom}
                  </span>
                  {nextVoyage.trajet?.quaiNumero && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-blue-500" />
                      Quai {nextVoyage.trajet.quaiNumero}
                    </span>
                  )}
                </div>

                {nextVoyage.tickets && nextVoyage.tickets.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Ticket size={13} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {nextVoyage.tickets.length} siège(s) : {nextVoyage.tickets.map(t => t.numeroSiege).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href={`/fr/voyageur/reservations/${nextVoyage.id}`}
                className="flex-shrink-0 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 self-start"
              >
                Voir les détails
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bus size={24} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Aucun voyage à venir</h3>
          <p className="text-sm text-slate-400 mb-4">Planifiez votre prochain déplacement dès maintenant</p>
          <Link
            href="/fr/recherche"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            <Search size={15} />
            Rechercher un trajet
          </Link>
        </div>
      )}

      {/* ── Stats KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Voyages total"
          value={confirmees.length}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Calendar}
          label="À venir"
          value={reservationsAvenir.length}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={CheckCircle2}
          label="Effectués"
          value={reservationsPassees.length}
          color="text-violet-600"
          bgColor="bg-violet-50"
        />
        <StatCard
          icon={Wallet}
          label="Total dépensé"
          value={`${totalDepense.toLocaleString()} MAD`}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* ── Grille : Dernières réservations + Actions rapides ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dernières réservations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Dernières réservations</h2>
            <Link
              href="/fr/voyageur/reservations"
              className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
            >
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>

          {dernieres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <Ticket size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">Aucune réservation encore</p>
              <Link href="/fr/recherche" className="text-blue-600 text-sm mt-2 hover:underline">
                Réservez votre premier voyage →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {dernieres.map((res) => (
                <Link
                  key={res.id}
                  href={`/fr/voyageur/reservations/${res.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bus size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {res.trajet?.villeDepart ?? '?'} → {res.trajet?.villeArrivee ?? '?'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {res.trajet?.compagnieNom ?? '—'}
                      {res.trajet?.dateDepart
                        ? ` · ${new Date(res.trajet.dateDepart).toLocaleDateString('fr-FR')}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge statut={res.statut} />
                    <span className="font-bold text-slate-700 text-sm">{res.prixTotal} MAD</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { label: 'Rechercher un trajet', href: '/fr/recherche', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Mes réservations', href: '/fr/voyageur/reservations', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Mes tickets', href: '/fr/voyageur/tickets', icon: Ticket, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Comparer des trajets', href: '/fr/voyageur/comparaison', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Déclarer un bagage', href: '/fr/voyageur/bagages/declarer', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group"
                >
                  <div className={`w-8 h-8 ${action.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <action.icon size={16} className={action.color} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex-1">
                    {action.label}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommandations ── */}
      {recommandations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="font-semibold text-slate-800">Recommandés pour vous</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommandations.slice(0, 3).map((trajet) => (
              <Link
                key={trajet.id}
                href={`/fr/recherche?depart=${encodeURIComponent(trajet.villeDepart)}&arrivee=${encodeURIComponent(trajet.villeArrivee)}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Star size={16} className="text-amber-500" />
                  </div>
                  <span className="font-bold text-blue-600">{trajet.prixBase} MAD</span>
                </div>
                <p className="font-semibold text-slate-800 mb-1">
                  {trajet.villeDepart} → {trajet.villeArrivee}
                </p>
                <p className="text-xs text-slate-400 mb-3">{trajet.compagnieNom}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(trajet.dateDepart).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 group-hover:gap-2 flex items-center gap-1 transition-all">
                    Réserver <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
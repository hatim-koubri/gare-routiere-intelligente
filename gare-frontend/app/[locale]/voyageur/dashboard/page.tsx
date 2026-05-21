'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Clock, Calendar, Ticket,
  TrendingUp, CheckCircle2, AlertCircle, RefreshCw,
  Sparkles, ChevronRight, Bus, Wallet, Search, Star, Zap
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { motion } from 'framer-motion';

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
  gradient,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-orange-400 to-red-500" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-black mt-1.5 bg-clip-text text-transparent bg-gradient-to-br ${gradient}`}>{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient} shadow-md`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { text: string; class: string }> = {
    CONFIRMEE: { text: 'Confirmée', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    EN_ATTENTE: { text: 'En attente', class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
    ANNULEE: { text: 'Annulée', class: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
    REMBOURSEE: { text: 'Remboursée', class: 'bg-slate-100 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400' },
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
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement de votre tableau de bord…</p>
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)' }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-sm" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-orange-100 text-sm font-medium mb-1">
              {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl md:text-3xl font-black leading-tight">
              Bonjour, {user.prenom} 👋
            </h1>
            <p className="text-orange-100 mt-1.5 text-sm">
              {reservationsAvenir.length > 0
                ? `Vous avez ${reservationsAvenir.length} voyage${reservationsAvenir.length > 1 ? 's' : ''} à venir`
                : 'Prêt pour votre prochain voyage ?'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/fr/recherche"
              className="flex items-center gap-2 bg-white text-orange-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl"
            >
              <Zap size={16} />
              Réserver
            </Link>
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition border border-white/20"
              title="Actualiser"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Stats KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ticket} label="Voyages total" value={confirmees.length} gradient="from-orange-400 to-orange-600" delay={0} />
        <StatCard icon={Calendar} label="À venir" value={reservationsAvenir.length} gradient="from-emerald-400 to-teal-600" delay={0.05} />
        <StatCard icon={CheckCircle2} label="Effectués" value={reservationsPassees.length} gradient="from-violet-400 to-purple-600" delay={0.1} />
        <StatCard icon={Wallet} label="Total dépensé" value={`${totalDepense.toLocaleString()} MAD`} gradient="from-red-400 to-rose-600" delay={0.15} />
      </div>

      {/* ── Prochain voyage ── */}
      {nextVoyage ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-slate-800 dark:text-white text-sm">Prochain voyage</h2>
            <span className="ml-auto text-xs font-semibold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full">
              dans {Math.ceil((new Date(nextVoyage.trajet!.dateDepart).getTime() - today.getTime()) / 86400000)} j
            </span>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                {/* Route visuelle */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mb-0.5 font-medium uppercase tracking-wide">Départ</p>
                    <p className="font-black text-slate-800 dark:text-white text-xl">{nextVoyage.trajet?.villeDepart}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-orange-200 dark:from-zinc-700 dark:to-orange-900" />
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200">
                      <Bus size={14} className="text-white" />
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-slate-200 dark:from-orange-900 dark:to-zinc-700" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mb-0.5 font-medium uppercase tracking-wide">Arrivée</p>
                    <p className="font-black text-slate-800 dark:text-white text-xl">{nextVoyage.trajet?.villeArrivee}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg px-3 py-1.5">
                    <Calendar size={13} className="text-orange-500" />
                    {new Date(nextVoyage.trajet!.dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg px-3 py-1.5">
                    <Clock size={13} className="text-orange-500" />
                    {new Date(nextVoyage.trajet!.dateDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg px-3 py-1.5">
                    <Bus size={13} className="text-orange-500" />
                    {nextVoyage.trajet?.compagnieNom}
                  </span>
                  {nextVoyage.trajet?.quaiNumero && (
                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg px-3 py-1.5">
                      <MapPin size={13} className="text-orange-500" />
                      Quai {nextVoyage.trajet.quaiNumero}
                    </span>
                  )}
                </div>

                {nextVoyage.tickets && nextVoyage.tickets.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Ticket size={13} className="text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      {nextVoyage.tickets.length} siège(s) : {nextVoyage.tickets.map(t => t.numeroSiege).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href={`/fr/voyageur/reservations/${nextVoyage.id}`}
                className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-orange-200/50 dark:shadow-none self-start"
              >
                Voir les détails
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-8 text-center"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bus size={24} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-zinc-300 mb-1">Aucun voyage à venir</h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mb-4">Planifiez votre prochain déplacement dès maintenant</p>
          <Link
            href="/fr/recherche"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-orange-200/50 dark:shadow-none"
          >
            <Search size={15} />
            Rechercher un trajet
          </Link>
        </motion.div>
      )}

      {/* ── Grille : Dernières réservations + Actions rapides ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dernières réservations */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="font-bold text-slate-800 dark:text-white">Dernières réservations</h2>
            <Link
              href="/fr/voyageur/reservations"
              className="text-sm text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1 transition-colors"
            >
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>

          {dernieres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center mb-3">
                <Ticket size={20} className="text-orange-400" />
              </div>
              <p className="text-slate-500 dark:text-zinc-400 text-sm">Aucune réservation encore</p>
              <Link href="/fr/recherche" className="text-orange-500 text-sm mt-2 hover:underline font-semibold">
                Réservez votre premier voyage →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-zinc-800">
              {dernieres.map((res) => (
                <Link
                  key={res.id}
                  href={`/fr/voyageur/reservations/${res.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-orange-50/40 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bus size={18} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate">
                      {res.trajet?.villeDepart ?? '?'} → {res.trajet?.villeArrivee ?? '?'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      {res.trajet?.compagnieNom ?? '—'}
                      {res.trajet?.dateDepart
                        ? ` · ${new Date(res.trajet.dateDepart).toLocaleDateString('fr-FR')}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge statut={res.statut} />
                    <span className="font-bold text-slate-700 dark:text-zinc-300 text-sm">{res.prixTotal} MAD</span>
                    <ChevronRight size={14} className="text-slate-300 dark:text-zinc-600 group-hover:text-orange-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5"
        >
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">Actions rapides</h2>
          <div className="space-y-1.5">
            {[
              { label: 'Rechercher un trajet', href: '/fr/recherche', icon: Search, gradient: 'from-orange-400 to-orange-600' },
              { label: 'Mes réservations', href: '/fr/voyageur/reservations', icon: Calendar, gradient: 'from-emerald-400 to-teal-500' },
              { label: 'Mes tickets', href: '/fr/voyageur/tickets', icon: Ticket, gradient: 'from-violet-400 to-purple-600' },
              { label: 'Comparer des trajets', href: '/fr/voyageur/comparaison', icon: TrendingUp, gradient: 'from-blue-400 to-indigo-500' },
              { label: 'Déclarer un bagage', href: '/fr/voyageur/bagages/declarer', icon: AlertCircle, gradient: 'from-red-400 to-rose-500' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 dark:hover:bg-zinc-800 transition-all group"
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <action.icon size={15} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white flex-1 transition-colors">
                  {action.label}
                </span>
                <ChevronRight size={14} className="text-slate-300 dark:text-zinc-600 group-hover:text-orange-400 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Recommandations ── */}
      {recommandations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <h2 className="font-bold text-slate-800 dark:text-white">Recommandés pour vous</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommandations.slice(0, 3).map((trajet) => (
              <Link
                key={trajet.id}
                href={`/fr/recherche?depart=${encodeURIComponent(trajet.villeDepart)}&arrivee=${encodeURIComponent(trajet.villeArrivee)}`}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
                    <Star size={15} className="text-white" />
                  </div>
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-red-500">{trajet.prixBase} MAD</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-white mb-1">
                  {trajet.villeDepart} → {trajet.villeArrivee}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">{trajet.compagnieNom}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(trajet.dateDepart).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-xs font-bold text-orange-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Réserver <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
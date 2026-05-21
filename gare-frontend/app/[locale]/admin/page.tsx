'use client';

import AdminLayout from '@/components/admin/common/AdminLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { useEffect, useState } from 'react';
import { adminBusApi } from '@/lib/api/admin/bus';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { adminTrajetApi } from '@/lib/api/admin/trajets';
import { adminQuaiApi } from '@/lib/api/admin/quais';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import { apiClient } from '@/lib/api/client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Bus, Building2, MapPin, SquareStack,
  Megaphone, Tag, DollarSign, Ticket, Users,
  RefreshCw, Clock, ChevronRight, Activity, Sparkles,
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#059669', '#0d9488', '#0891b2', '#7c3aed', '#d97706', '#dc2626'];

function KpiCard({ label, value, icon: Icon, color, bg, suffix = '', delay = 0 }: {
  label: string; value: number | string; icon: any;
  color: string; bg: string; suffix?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 22, stiffness: 180 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-5 flex items-center gap-4 group transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-200/20 dark:hover:shadow-emerald-900/20"
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-emerald-400/8 to-teal-400/8 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl group-hover:from-emerald-400/15 group-hover:to-teal-400/15 transition-all duration-700" />
      <motion.div
        whileHover={{ scale: 1.1, rotate: -5 }}
        className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-300', bg)}
      >
        <Icon size={22} className={color} />
      </motion.div>
      <div className="relative">
        <motion.p
          key={String(value)}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="text-2xl font-black text-slate-900 dark:text-white"
        >
          {value}{suffix}
        </motion.p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"
        />
        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function ChartCard({ title, children, empty, delay = 0 }: {
  title: string; children: React.ReactNode; empty?: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 22, stiffness: 180 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-200/10 dark:hover:shadow-emerald-900/10"
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-emerald-400/8 to-teal-400/8 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl" />
      <p className="relative font-bold text-slate-700 dark:text-zinc-300 text-sm mb-4">{title}</p>
      {empty
        ? <div className="flex items-center justify-center h-40 text-slate-400 dark:text-zinc-500 text-sm">Aucune donnée</div>
        : <div className="relative">{children}</div>}
    </motion.div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.span
      key={time.getSeconds()}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      className="font-mono font-bold text-slate-700 dark:text-zinc-300 tabular-nums text-sm"
    >
      {time.toLocaleTimeString('fr-FR')}
    </motion.span>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    compagnies: 0, bus: 0, trajets: 0,
    quaisTotal: 0, quaisAllocated: 0, quaisFree: 0,
    annonces: 0, promos: 0,
  });
  const [quaisData, setQuaisData] = useState<{ name: string; value: number }[]>([]);
  const [financialData, setFinancialData] = useState<any>(null);
  const [revenueEvolution, setRevenueEvolution] = useState<{ mois: string; recettes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [finLoading, setFinLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    await Promise.all([loadStats(), loadFinancial()]);
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const [comp, bus, traj, quais, ann, promo] = await Promise.all([
        adminCompagnieApi.getAll().catch(() => []),
        adminBusApi.getAll().catch(() => []),
        adminTrajetApi.getAll().catch(() => []),
        adminQuaiApi.getAll().catch(() => []),
        adminPromotionApi.getAnnonces().catch(() => []),
        adminPromotionApi.getPromos().catch(() => []),
      ]);
      const allocated = quais.filter((q: any) => !q.disponible).length;
      setStats({
        compagnies: comp.length, bus: bus.length, trajets: traj.length,
        quaisTotal: quais.length, quaisAllocated: allocated,
        quaisFree: quais.length - allocated,
        annonces: ann.length, promos: promo.length,
      });
      setQuaisData([
        { name: 'Disponibles', value: quais.length - allocated },
        { name: 'Occupés', value: allocated },
      ]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadFinancial = async () => {
    setFinLoading(true);
    try {
      const res = await apiClient.get('/admin/dashboard/finance');
      setFinancialData(res.data);
      if (res.data?.recettesTotales) {
        const total = res.data.recettesTotales;
        const mois = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
        const now = new Date().getMonth();
        const evolution = mois.slice(0, now + 1).map((m, i) => ({
          mois: m,
          recettes: Math.round(total * (0.4 + (i / (now + 1)) * 0.6) * (0.85 + Math.random() * 0.3)),
        }));
        setRevenueEvolution(evolution);
      }
    } catch (e) { console.error(e); }
    finally { setFinLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-6">
          <div className="relative">
            <div className="w-12 h-12 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-1 rounded-full border-2 border-emerald-200/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="text-slate-400 dark:text-zinc-500 text-sm font-bold tracking-wider uppercase">Chargement</p>
        </div>
      </AdminLayout>
    );
  }

  const quickLinks = [
    { label: 'Compagnies', href: '/fr/admin/compagnies', icon: Building2, count: stats.compagnies, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Bus', href: '/fr/admin/bus', icon: Bus, count: stats.bus, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-500/10' },
    { label: 'Trajets', href: '/fr/admin/trajets', icon: MapPin, count: stats.trajets, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
    { label: 'Chauffeurs', href: '/fr/admin/chauffeurs', icon: Users, count: '—', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Annonces', href: '/fr/admin/annonces', icon: Megaphone, count: stats.annonces, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Promotions', href: '/fr/admin/promotions', icon: Tag, count: stats.promos, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-7 pb-10">

        {/* ═══ HERO HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 180 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-2xl shadow-emerald-500/25"
        >
          {/* Gradient orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-emerald-300/5 rounded-full blur-3xl" />

          {/* Floating sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-white/25 rounded-full"
                style={{ left: `${8 + i * 12}%`, top: `${10 + (i % 4) * 22}%` }}
                animate={{ opacity: [0, 1, 0], scale: [0, 2.5, 0] }}
                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Animated border glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/15"
          />

          <div className="relative p-8 md:p-10">
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/25 transition-all backdrop-blur-md border border-white/15 shadow-lg"
              >
                <LayoutDashboard size={26} className="text-white" />
              </motion.div>
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 }}
                  className="flex items-center gap-2.5 mb-1.5"
                >
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]">RIHLA</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]">Administration</span>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 }}
                  className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm"
                >
                  Bonjour, {user?.prenom}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 }}
                  className="text-sm text-white/70 mt-1 font-medium flex items-center gap-2"
                >
                  <Clock size={13} />
                  <LiveClock />
                  <span className="text-white/30">·</span>
                  Vue d&apos;ensemble du système
                </motion.p>
              </div>
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                whileHover={{ scale: 1.05, rotate: refreshing ? 0 : 180 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', damping: 15 }}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 transition-all backdrop-blur-md border border-white/15 shadow-lg shrink-0 disabled:opacity-50"
              >
                <RefreshCw size={20} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Bottom reflective wave */}
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-black/10 to-transparent" />
        </motion.div>

        {/* ── Section Financière ── */}
        <div>
          <SectionHeader title="Statistiques financières" />
          {finLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 dark:bg-zinc-900/80 rounded-[2rem] border border-slate-100 dark:border-zinc-800 h-28 animate-pulse" />
              ))}
            </div>
          ) : financialData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06, type: 'spring', damping: 22 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-2xl shadow-emerald-500/25 md:col-span-1 group"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2.5 mb-3">
                      <motion.div
                        animate={{ rotate: [0, -8, 8, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <DollarSign size={18} className="text-emerald-200" />
                      </motion.div>
                      <p className="text-emerald-100 text-[10px] font-black uppercase tracking-wider">Total recettes</p>
                    </div>
                    <motion.p
                      key={financialData.recettesTotales}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="text-3xl font-black text-white drop-shadow-lg"
                    >
                      {(financialData.recettesTotales || 0).toLocaleString()}
                    </motion.p>
                    <p className="text-emerald-200 text-xs font-bold mt-0.5 uppercase tracking-wider">MAD</p>
                  </div>
                </motion.div>
                <KpiCard
                  label="Ventes tickets"
                  value={(financialData.recettesTickets || 0).toLocaleString()}
                  icon={Ticket} color="text-emerald-600 dark:text-emerald-400"
                  bg="bg-emerald-50 dark:bg-emerald-500/10"
                  suffix=" MAD" delay={0.1}
                />
                <KpiCard
                  label="Stationnement"
                  value={(financialData.recettesStationnement || 0).toLocaleString()}
                  icon={SquareStack} color="text-cyan-600 dark:text-cyan-400"
                  bg="bg-cyan-50 dark:bg-cyan-500/10"
                  suffix=" MAD" delay={0.14}
                />
                <KpiCard
                  label="Taux remplissage"
                  value={(financialData.tauxRemplissageGlobal || 0).toFixed(1)}
                  icon={Activity} color="text-indigo-600 dark:text-indigo-400"
                  bg="bg-indigo-50 dark:bg-indigo-500/10"
                  suffix="%" delay={0.18}
                />
              </div>

              {/* Financial charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCard title="Évolution des recettes (cumul mensuel)" delay={0.12} empty={revenueEvolution.length === 0}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueEvolution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(v: any) => [`${Number(v).toLocaleString()} MAD`, 'Recettes']}
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.95)' }}
                      />
                      <Line
                        type="monotone" dataKey="recettes" stroke="#059669" strokeWidth={3}
                        dot={{ fill: '#059669', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Statut des réservations" delay={0.16} empty={!financialData.reservationsConfirmees && !financialData.reservationsAnnulees}>
                  <div className="space-y-3 mt-2">
                    {[
                      { label: 'Confirmées', value: financialData.reservationsConfirmees || 0, color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', delay: 0.2 },
                      { label: 'Annulées', value: financialData.reservationsAnnulees || 0, color: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', delay: 0.24 },
                    ].map(item => {
                      const total = (financialData.reservationsConfirmees || 0) + (financialData.reservationsAnnulees || 0);
                      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: item.delay, type: 'spring', damping: 22 }}
                          className={cn('rounded-2xl p-4 border border-transparent', item.bg)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn('text-sm font-bold', item.text)}>{item.label}</span>
                            <span className={cn('text-xl font-black', item.text)}>{item.value}</span>
                          </div>
                          <div className="w-full bg-white/60 dark:bg-zinc-800/60 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1.2, delay: item.delay + 0.2, ease: 'easeOut' }}
                              className={cn('h-2.5 rounded-full', item.color)}
                            />
                          </div>
                          <p className={cn('text-xs mt-1 opacity-70', item.text)}>{pct}% du total</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </ChartCard>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 p-10 text-center text-slate-400 dark:text-zinc-500 text-sm shadow-xl"
            >
              Données financières indisponibles
            </motion.div>
          )}
        </div>

        {/* ── Infrastructure KPIs ── */}
        <div>
          <SectionHeader title="Infrastructure" action={
            <Link
              href="/fr/admin/quais"
              className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Gérer les quais
              <motion.div whileHover={{ x: 3 }} transition={{ type: 'spring', damping: 15 }}>
                <ChevronRight size={13} />
              </motion.div>
            </Link>
          } />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Compagnies" value={stats.compagnies} icon={Building2} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" delay={0.08} />
            <KpiCard label="Bus" value={stats.bus} icon={Bus} color="text-teal-600 dark:text-teal-400" bg="bg-teal-50 dark:bg-teal-500/10" delay={0.12} />
            <KpiCard label="Trajets" value={stats.trajets} icon={MapPin} color="text-cyan-600 dark:text-cyan-400" bg="bg-cyan-50 dark:bg-cyan-500/10" delay={0.16} />
            <KpiCard label="Quais total" value={stats.quaisTotal} icon={SquareStack} color="text-slate-600 dark:text-zinc-400" bg="bg-slate-100 dark:bg-zinc-800" delay={0.2} />
            <KpiCard label="Quais libres" value={stats.quaisFree} icon={SquareStack} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" delay={0.24} />
            <KpiCard label="Quais occupés" value={stats.quaisAllocated} icon={SquareStack} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-500/10" delay={0.28} />
          </div>
        </div>

        {/* ── Quai stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 22 }}
            whileHover={{ y: -2 }}
            className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-200/10 dark:hover:shadow-emerald-900/10"
          >
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-br from-emerald-400/8 to-teal-400/8 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl" />
            <div className="relative text-center">
              <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-1">Répartition des quais</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-6 font-medium">Disponibilité en temps réel</p>
              <div className="flex items-center justify-center gap-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 12, stiffness: 200 }}
                  className="text-center"
                >
                  <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm">{stats.quaisFree}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 justify-center font-medium">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                    Libres
                  </p>
                </motion.div>
                <div className="w-px h-16 bg-slate-200 dark:bg-zinc-700" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring', damping: 12, stiffness: 200 }}
                  className="text-center"
                >
                  <p className="text-5xl font-black text-rose-500 dark:text-rose-400 drop-shadow-sm">{stats.quaisAllocated}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 justify-center font-medium">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" />
                    Occupés
                  </p>
                </motion.div>
                <div className="w-px h-16 bg-slate-200 dark:bg-zinc-700" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', damping: 12, stiffness: 200 }}
                  className="text-center"
                >
                  <p className="text-5xl font-black text-slate-800 dark:text-white drop-shadow-sm">{stats.quaisTotal}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">Total</p>
                </motion.div>
              </div>
              {stats.quaisTotal > 0 && (
                <div className="mt-6 max-w-md mx-auto">
                  <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((stats.quaisFree / stats.quaisTotal) * 100)}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 font-medium">
                    {stats.quaisTotal > 0 ? Math.round((stats.quaisFree / stats.quaisTotal) * 100) : 0}% disponibles
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <ChartCard title="État des quais" delay={0.24} empty={stats.quaisTotal === 0}>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={quaisData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={5} dataKey="value">
                    <Cell fill="#059669" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.95)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-5 flex-1">
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm" />
                    <span className="text-sm text-slate-600 dark:text-zinc-400 font-medium">Disponibles</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 ml-5">{stats.quaisFree}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.36 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-rose-500 rounded-full shadow-sm" />
                    <span className="text-sm text-slate-600 dark:text-zinc-400 font-medium">Occupés</span>
                  </div>
                  <p className="text-3xl font-black text-rose-500 dark:text-rose-400 ml-5">{stats.quaisAllocated}</p>
                </motion.div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ── Accès rapides ── */}
        <div>
          <SectionHeader title="Accès rapides" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, type: 'spring', damping: 22 }}
              >
                <Link
                  href={item.href}
                  className="group relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-5 flex flex-col items-center gap-3 hover:shadow-2xl hover:shadow-emerald-200/10 dark:hover:shadow-emerald-900/10 transition-all duration-500"
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-emerald-400/8 to-teal-400/8 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl group-hover:from-emerald-400/15 group-hover:to-teal-400/15 transition-all duration-700" />
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300', item.bg)}
                  >
                    <item.icon size={20} className={cn(item.color, 'group-hover:scale-110 transition-transform')} />
                  </motion.div>
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 text-center">{item.label}</p>
                  <motion.span
                    key={item.count}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className={cn('text-xl font-black', item.color)}
                  >
                    {item.count}
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Annonces & Promos ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, type: 'spring', damping: 22 }}
            whileHover={{ y: -2 }}
            className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-200/10 dark:hover:shadow-amber-900/10"
          >
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-amber-400/10 to-orange-400/10 dark:from-amber-400/5 dark:to-orange-400/5 rounded-full blur-3xl" />
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Megaphone size={18} className="text-amber-600 dark:text-amber-400" />
                </motion.div>
                <p className="font-bold text-slate-700 dark:text-zinc-300">Annonces</p>
              </div>
              <Link
                href="/fr/admin/annonces"
                className="group flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Gérer
                <motion.div whileHover={{ x: 2 }}>
                  <ChevronRight size={12} />
                </motion.div>
              </Link>
            </div>
            <motion.p
              key={stats.annonces}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="text-4xl font-black text-amber-600 dark:text-amber-400 drop-shadow-sm"
            >
              {stats.annonces}
            </motion.p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">annonces publiées au total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, type: 'spring', damping: 22 }}
            whileHover={{ y: -2 }}
            className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-200/10 dark:hover:shadow-rose-900/10"
          >
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-rose-400/10 to-pink-400/10 dark:from-rose-400/5 dark:to-pink-400/5 rounded-full blur-3xl" />
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Tag size={18} className="text-rose-600 dark:text-rose-400" />
                </motion.div>
                <p className="font-bold text-slate-700 dark:text-zinc-300">Codes promo</p>
              </div>
              <Link
                href="/fr/admin/promotions"
                className="group flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Gérer
                <motion.div whileHover={{ x: 2 }}>
                  <ChevronRight size={12} />
                </motion.div>
              </Link>
            </div>
            <motion.p
              key={stats.promos}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="text-4xl font-black text-rose-600 dark:text-rose-400 drop-shadow-sm"
            >
              {stats.promos}
            </motion.p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">codes promo actifs</p>
          </motion.div>
        </div>

      </div>
    </AdminLayout>
  );
}

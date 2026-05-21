'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { responsableStatsApi } from '@/lib/api/responsable/stats';
import { responsableExportApi } from '@/lib/api/responsable/exports';
import { responsableBusApi } from '@/lib/api/responsable/bus';
import { CompagnieStats, Bus as BusType } from '@/types';
import {
  Route, Ticket, CreditCard, TrendingUp, Bus, Tag,
  Building2, Loader2, FileText, FileSpreadsheet,
  ChevronUp, ArrowRight, Calendar, Users,
  LayoutDashboard, Bell, Search, Filter, RefreshCw, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function StatCard({ icon: Icon, label, value, trend, gradient, delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number; trend?: string; gradient: string; delay?: number;
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
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-black mt-1.5 bg-clip-text text-transparent bg-gradient-to-br ${gradient}`}>{value}</p>
          {trend && (
            <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 mt-1">
              <ChevronUp size={10} /> {trend}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient} shadow-md`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function ResponsableDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CompagnieStats | null>(null);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [periode, setPeriode] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [periode]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsData, busesData] = await Promise.all([
        responsableStatsApi.getStats(periode || undefined),
        responsableBusApi.getAll()
      ]);
      if (statsData) setStats(statsData);
      if (busesData) setBuses(busesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    setExporting(type);
    try {
      if (type === 'pdf') await responsableExportApi.exportPdf();
      else await responsableExportApi.exportExcel();
    } catch (err) {
      alert('Erreur lors de l\'export');
    } finally {
      setExporting(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="flex items-center gap-0.5">
          {"RIHLA".split("").map((letter, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity, repeatDelay: 1 }}
              className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-400 via-orange-500 to-red-500"
            >
              {letter}
            </motion.span>
          ))}
        </div>
        <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Analyse des données en cours…</p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Chiffre d'Affaires",
      value: stats?.totalVentes ? `${stats.totalVentes.toLocaleString()} DH` : '0 DH',
      icon: CreditCard,
      gradient: 'from-orange-400 to-orange-600',
      trend: '+12.5%',
    },
    {
      label: 'Réservations',
      value: stats?.totalReservations ?? 0,
      icon: Ticket,
      gradient: 'from-emerald-400 to-teal-600',
      trend: '+8.2%',
    },
    {
      label: 'Remplissage',
      value: stats?.tauxRemplissageMoyen ? `${stats.tauxRemplissageMoyen.toFixed(1)}%` : '0%',
      icon: TrendingUp,
      gradient: 'from-violet-400 to-purple-600',
      trend: '+4.1%',
    },
    {
      label: 'Bus Actifs',
      value: stats?.totalBusActifs ?? 0,
      icon: Bus,
      gradient: 'from-blue-400 to-indigo-600',
      trend: '0.0%',
    },
  ];

  const actifCount = buses.filter(b => b.actif && !b.enMaintenance).length;
  const inactifCount = buses.filter(b => !b.actif).length;
  const maintenanceCount = buses.filter(b => b.enMaintenance).length;

  return (
    <div className="space-y-8 pb-10">

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)' }}
      >
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-sm" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-orange-100 text-sm font-medium mb-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl md:text-3xl font-black leading-tight">
              Console de Gestion, {user?.prenom} 👋
            </h1>
            <p className="text-orange-100 mt-1.5 text-sm flex items-center gap-2">
              <Building2 size={14} />
              Supervision en temps réel de votre compagnie
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={periode}
                onChange={e => setPeriode(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none min-w-[140px]"
              >
                <option value="" className="text-slate-700">Tous les temps</option>
                <option value="jour" className="text-slate-700">Aujourd'hui</option>
                <option value="mois" className="text-slate-700">Ce mois</option>
                <option value="an" className="text-slate-700">Cette année</option>
              </select>
              <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
            </div>
            <button
              onClick={() => loadData(true)}
              className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition border border-white/20"
              title="Actualiser"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 p-1">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <FileText size={12} />
                {exporting === 'pdf' ? '…' : 'PDF'}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet size={12} />
                {exporting === 'excel' ? '…' : 'Excel'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} delay={idx * 0.1} />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Chiffre d'Affaires */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <CreditCard size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Chiffre d'Affaires</h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Total généré (DH)</p>
          </div>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Total Ventes', value: stats?.totalVentes || 0 }]} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '12px' }} />
                <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} barSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* État de la Flotte */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center">
                <Bus size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">État de la Flotte</h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Bus Actifs vs Inactifs</p>
          </div>
          <div className="flex-1 min-h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Actifs', value: actifCount, fill: '#10b981' },
                    { name: 'Inactifs', value: inactifCount, fill: '#ef4444' },
                    { name: 'Maintenance', value: maintenanceCount, fill: '#f59e0b' }
                  ]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
                >
                  {[
                    { name: 'Actifs', value: actifCount, fill: '#10b981' },
                    { name: 'Inactifs', value: inactifCount, fill: '#ef4444' },
                    { name: 'Maintenance', value: maintenanceCount, fill: '#f59e0b' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Réservations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Ticket size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Réservations</h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Total des réservations</p>
          </div>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Total Réservations', value: stats?.totalReservations || 0 }]} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '12px' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Taux de Remplissage */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Taux de Remplissage</h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Occupation moyenne (%)</p>
          </div>
          <div className="flex-1 min-h-[280px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Rempli', value: stats?.tauxRemplissageMoyen || 0, fill: '#f97316' },
                    { name: 'Vide', value: 100 - (stats?.tauxRemplissageMoyen || 0), fill: '#f1f5f9' }
                  ]}
                  cx="50%" cy="50%" innerRadius={80} outerRadius={110} startAngle={180} endAngle={0} dataKey="value" stroke="none"
                >
                  {[
                    { name: 'Rempli', value: stats?.tauxRemplissageMoyen || 0, fill: '#f97316' },
                    { name: 'Vide', value: 100 - (stats?.tauxRemplissageMoyen || 0), fill: '#f1f5f9' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10%] flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                {stats?.tauxRemplissageMoyen?.toFixed(1) || 0}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Moyenne</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

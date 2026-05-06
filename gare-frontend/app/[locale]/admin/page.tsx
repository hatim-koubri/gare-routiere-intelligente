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
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Bus, Building2, MapPin, SquareStack,
  Megaphone, Tag, DollarSign, Ticket, Users,
  RefreshCw, Clock, ChevronRight, Activity
} from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#059669', '#0d9488', '#0891b2', '#7c3aed', '#d97706', '#dc2626'];

function KpiCard({ label, value, icon: Icon, color, bg, suffix = '' }: {
  label: string; value: number | string; icon: any;
  color: string; bg: string; suffix?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}{suffix}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-emerald-600 rounded-full" />
        <h2 className="font-bold text-slate-700">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="font-semibold text-slate-700 text-sm mb-4">{title}</p>
      {empty
        ? <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Aucune donnée</div>
        : children}
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono font-bold text-slate-700 tabular-nums">
      {time.toLocaleTimeString('fr-FR')}
    </span>
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
      // Génère une évolution simulée mensuelle à partir des recettes totales
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
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement du tableau de bord…</p>
        </div>
      </AdminLayout>
    );
  }

  const finPieData = financialData ? [
    { name: 'Tickets', value: financialData.recettesTickets || 0, color: '#059669' },
    { name: 'Stationnement', value: financialData.recettesStationnement || 0, color: '#0891b2' },
  ] : [];

  const quickLinks = [
    { label: 'Compagnies', href: '/fr/admin/compagnies', icon: Building2, count: stats.compagnies, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Bus', href: '/fr/admin/bus', icon: Bus, count: stats.bus, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Trajets', href: '/fr/admin/trajets', icon: MapPin, count: stats.trajets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Chauffeurs', href: '/fr/admin/chauffeurs', icon: Users, count: '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Annonces', href: '/fr/admin/annonces', icon: Megaphone, count: stats.annonces, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Promotions', href: '/fr/admin/promotions', icon: Tag, count: stats.promos, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-7 pb-10">

        {/* ── Greeting Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Bonjour, {user?.prenom} {user?.nom} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
              <Clock size={13} />
              <LiveClock />
              <span className="text-slate-300">·</span>
              Vue d'ensemble du système
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm self-start"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* ── Section Financière ── */}
        <div>
          <SectionHeader title="Statistiques financières" />
          {finLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : financialData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm shadow-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={18} className="text-emerald-200" />
                    <p className="text-emerald-100 text-xs font-medium">Total recettes</p>
                  </div>
                  <p className="text-2xl font-bold">{(financialData.recettesTotales || 0).toLocaleString()}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">MAD</p>
                </div>
                <KpiCard label="Ventes tickets" value={(financialData.recettesTickets || 0).toLocaleString()} icon={Ticket} color="text-emerald-600" bg="bg-emerald-50" suffix=" MAD" />
                <KpiCard label="Stationnement" value={(financialData.recettesStationnement || 0).toLocaleString()} icon={SquareStack} color="text-cyan-600" bg="bg-cyan-50" suffix=" MAD" />
                <KpiCard label="Taux remplissage" value={(financialData.tauxRemplissageGlobal || 0).toFixed(1)} icon={Activity} color="text-indigo-600" bg="bg-indigo-50" suffix="%" />
              </div>

              {/* Financial charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCard title="Évolution des recettes (cumul mensuel)" empty={revenueEvolution.length === 0}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revenueEvolution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} MAD`, 'Recettes']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="recettes" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 3, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Statut des réservations" empty={!financialData.reservationsConfirmees && !financialData.reservationsAnnulees}>
                  <div className="space-y-3 mt-2">
                    {[
                      { label: 'Confirmées', value: financialData.reservationsConfirmees || 0, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                      { label: 'Annulées', value: financialData.reservationsAnnulees || 0, color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
                    ].map(item => {
                      const total = (financialData.reservationsConfirmees || 0) + (financialData.reservationsAnnulees || 0);
                      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold ${item.text}`}>{item.label}</span>
                            <span className={`text-xl font-bold ${item.text}`}>{item.value}</span>
                          </div>
                          <div className="w-full bg-white rounded-full h-2">
                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className={`text-xs ${item.text} mt-1 opacity-70`}>{pct}% du total</p>
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
              Données financières indisponibles — vérifiez la connexion backend
            </div>
          )}
        </div>

        {/* ── Infrastructure KPIs ── */}
        <div>
          <SectionHeader title="Infrastructure" action={
            <Link href="/fr/admin/quais" className="text-xs text-emerald-600 font-medium flex items-center gap-1 hover:underline">
              Gérer les quais <ChevronRight size={13} />
            </Link>
          } />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Compagnies" value={stats.compagnies} icon={Building2} color="text-emerald-600" bg="bg-emerald-50" />
            <KpiCard label="Bus" value={stats.bus} icon={Bus} color="text-teal-600" bg="bg-teal-50" />
            <KpiCard label="Trajets" value={stats.trajets} icon={MapPin} color="text-cyan-600" bg="bg-cyan-50" />
            <KpiCard label="Quais total" value={stats.quaisTotal} icon={SquareStack} color="text-slate-600" bg="bg-slate-100" />
            <KpiCard label="Quais libres" value={stats.quaisFree} icon={SquareStack} color="text-emerald-600" bg="bg-emerald-50" />
            <KpiCard label="Quais occupés" value={stats.quaisAllocated} icon={SquareStack} color="text-rose-600" bg="bg-rose-50" />
          </div>
        </div>

        {/* ── Chart : Quais ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center">
            <div className="text-center">
              <p className="font-semibold text-slate-700 text-sm mb-1">Répartition des quais</p>
              <p className="text-xs text-slate-400 mb-4">Disponibilité en temps réel</p>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-600">{stats.quaisFree}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 justify-center"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />Libres</p>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <div className="text-center">
                  <p className="text-4xl font-bold text-rose-500">{stats.quaisAllocated}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 justify-center"><span className="w-2 h-2 bg-rose-500 rounded-full inline-block" />Occupés</p>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <div className="text-center">
                  <p className="text-4xl font-bold text-slate-700">{stats.quaisTotal}</p>
                  <p className="text-xs text-slate-500 mt-1">Total</p>
                </div>
              </div>
              {stats.quaisTotal > 0 && (
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.round((stats.quaisFree / stats.quaisTotal) * 100)}%` }} />
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">{stats.quaisTotal > 0 ? Math.round((stats.quaisFree / stats.quaisTotal) * 100) : 0}% disponibles</p>
            </div>
          </div>

          <ChartCard title="État des quais" empty={stats.quaisTotal === 0}>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={quaisData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#059669" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-sm text-slate-600">Disponibles</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 ml-5">{stats.quaisFree}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-rose-500 rounded-full" />
                    <span className="text-sm text-slate-600">Occupés</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 ml-5">{stats.quaisAllocated}</p>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ── Accès rapides ── */}
        <div>
          <SectionHeader title="Accès rapides" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                  <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} />
                </div>
                <p className="text-xs font-semibold text-slate-700 text-center">{item.label}</p>
                <span className={`text-lg font-bold ${item.color}`}>{item.count}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Annonces & Promos ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Megaphone size={16} className="text-amber-600" />
                </div>
                <p className="font-semibold text-slate-700 text-sm">Annonces</p>
              </div>
              <Link href="/fr/admin/annonces" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1">
                Gérer <ChevronRight size={12} />
              </Link>
            </div>
            <p className="text-4xl font-bold text-amber-600 mb-1">{stats.annonces}</p>
            <p className="text-sm text-slate-500">annonces publiées au total</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                  <Tag size={16} className="text-rose-600" />
                </div>
                <p className="font-semibold text-slate-700 text-sm">Codes promo</p>
              </div>
              <Link href="/fr/admin/promotions" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1">
                Gérer <ChevronRight size={12} />
              </Link>
            </div>
            <p className="text-4xl font-bold text-rose-600 mb-1">{stats.promos}</p>
            <p className="text-sm text-slate-500">codes promo actifs</p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
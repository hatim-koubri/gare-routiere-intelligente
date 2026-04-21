'use client';

import AdminLayout from '@/components/admin/common/AdminLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { adminBusApi } from '@/lib/api/admin/bus';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { adminTrajetApi } from '@/lib/api/admin/trajets';
import { adminQuaiApi } from '@/lib/api/admin/quais';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

// ─── Clock Widget ────────────────────────────────────────────────────────────
function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center gap-2">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">🕐 Heure actuelle</p>
      <div className="text-4xl font-black text-gray-800 tabular-nums tracking-tight">
        {hours}<span className="animate-pulse text-blue-500">:</span>{minutes}<span className="text-gray-300">:</span><span className="text-2xl text-gray-400">{seconds}</span>
      </div>
      <p className="text-xs text-gray-500 capitalize text-center">{dateStr}</p>
    </div>
  );
}

// ─── Timer Widget ────────────────────────────────────────────────────────────
function TimerWidget() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center gap-3">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">⏱️ Temps en session</p>
      <div className="text-4xl font-black tabular-nums tracking-tight text-gray-800">
        {hours}<span className="text-blue-500">:</span>{minutes}<span className="text-gray-300">:</span><span className="text-2xl text-gray-400">{seconds}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning(r => !r)}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${running ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
        >
          {running ? '⏸ Pause' : '▶ Reprendre'}
        </button>
        <button
          onClick={() => { setElapsed(0); setRunning(true); }}
          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-all"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}

// ─── Calendar Widget ─────────────────────────────────────────────────────────
function CalendarWidget() {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">◀</button>
        <p className="text-sm font-bold text-gray-700 capitalize">{monthName}</p>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div key={i} className={`text-center text-xs py-1.5 rounded-lg font-medium transition-all
              ${!day ? '' : isToday ? 'bg-blue-600 text-white font-black shadow-sm' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}>
              {day || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chart Card ──────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, color, children }: { title: string; subtitle: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h2 className="text-base font-bold text-gray-700">{title}</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

// ─── Legend Row ───────────────────────────────────────────────────────────────
function LegendRow({ items, colors }: { items: { name: string; value: number }[]; colors: string[] }) {
  return (
    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
          <span className="font-medium">{item.name}</span>
          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-bold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    compagnies: 0, bus: 0, trajets: 0,
    quaisTotal: 0, quaisAllocated: 0, quaisFree: 0,
    annoncesTotal: 0, promosTotal: 0,
  });
  const [fleetChartData, setFleetChartData] = useState<{ name: string; bus: number }[]>([]);
  const [quaisChartData, setQuaisChartData] = useState<{ name: string; value: number }[]>([]);
  const [annoncesEvolution, setAnnoncesEvolution] = useState<{ date: string; total: number }[]>([]);
  const [promosParCompagnie, setPromosParCompagnie] = useState<{ name: string; promos: number }[]>([]);
  const [annoncesParCompagnie, setAnnoncesParCompagnie] = useState<{ name: string; annonces: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [compagniesData, busData, trajetsData, quaisData, annoncesData, promosData] = await Promise.all([
        adminCompagnieApi.getAll().catch(() => []),
        adminBusApi.getAll().catch(() => []),
        adminTrajetApi.getAll().catch(() => []),
        adminQuaiApi.getAll().catch(() => []),
        adminPromotionApi.getAnnonces().catch(() => []),
        adminPromotionApi.getPromos().catch(() => []),
      ]);

      const allocatedQuais = quaisData.filter((q: any) => !q.disponible).length;
      setStats({
        compagnies: compagniesData.length, bus: busData.length, trajets: trajetsData.length,
        quaisTotal: quaisData.length, quaisAllocated: allocatedQuais,
        quaisFree: quaisData.length - allocatedQuais,
        annoncesTotal: annoncesData.length, promosTotal: promosData.length,
      });

      setFleetChartData(compagniesData.map((c: any) => ({
        name: c.nom,
        bus: busData.filter((b: any) => Number(b.compagnieId) === Number(c.id)).length,
      })));

      setQuaisChartData([
        { name: 'Disponibles', value: quaisData.length - allocatedQuais },
        { name: 'Occupés', value: allocatedQuais },
      ]);

      const countsByDate: Record<string, number> = {};
      annoncesData.forEach((a: any) => {
        if (a.dateDebut) {
          const date = a.dateDebut.substring(0, 10);
          countsByDate[date] = (countsByDate[date] || 0) + 1;
        }
      });
      let cumul = 0;
      setAnnoncesEvolution(Object.keys(countsByDate).sort().map(date => {
        cumul += countsByDate[date];
        return { date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), total: cumul };
      }));

      const globalPromos = promosData.filter((p: any) => !p.compagnieId || p.compagnieId === 0).length;
      setPromosParCompagnie([
        { name: '🌐 Global', promos: globalPromos },
        ...compagniesData.map((c: any) => ({
          name: c.nom,
          promos: promosData.filter((p: any) => Number(p.compagnieId) === Number(c.id)).length,
        })),
      ]);

      const globalAnnonces = annoncesData.filter((a: any) => !a.compagnieId || a.compagnieId === 0).length;
      setAnnoncesParCompagnie([
        { name: '🌐 Global', annonces: globalAnnonces },
        ...compagniesData.map((c: any) => ({
          name: c.nom,
          annonces: annoncesData.filter((a: any) => Number(a.compagnieId) === Number(c.id)).length,
        })),
      ]);

    } catch (error) {
      console.error('Erreur chargement stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-500">Chargement du tableau de bord...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📊 Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-1">Bonjour, {user?.nom} — Vue d'ensemble du système</p>
          </div>
          <button onClick={loadStats} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg font-medium transition-all">
            🔄 Actualiser
          </button>
        </div>

        {/* ── Section 1 : Widgets temporels ── */}
        <div>
          <SectionTitle emoji="🕐" title="Session & Temps réel" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ClockWidget />
            <TimerWidget />
            <CalendarWidget />
          </div>
        </div>

        {/* ── Section 2 : KPIs globaux ── */}
        <div>
          <SectionTitle emoji="📈" title="Indicateurs clés" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Compagnies" value={stats.compagnies} color="bg-blue-100 text-blue-700" emoji="🏢" />
            <KpiCard label="Bus" value={stats.bus} color="bg-green-100 text-green-700" emoji="🚌" />
            <KpiCard label="Trajets" value={stats.trajets} color="bg-yellow-100 text-yellow-700" emoji="🗺️" />
            <KpiCard label="Annonces" value={stats.annoncesTotal} color="bg-purple-100 text-purple-700" emoji="📢" />
          </div>
        </div>

        {/* ── Section 3 : Infrastructure ── */}
        <div>
          <SectionTitle emoji="🅿️" title="Infrastructure — Quais" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <KpiCard label="Quais Total" value={stats.quaisTotal} color="bg-gray-100 text-gray-700" emoji="🅿️" />
            <KpiCard label="Quais Occupés" value={stats.quaisAllocated} color="bg-red-100 text-red-700" emoji="🔴" />
            <KpiCard label="Quais Libres" value={stats.quaisFree} color="bg-green-100 text-green-700" emoji="✅" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Bus par compagnie" subtitle="Répartition de la flotte" color="bg-blue-500">
              {fleetChartData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={fleetChartData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: '#eff6ff' }} />
                    <Bar dataKey="bus" name="Bus" radius={[6, 6, 0, 0]}>
                      {fleetChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="État des quais" subtitle="Disponibilité en temps réel" color="bg-green-500">
              {stats.quaisTotal === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Aucun quai</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={quaisChartData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={4} dataKey="value">
                      {quaisChartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#16a34a' : '#dc2626'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Section 4 : Annonces ── */}
        <div>
          <SectionTitle emoji="📢" title="Annonces" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6 flex items-center gap-4">
              <div className="text-4xl">📢</div>
              <div>
                <div className="text-3xl font-bold text-purple-700">{stats.annoncesTotal}</div>
                <div className="text-sm text-purple-600 font-medium">Annonces publiées au total</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
              <div className="text-4xl">🌐</div>
              <div>
                <div className="text-3xl font-bold text-gray-800">
                  {annoncesParCompagnie.find(a => a.name === '🌐 Global')?.annonces || 0}
                </div>
                <div className="text-sm text-gray-500 font-medium">Annonces globales (toutes compagnies)</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Évolution des annonces" subtitle="Cumul basé sur la date de début" color="bg-purple-500">
              {annoncesEvolution.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={annoncesEvolution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => [v, 'Cumulées']} />
                    <Line type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={3} dot={{ fill: '#7c3aed', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Annonces par compagnie" subtitle="Global + par compagnie" color="bg-emerald-500">
              {annoncesParCompagnie.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Aucune annonce</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={annoncesParCompagnie} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f0fdf4' }} formatter={(v) => [v, 'Annonces']} />
                      <Bar dataKey="annonces" radius={[6, 6, 0, 0]}>
                        {annoncesParCompagnie.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : CHART_COLORS[(i - 1) % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <LegendRow
                    items={annoncesParCompagnie.map(a => ({ name: a.name, value: a.annonces }))}
                    colors={annoncesParCompagnie.map((_, i) => i === 0 ? '#10b981' : CHART_COLORS[(i - 1) % CHART_COLORS.length])}
                  />
                </>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Section 5 : Promotions ── */}
        <div>
          <SectionTitle emoji="🎟️" title="Codes Promo" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-6 flex items-center gap-4">
              <div className="text-4xl">🎟️</div>
              <div>
                <div className="text-3xl font-bold text-amber-700">{stats.promosTotal}</div>
                <div className="text-sm text-amber-600 font-medium">Codes promo au total</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
              <div className="text-4xl">🌐</div>
              <div>
                <div className="text-3xl font-bold text-gray-800">
                  {promosParCompagnie.find(p => p.name === '🌐 Global')?.promos || 0}
                </div>
                <div className="text-sm text-gray-500 font-medium">Codes promo globaux</div>
              </div>
            </div>
          </div>

          <ChartCard title="Codes promo par compagnie" subtitle="Global + par compagnie" color="bg-amber-500">
            {promosParCompagnie.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Aucun code promo</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={promosParCompagnie} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: '#fffbeb' }} formatter={(v) => [v, 'Codes promo']} />
                    <Bar dataKey="promos" radius={[6, 6, 0, 0]}>
                      {promosParCompagnie.map((_, i) => <Cell key={i} fill={i === 0 ? '#f59e0b' : CHART_COLORS[(i - 1) % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <LegendRow
                  items={promosParCompagnie.map(p => ({ name: p.name, value: p.promos }))}
                  colors={promosParCompagnie.map((_, i) => i === 0 ? '#f59e0b' : CHART_COLORS[(i - 1) % CHART_COLORS.length])}
                />
              </>
            )}
          </ChartCard>
        </div>

      </div>
    </AdminLayout>
  );
}

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-lg">{emoji}</span>
      <h2 className="text-base font-bold text-gray-700">{title}</h2>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function KpiCard({ label, value, color, emoji }: { label: string; value: number; color: string; emoji: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`text-2xl p-3 rounded-xl ${color}`}>{emoji}</div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
      </div>
    </div>
  );
}
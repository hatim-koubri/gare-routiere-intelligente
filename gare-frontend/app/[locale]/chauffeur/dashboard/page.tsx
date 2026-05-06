'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Trajet } from '@/types';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, Clock, CalendarDays, TrendingUp,
  MapPin, Bus, Building2, ParkingCircle, ArrowRight,
  ChevronLeft, ChevronRight, BarChart3, AlertCircle,
  Activity, FileText
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

export default function ChauffeurDashboardPage() {
  const { user } = useAuth();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [historique, setHistorique] = useState<Trajet[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trajetsData, historiqueData, incidentsData] = await Promise.all([
        chauffeurTrajetApi.getTrajetsJour(),
        chauffeurTrajetApi.getHistoriqueTrajets().catch(() => []),
        chauffeurTrajetApi.getIncidents().catch(() => []),
      ]);
      setTrajets(trajetsData);
      setHistorique(historiqueData);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const allTrajets = [...trajets, ...historique];
  const today = new Date();

  const stats = {
    total: historique.length,
    termine: historique.filter(t => t.statut === 'TERMINE').length,
    annule: historique.filter(t => t.statut === 'ANNULE').length,
    retarde: historique.filter(t => t.statut === 'RETARDE').length,
    planifie: trajets.filter(t => t.statut === 'PLANIFIE').length,
    enCours: trajets.filter(t => t.statut === 'EN_COURS').length,
  };

  const cumulData = (() => {
    const sorted = [...historique]
      .filter(t => t.dateDepart)
      .sort((a, b) => new Date(a.dateDepart).getTime() - new Date(b.dateDepart).getTime());
    let termineCount = 0;
    let annuleCount = 0;
    return sorted.map(t => {
      if (t.statut === 'TERMINE') termineCount++;
      if (t.statut === 'ANNULE') annuleCount++;
      return {
        date: new Date(t.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        termine: termineCount,
        annule: annuleCount,
      };
    });
  })();

  const statutPieData = [
    { name: 'Terminés', value: stats.termine, color: '#16a34a' },
    { name: 'Annulés', value: stats.annule, color: '#dc2626' },
    { name: 'Retardés', value: stats.retarde, color: '#d97706' },
  ].filter(d => d.value > 0);

  const incidentPieData = (() => {
    const counts: Record<string, number> = {};
    incidents.forEach((inc: any) => {
      const type = inc.type || 'AUTRE';
      counts[type] = (counts[type] || 0) + 1;
    });
    const colors = ['#dc2626', '#d97706', '#7c3aed', '#0891b2', '#16a34a'];
    return Object.entries(counts).map(([name, value], i) => ({
      name, value, color: colors[i % colors.length]
    }));
  })();

  const getVilleDepart = (t: Trajet) => (t as any).villeDepart || (t as any).ligne?.villeDepart || '?';
  const getVilleArrivee = (t: Trajet) => (t as any).villeArrivee || (t as any).ligne?.villeArrivee || '?';
  const getCompagnieNom = (t: Trajet) => (t as any).compagnieNom || (t as any).ligne?.compagnie?.nom || 'N/A';
  const getBusMatricule = (t: Trajet) => (t as any).busMatricule || (t as any).bus?.matricule || 'N/A';
  const getQuaiNumero = (t: Trajet) => (t as any).quaiNumero || (t as any).quai?.numero || 'N/A';
  const getDateDepart = (t: Trajet) => t.dateDepart ? new Date(t.dateDepart).toLocaleString('fr-FR') : 'N/A';

  const getStatutConfig = (statut: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PLANIFIE:  { label: 'Planifié',  className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
      EN_COURS:  { label: 'En cours',  className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
      TERMINE:   { label: 'Terminé',   className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
      ANNULE:    { label: 'Annulé',    className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
      RETARDE:   { label: 'Retardé',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    };
    return map[statut] || { label: statut, className: 'bg-slate-100 text-slate-600' };
  };

  // Calendrier
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const trajetByDay: Record<number, Trajet[]> = {};
  allTrajets.forEach(t => {
    const d = new Date(t.dateDepart);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!trajetByDay[day]) trajetByDay[day] = [];
      trajetByDay[day].push(t);
    }
  });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const trajetAujourdhui = trajets.find(t =>
    new Date(t.dateDepart).toDateString() === today.toDateString()
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">

      {/* ══ HEADER ══ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Tableau de bord</p>
            <h1 className="text-xl font-bold text-slate-900">
              Bonjour, {user?.prenom} {user?.nom} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Trajets aujourd'hui</p>
              <p className="text-2xl font-bold text-indigo-600 leading-tight">{stats.enCours + stats.planifie}</p>
            </div>
            <div className="text-right bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Total effectués</p>
              <p className="text-2xl font-bold text-emerald-600 leading-tight">{stats.termine}</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />
      </div>

      {/* ══ KPI CARDS ══ */}
      <section>
        <SectionTitle icon={<BarChart3 size={16} />} title="Statistiques générales" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<CheckCircle2 size={18} className="text-emerald-600" />}
            label="Terminés"
            value={stats.termine}
            bg="bg-emerald-50"
            accent="text-emerald-600"
          />
          <KpiCard
            icon={<XCircle size={18} className="text-red-500" />}
            label="Annulés"
            value={stats.annule}
            bg="bg-red-50"
            accent="text-red-500"
          />
          <KpiCard
            icon={<Clock size={18} className="text-amber-500" />}
            label="Retardés"
            value={stats.retarde}
            bg="bg-amber-50"
            accent="text-amber-500"
          />
          <KpiCard
            icon={<CalendarDays size={18} className="text-indigo-600" />}
            label="Planifiés"
            value={stats.planifie}
            bg="bg-indigo-50"
            accent="text-indigo-600"
          />
        </div>
      </section>

      {/* ══ TRAJET DU JOUR ══ */}
      <section>
        <SectionTitle icon={<Bus size={16} />} title="Trajet du jour" />
        {trajetAujourdhui ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-stretch">
              <div className="w-1 bg-emerald-500 flex-shrink-0" />
              <div className="flex-1 p-5 flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-base font-bold text-slate-900">
                      {getVilleDepart(trajetAujourdhui)}
                    </span>
                    <ArrowRight size={14} className="text-slate-300" />
                    <span className="text-base font-bold text-slate-900">
                      {getVilleArrivee(trajetAujourdhui)}
                    </span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${getStatutConfig(trajetAujourdhui.statut).className}`}>
                      {getStatutConfig(trajetAujourdhui.statut).label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {getCompagnieNom(trajetAujourdhui)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus size={12} /> Bus {getBusMatricule(trajetAujourdhui)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ParkingCircle size={12} /> Quai {getQuaiNumero(trajetAujourdhui)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {getDateDepart(trajetAujourdhui)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/fr/chauffeur/trajets/${trajetAujourdhui.id}/manifeste`}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <FileText size={15} />
                  Voir le manifeste
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarDays size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Aucun trajet prévu aujourd'hui</p>
            <Link href="/fr/chauffeur/trajets" className="text-indigo-500 text-xs mt-2 inline-block hover:underline font-medium">
              Voir tous mes trajets →
            </Link>
          </div>
        )}
      </section>

      {/* ══ GRAPHIQUES ══ */}
      <section>
        <SectionTitle icon={<TrendingUp size={16} />} title="Évolution cumulée des trajets" />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          {cumulData.length === 0 ? (
            <EmptyState message="Aucune donnée disponible" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cumulData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="termine" name="Terminés" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} />
                <Line type="monotone" dataKey="annule" name="Annulés" stroke="#dc2626" strokeWidth={2} dot={{ r: 3, fill: '#dc2626' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ══ PIE CHARTS ══ */}
      <section>
        <SectionTitle icon={<Activity size={16} />} title="Répartition de carrière" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Répartition des trajets</p>
            {statutPieData.length === 0 ? (
              <EmptyState message="Aucune donnée" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={statutPieData} cx="50%" cy="50%" outerRadius={75} innerRadius={42}
                    paddingAngle={4} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                  >
                    {statutPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Types d'incidents</p>
            {incidentPieData.length === 0 ? (
              <EmptyState message="Aucun incident enregistré" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={incidentPieData} cx="50%" cy="50%" outerRadius={75} innerRadius={42}
                      paddingAngle={4} dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}
                    >
                      {incidentPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-slate-400 mt-1">
                  Total : {incidents.length} incident(s) enregistré(s)
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══ CALENDRIER + TRAJETS À VENIR (côte à côte) ══ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Calendrier */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-indigo-500" />
            <p className="text-sm font-semibold text-slate-700">Calendrier des trajets</p>
          </div>

          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-700 capitalize">{monthName}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3 text-[10px] text-slate-400">
            {[
              { color: 'bg-indigo-500', label: 'Planifié' },
              { color: 'bg-emerald-500', label: 'Terminé' },
              { color: 'bg-red-500', label: 'Annulé' },
              { color: 'bg-amber-500', label: 'Retardé' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dayTrajets = trajetByDay[day] || [];
              const hasTrajet = dayTrajets.length > 0;

              let dotColor = 'bg-indigo-500';
              if (dayTrajets.some(t => t.statut === 'TERMINE')) dotColor = 'bg-emerald-500';
              if (dayTrajets.some(t => t.statut === 'ANNULE')) dotColor = 'bg-red-500';
              if (dayTrajets.some(t => t.statut === 'RETARDE')) dotColor = 'bg-amber-500';

              return (
                <div key={i} className={`relative text-center py-2 rounded-lg text-xs font-medium transition-all
                  ${isToday
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : hasTrajet
                    ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    : 'text-slate-400 hover:bg-slate-50'}`}>
                  {day}
                  {hasTrajet && (
                    <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : dotColor}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trajets à venir */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" />
              <p className="text-sm font-semibold text-slate-700">Trajets à venir</p>
            </div>
            <Link href="/fr/chauffeur/trajets" className="text-xs text-indigo-500 hover:underline font-medium">
              Voir tout →
            </Link>
          </div>

          {trajets.filter(t => t.statut === 'PLANIFIE').length === 0 ? (
            <EmptyState message="Aucun trajet planifié" />
          ) : (
            <div className="space-y-3">
              {trajets.filter(t => t.statut === 'PLANIFIE').slice(0, 4).map((trajet) => (
                <div key={trajet.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {getVilleDepart(trajet)} → {getVilleArrivee(trajet)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{getCompagnieNom(trajet)}</span>
                      <span>Bus {getBusMatricule(trajet)}</span>
                      <span>Q.{getQuaiNumero(trajet)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{getDateDepart(trajet)}</p>
                  </div>
                  <Link
                    href={`/fr/chauffeur/trajets/${trajet.id}/manifeste`}
                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-slate-400 transition-all"
                  >
                    <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

    </div>
  );
}

// ── Composants utilitaires ──

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-indigo-500">{icon}</span>
      <h2 className="text-sm font-bold text-slate-700">{title}</h2>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function KpiCard({ icon, label, value, bg, accent }: {
  icon: React.ReactNode; label: string; value: number; bg: string; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold leading-tight ${accent}`}>{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
        <AlertCircle size={18} className="text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
}
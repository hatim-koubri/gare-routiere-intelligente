'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Trajet } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, Clock, CheckCircle, AlertTriangle, TrendingUp, MapPin } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

export default function ChauffeurDashboardPage() {
  const { user } = useAuth();
  const params = useParams();
  const locale = params?.locale as string ?? 'fr';
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

  // ── Stats ──
  const stats = {
    total: historique.length,
    termine: historique.filter(t => t.statut === 'TERMINE').length,
    annule: historique.filter(t => t.statut === 'ANNULE').length,
    retarde: historique.filter(t => t.statut === 'RETARDE').length,
    planifie: trajets.filter(t => t.statut === 'PLANIFIE').length,
    enCours: trajets.filter(t => t.statut === 'EN_COURS').length,
  };

  // ── Cumul trajets ──
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

  // ── Pie 1 : Statuts ──
  const statutPieData = [
    { name: 'Terminés', value: stats.termine, color: '#16a34a' },
    { name: 'Annulés', value: stats.annule, color: '#dc2626' },
    { name: 'Retardés', value: stats.retarde, color: '#d97706' },
  ].filter(d => d.value > 0);

  // ── Pie 2 : Incidents réels depuis BDD ──
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

  // ── Helpers ──
  const getVilleDepart = (t: Trajet) => (t as any).villeDepart || (t as any).ligne?.villeDepart || '?';
  const getVilleArrivee = (t: Trajet) => (t as any).villeArrivee || (t as any).ligne?.villeArrivee || '?';
  const getCompagnieNom = (t: Trajet) => (t as any).compagnieNom || (t as any).ligne?.compagnie?.nom || 'N/A';
  const getBusMatricule = (t: Trajet) => (t as any).busMatricule || (t as any).bus?.matricule || 'N/A';
  const getQuaiNumero = (t: Trajet) => (t as any).quaiNumero || (t as any).quai?.numero || 'N/A';
  const getDateDepart = (t: Trajet) => t.dateDepart ? new Date(t.dateDepart).toLocaleString('fr-FR') : 'N/A';
  const getStatutBadge = (statut: string) => {
    const map: Record<string, string> = {
      PLANIFIE: 'bg-blue-100 text-blue-800',
      EN_COURS: 'bg-green-100 text-green-800',
      TERMINE: 'bg-gray-100 text-gray-800',
      ANNULE: 'bg-red-100 text-red-800',
      RETARDE: 'bg-yellow-100 text-yellow-800',
    };
    return map[statut] || 'bg-gray-100 text-gray-800';
  };

  // ── Calendrier ──
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ══ Section 1 : Header ══ */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Bonjour {user?.prenom} {user?.nom} 👋</h1>
            <p className="text-blue-100 mt-1 text-sm">Bienvenue sur votre espace chauffeur</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-blue-100 justify-end">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100 justify-end">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{today.toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Section 2 : Trajet du jour ══ */}
      <div>
        <SectionTitle emoji="🚌" title="Trajet du jour" />
        {trajetAujourdhui ? (
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-5">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-800">
                  {getVilleDepart(trajetAujourdhui)} → {getVilleArrivee(trajetAujourdhui)}
                </p>
                <p className="text-sm text-gray-500">{getCompagnieNom(trajetAujourdhui)} • Bus {getBusMatricule(trajetAujourdhui)}</p>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>🕐 {getDateDepart(trajetAujourdhui)}</span>
                  <span>🅿️ Quai {getQuaiNumero(trajetAujourdhui)}</span>
                </div>
              </div>
              <Link
                href={`/${locale}/chauffeur/trajets/${trajetAujourdhui.id}/manifeste`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Voir le manifeste →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500 border">
            <p className="text-sm">📅 Aucun trajet prévu pour aujourd'hui</p>
            <Link href={`/${locale}/chauffeur/trajets`} className="text-blue-500 text-xs mt-1 inline-block hover:underline">
              Voir tous mes trajets →
            </Link>
          </div>
        )}
      </div>

      {/* ══ Section 3 : KPIs ══ */}
      <div>
        <SectionTitle emoji="📊" title="Statistiques générales" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard emoji="✅" label="Terminés" value={stats.termine} color="text-green-600 bg-green-50" />
          <KpiCard emoji="❌" label="Annulés" value={stats.annule} color="text-red-600 bg-red-50" />
          <KpiCard emoji="⏰" label="Retardés" value={stats.retarde} color="text-yellow-600 bg-yellow-50" />
          <KpiCard emoji="📅" label="Planifiés" value={stats.planifie} color="text-blue-600 bg-blue-50" />
        </div>
      </div>

      {/* ══ Section 4 : Évolution cumulée ══ */}
      <div>
        <SectionTitle emoji="📈" title="Évolution cumulée des trajets" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {cumulData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune donnée disponible</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cumulData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="termine" name="Terminés" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="annule" name="Annulés" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ══ Section 5 : Pie Charts ══ */}
      <div>
        <SectionTitle emoji="🥧" title="Répartition de carrière" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Pie 1 - Statuts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Répartition des trajets</h3>
            {statutPieData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statutPieData}
                    cx="50%" cy="50%"
                    outerRadius={80} innerRadius={45}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statutPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie 2 - Incidents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Types d'incidents</h3>
            {incidentPieData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Aucun incident enregistré</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={incidentPieData}
                      cx="50%" cy="50%"
                      outerRadius={80} innerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {incidentPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Total : {incidents.length} incident(s) enregistré(s)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ Section 6 : Calendrier ══ */}
      <div>
        <SectionTitle emoji="📅" title="Calendrier des trajets" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">

          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">◀</button>
            <span className="text-sm font-bold text-gray-700 capitalize">{monthName}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-sm">▶</button>
          </div>

          {/* Légende */}
          <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
            {[
              { color: 'bg-blue-500', label: 'Planifié' },
              { color: 'bg-green-500', label: 'Terminé' },
              { color: 'bg-red-500', label: 'Annulé' },
              { color: 'bg-yellow-500', label: 'Retardé' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Jours semaine */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Cases */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dayTrajets = trajetByDay[day] || [];
              const hasTrajet = dayTrajets.length > 0;

              let dotColor = 'bg-blue-500';
              if (dayTrajets.some(t => t.statut === 'TERMINE')) dotColor = 'bg-green-500';
              if (dayTrajets.some(t => t.statut === 'ANNULE')) dotColor = 'bg-red-500';
              if (dayTrajets.some(t => t.statut === 'RETARDE')) dotColor = 'bg-yellow-500';

              return (
                <div key={i} className={`relative text-center py-2.5 rounded-lg text-xs font-medium transition-all
                  ${isToday ? 'bg-blue-600 text-white font-black shadow-sm'
                    : hasTrajet ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                    : 'text-gray-400 hover:bg-gray-50'}`}>
                  {day}
                  {hasTrajet && (
                    <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : dotColor}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ Section 7 : Trajets à venir ══ */}
      <div>
        <SectionTitle emoji="📋" title="Trajets à venir" />
        {trajets.filter(t => t.statut === 'PLANIFIE').length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500 text-sm">
            Aucun trajet planifié
          </div>
        ) : (
          <div className="space-y-3">
            {trajets.filter(t => t.statut === 'PLANIFIE').slice(0, 3).map((trajet) => (
              <div key={trajet.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-gray-800">
                      {getVilleDepart(trajet)} → {getVilleArrivee(trajet)}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>🏢 {getCompagnieNom(trajet)}</span>
                      <span>🚌 {getBusMatricule(trajet)}</span>
                      <span>🅿️ Quai {getQuaiNumero(trajet)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{getDateDepart(trajet)}</p>
                  </div>
                  <Link
                    href={`/${locale}/chauffeur/trajets/${trajet.id}/manifeste`}
                    className="text-blue-500 text-xs hover:underline font-medium"
                  >
                    Voir →
                  </Link>
                </div>
              </div>
            ))}
            {trajets.filter(t => t.statut === 'PLANIFIE').length > 3 && (
              <Link href={`/${locale}/chauffeur/trajets`} className="text-center text-blue-500 text-sm hover:underline block">
                Voir tous les trajets →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ══ Bouton navigation ══ */}
      <div className="text-center pt-2">
        <Link
          href={`/${locale}/chauffeur/trajets`}
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          📋 Voir tous mes trajets
        </Link>
      </div>

    </div>
  );
}

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-base">{emoji}</span>
      <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function KpiCard({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className={`text-xl p-2.5 rounded-xl ${color}`}>{emoji}</div>
      <div>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
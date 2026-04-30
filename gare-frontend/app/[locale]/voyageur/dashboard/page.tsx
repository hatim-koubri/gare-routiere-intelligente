// app/[locale]/voyageur/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, RefreshCw, Eye, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Calendar } from '@/components/ui/calendar';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

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

export default function VoyageurDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string ?? 'fr';
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);
  const [travelDates, setTravelDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, authLoading, router, locale]);

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/voyageur/reservations');
      console.log('Réservations reçues:', response.data);
      setReservations(response.data || []);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  // Extraire les dates de voyage une fois les réservations chargées
  useEffect(() => {
    if (reservations.length > 0) {
      const dates = reservations
        .filter(r => r.statut === 'CONFIRMEE' && r.trajet?.dateDepart)
        .map(r => new Date(r.trajet!.dateDepart));
      setTravelDates(dates);
    }
  }, [reservations]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getReservationsByDate = (date: Date) => {
    return reservations.filter(r => 
      r.statut === 'CONFIRMEE' && 
      r.trajet?.dateDepart && 
      new Date(r.trajet.dateDepart).toDateString() === date.toDateString()
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const today = new Date();
  const reservationsAvenir = reservations.filter(r => 
    r.statut === 'CONFIRMEE' && r.trajet?.dateDepart && new Date(r.trajet.dateDepart) > today
  );
  const reservationsPassees = reservations.filter(r => 
    r.statut === 'CONFIRMEE' && r.trajet?.dateDepart && new Date(r.trajet.dateDepart) <= today
  );

  const stats = {
    total: reservations.filter(r => r.statut === 'CONFIRMEE').length,
    aVenir: reservationsAvenir.length,
    passes: reservationsPassees.length,
    totalDepense: reservations.filter(r => r.statut === 'CONFIRMEE').reduce((sum, r) => sum + (r.prixTotal || 0), 0),
  };

  const statutCounts = {
    CONFIRMEE: reservations.filter(r => r.statut === 'CONFIRMEE').length,
    EN_ATTENTE: reservations.filter(r => r.statut === 'EN_ATTENTE').length,
    ANNULEE: reservations.filter(r => r.statut === 'ANNULEE').length,
    REMBOURSEE: reservations.filter(r => r.statut === 'REMBOURSEE').length,
  };

  const pieData = [
    { name: 'Confirmées', value: statutCounts.CONFIRMEE, color: '#22c55e' },
    { name: 'En attente', value: statutCounts.EN_ATTENTE, color: '#eab308' },
    { name: 'Annulées', value: statutCounts.ANNULEE, color: '#ef4444' },
    { name: 'Remboursées', value: statutCounts.REMBOURSEE, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const moisMap = new Map<string, number>();
  reservations.forEach(r => {
    if (r.trajet?.dateDepart) {
      const date = new Date(r.trajet.dateDepart);
      const moisKey = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      moisMap.set(moisKey, (moisMap.get(moisKey) || 0) + 1);
    }
  });
  
  const barData = Array.from(moisMap.entries())
    .map(([mois, count]) => ({ mois, count }))
    .slice(-6);

  const compagnieMap = new Map<string, { count: number; totalDepense: number }>();
  reservations.forEach(r => {
    if (r.statut === 'CONFIRMEE' && r.trajet?.compagnieNom) {
      const nom = r.trajet.compagnieNom;
      const existing = compagnieMap.get(nom) || { count: 0, totalDepense: 0 };
      compagnieMap.set(nom, {
        count: existing.count + 1,
        totalDepense: existing.totalDepense + (r.prixTotal || 0)
      });
    }
  });

  const compagnieData = Array.from(compagnieMap.entries())
    .map(([nom, data]) => ({
      name: nom,
      voyages: data.count,
      depense: data.totalDepense
    }))
    .sort((a, b) => b.voyages - a.voyages);

  const dernieresReservations = [...reservations]
    .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime())
    .slice(0, 3);

  const selectedDateReservations = selectedDate ? getReservationsByDate(selectedDate) : [];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Bonjour {user?.prenom} {user?.nom} 👋</h1>
            <p className="text-blue-100 mt-1 text-sm">Bienvenue sur votre espace voyageur</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-blue-100 justify-end">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm">{today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100 justify-end">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{today.toLocaleTimeString('fr-FR')}</span>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <Link
                href={`/${locale}/voyageur/tickets`}
                className="bg-white/20 text-white px-3 py-1.5 rounded-lg hover:bg-white/30 transition text-sm flex items-center gap-1"
              >
                🎫 Mes tickets
              </Link>
              <button
                onClick={loadReservations}
                className="bg-white/20 text-white p-1.5 rounded-lg hover:bg-white/30 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prochain voyage */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-base">🚌</span> Prochain voyage
        </h2>
        {reservationsAvenir.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-5">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-800">
                  {reservationsAvenir[0].trajet?.villeDepart} → {reservationsAvenir[0].trajet?.villeArrivee}
                </p>
                <p className="text-sm text-gray-500">{reservationsAvenir[0].trajet?.compagnieNom}</p>
                <div className="text-xs text-gray-400">
                  🕐 {reservationsAvenir[0].trajet?.dateDepart && new Date(reservationsAvenir[0].trajet.dateDepart).toLocaleString('fr-FR')}
                </div>
              </div>
              <Link
                href={`/${locale}/voyageur/reservations/${reservationsAvenir[0].id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Voir le détail →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500 border">
            <p className="text-sm">📅 Aucun voyage à venir</p>
            <Link href={`/${locale}/recherche`} className="text-blue-500 text-xs mt-1 inline-block hover:underline">
              Réservez votre prochain voyage →
            </Link>
          </div>
        )}
      </div>

      {/* KPIs - 4 cartes */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-base">📊</span> Vos statistiques
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="text-xl p-2.5 rounded-xl text-blue-600 bg-blue-50">🎟️</div>
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Voyages total</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="text-xl p-2.5 rounded-xl text-green-600 bg-green-50">📅</div>
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.aVenir}</p>
              <p className="text-xs text-gray-500">À venir</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="text-xl p-2.5 rounded-xl text-gray-600 bg-gray-50">✅</div>
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.passes}</p>
              <p className="text-xs text-gray-500">Effectués</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="text-xl p-2.5 rounded-xl text-orange-600 bg-orange-50">💰</div>
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.totalDepense.toLocaleString()} MAD</p>
              <p className="text-xs text-gray-500">Dépense totale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques - 4 colonnes avec calendrier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pie Chart - Statuts des réservations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 Répartition par statut</h3>
          {pieData.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - Trajets par mois */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📅 Trajets par mois</h3>
          {barData.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name="Voyages" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - Compagnies déjà voyagées */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🏢 Compagnies voyagées</h3>
          {compagnieData.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={compagnieData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(value, name) => [value, name === 'voyages' ? 'Nombre de voyages' : 'Dépense']} />
                <Bar dataKey="voyages" name="Nb voyages" fill="#f97316" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Calendar */}
        <Calendar 
          travelDates={travelDates}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* Détails du jour sélectionné */}
      {selectedDate && selectedDateReservations.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
          <h4 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <span>🗓️</span> Voyages le {selectedDate.toLocaleDateString('fr-FR')}
          </h4>
          <div className="space-y-2">
            {selectedDateReservations.map(res => (
              <div key={res.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {res.trajet?.villeDepart} → {res.trajet?.villeArrivee}
                  </p>
                  <p className="text-xs text-gray-500">{res.trajet?.compagnieNom}</p>
                </div>
                <Link
                  href={`/${locale}/voyageur/reservations/${res.id}`}
                  className="text-orange-600 text-xs hover:underline"
                >
                  Voir →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques supplémentaires des compagnies */}
      {compagnieData.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
          <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <span>🏆</span> Vos compagnies préférées
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {compagnieData.slice(0, 3).map((comp, idx) => (
              <div key={comp.name} className="text-center">
                <div className="text-2xl font-bold text-orange-600">{comp.voyages}</div>
                <div className="text-xs text-gray-600">{comp.name}</div>
                <div className="text-xs text-gray-400">{comp.depense.toLocaleString()} MAD</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernières réservations - seulement 3 lignes */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span className="text-base">📋</span> Dernières réservations
          </h2>
          {reservations.length > 3 && (
            <button
              onClick={() => setShowAllModal(true)}
              className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Voir tout ({reservations.length})
            </button>
          )}
        </div>

        {dernieresReservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            <p>Aucune réservation trouvée</p>
            <Link href={`/${locale}/recherche`} className="text-blue-500 text-sm mt-2 inline-block">
              Réservez votre premier voyage →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {dernieresReservations.map((res) => (
              <div key={res.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">
                      {res.trajet?.villeDepart} → {res.trajet?.villeArrivee}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {res.trajet?.compagnieNom} • {res.trajet?.dateDepart && new Date(res.trajet.dateDepart).toLocaleDateString('fr-FR')}
                    </p>
                    {res.tickets && res.tickets.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        🎫 {res.tickets.length} ticket(s) • Sièges: {res.tickets.map(t => t.numeroSiege).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{res.prixTotal} MAD</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      res.statut === 'CONFIRMEE' ? 'bg-green-100 text-green-700' : 
                      res.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {res.statut === 'CONFIRMEE' ? 'Confirmé' : 
                       res.statut === 'EN_ATTENTE' ? 'En attente' : res.statut}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton réserver */}
      <div className="text-center pt-2">
        <Link
          href={`/${locale}/recherche`}
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          🎟️ Réserver un nouveau voyage
        </Link>
      </div>

      {/* Modal - Toutes les réservations */}
      {showAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAllModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-bold">Toutes mes réservations</h2>
              <button onClick={() => setShowAllModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {reservations.map((res) => (
                <div key={res.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {res.trajet?.villeDepart} → {res.trajet?.villeArrivee}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {res.trajet?.compagnieNom} • {res.trajet?.dateDepart && new Date(res.trajet.dateDepart).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Réservé le: {new Date(res.dateReservation).toLocaleDateString('fr-FR')}
                      </p>
                      {res.tickets && res.tickets.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          🎫 {res.tickets.length} ticket(s) • Sièges: {res.tickets.map(t => t.numeroSiege).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{res.prixTotal} MAD</p>
                      <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        res.statut === 'CONFIRMEE' ? 'bg-green-100 text-green-700' : 
                        res.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {res.statut === 'CONFIRMEE' ? 'Confirmé' : 
                         res.statut === 'EN_ATTENTE' ? 'En attente' : res.statut}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setShowAllModal(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
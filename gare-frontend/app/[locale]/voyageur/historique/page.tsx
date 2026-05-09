'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Bus, ChevronRight, Search, Filter } from 'lucide-react';

interface TrajetHistorique {
  id: number;
  trajet?: {
    id: number;
    dateDepart: string;
    villeDepart: string;
    villeArrivee: string;
    compagnieNom: string;
    busMatricule?: string;
    quaiNumero?: number;
    prixBase?: number;
  };
  dateDepart?: string;
  villeDepart?: string;
  villeArrivee?: string;
  compagnieNom?: string;
  statut: string;
  prixTotal: number;
  nombrePassagers?: number;
  membres?: { id: number }[];
}

export default function HistoriquePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [historique, setHistorique] = useState<TrajetHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAnnee, setFilterAnnee] = useState<string>('TOUS');

  useEffect(() => {
    if (!authLoading && !user) router.push('/fr/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadHistorique();
  }, [user]);

  const loadHistorique = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/voyageur/reservations');
      const reservations = res.data || [];
      const passes = reservations.filter((r: any) => {
        if (!r.trajet?.dateDepart) return false;
        return new Date(r.trajet.dateDepart) < new Date();
      });
      setHistorique(passes);
    } catch {
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  const annees = [...new Set(historique.map(r => new Date(r.trajet?.dateDepart || '').getFullYear().toString()))].sort();

  const filtered = historique.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      const match = r.trajet?.villeDepart?.toLowerCase().includes(q) ||
        r.trajet?.villeArrivee?.toLowerCase().includes(q) ||
        r.trajet?.compagnieNom?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterAnnee !== 'TOUS') {
      const annee = new Date(r.trajet?.dateDepart || '').getFullYear().toString();
      if (annee !== filterAnnee) return false;
    }
    return true;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatHeure = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (authLoading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes historiques</h1>
        <p className="text-slate-500 text-sm mt-0.5">Trajets passés et réservations terminées</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par ville ou compagnie..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={filterAnnee}
          onChange={e => setFilterAnnee(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
        >
          <option value="TOUS">Toutes les années</option>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">Aucun trajet passé trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/fr/voyageur/reservations/${r.id}`}
              className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <Bus size={20} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="text-slate-400">{r.trajet?.compagnieNom}</span>
                    <span className="text-slate-300">·</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.statut === 'TERMINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                    }`}>{r.statut}</span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {r.trajet?.villeDepart} → {r.trajet?.villeArrivee}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(r.trajet?.dateDepart || '')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatHeure(r.trajet?.dateDepart || '')}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800">{r.prixTotal?.toFixed(0)} MAD</p>
                  <p className="text-xs text-slate-400">{r.nombrePassagers || r.membres?.length || 0} passager(s)</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 mt-2 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

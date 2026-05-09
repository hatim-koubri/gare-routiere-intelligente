'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Trajet, Role } from '@/types';
import Link from 'next/link';
import {
  History, ArrowLeft, MapPin, ArrowRight, CheckCircle2,
  XCircle, Clock, Bus, FileText, Search,
} from 'lucide-react';

export default function HistoriquePage() {
  const { user } = useAuth();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadHistorique(); }, []);

  const loadHistorique = async () => {
    setLoading(true);
    try {
      const data = await chauffeurTrajetApi.getHistoriqueTrajets();
      setTrajets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement historique', error);
      setTrajets([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: trajets.length,
    termine: trajets.filter(t => t.statut === 'TERMINE').length,
    annule: trajets.filter(t => t.statut === 'ANNULE').length,
  };

  const filtered = trajets.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const vd = (t as any).villeDepart || t.ligne?.villeDepart || '';
    const va = (t as any).villeArrivee || t.ligne?.villeArrivee || '';
    const matricule = (t as any).busMatricule || t.bus?.matricule || '';
    return vd.toLowerCase().includes(q) || va.toLowerCase().includes(q) || matricule.includes(q);
  });

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Chargement de l&apos;historique...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-16">

          <Link
            href="/fr/chauffeur/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Retour au tableau de bord
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <History size={22} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Historique des trajets</h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {user?.prenom} {user?.nom}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-700">{stats.termine}</p>
              <p className="text-xs font-semibold text-emerald-600 mt-1">Terminés</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
              <p className="text-2xl font-bold text-red-600">{stats.annule}</p>
              <p className="text-xs font-semibold text-red-500 mt-1">Annulés</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par ville ou bus..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
              <History size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">
                {search ? 'Aucun trajet trouvé' : 'Aucun trajet terminé ou annulé'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((trajet) => {
                const vd = (trajet as any).villeDepart || trajet.ligne?.villeDepart || '?';
                const va = (trajet as any).villeArrivee || trajet.ligne?.villeArrivee || '?';
                const matricule = (trajet as any).busMatricule || trajet.bus?.matricule || 'N/A';
                const compagnie = (trajet as any).compagnieNom || trajet.ligne?.compagnie?.nom || 'N/A';
                const isTermine = trajet.statut === 'TERMINE';
                return (
                  <div key={trajet.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin size={14} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800">{vd}</h3>
                            <ArrowRight size={14} className="text-slate-300" />
                            <h3 className="font-bold text-slate-800">{va}</h3>
                          </div>
                          <p className="text-xs text-slate-400">{compagnie} • Bus {matricule}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isTermine
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-red-50 text-red-600 ring-1 ring-red-200'
                        }`}>
                          {isTermine ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {isTermine ? 'Terminé' : 'Annulé'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {trajet.dateDepart ? new Date(trajet.dateDepart).toLocaleString('fr-FR') : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bus size={11} /> {trajet.nbReservations || 0} passagers
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <Link
                          href={`/fr/chauffeur/trajets/${trajet.id}/manifeste`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <FileText size={12} /> Voir le manifeste
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

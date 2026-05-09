'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { chauffeurDepartApi } from '@/lib/api/chauffeur/depart';
import { apiClient } from '@/lib/api/client';
import { Trajet } from '@/types';
import Link from 'next/link';
import {
  MapPin, ArrowRight, Bus, Building2, ParkingCircle, Clock,
  Users, Timer, FileText, QrCode, Luggage, Flag, AlertTriangle,
  CalendarDays, RefreshCw, ChevronRight, Play, Square, Navigation,
  Loader2,
} from 'lucide-react';

const STATUT_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  PLANIFIE: { label: 'Planifié',  className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', dot: 'bg-indigo-500' },
  EN_COURS: { label: 'En cours',  className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  TERMINE:  { label: 'Terminé',   className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', dot: 'bg-slate-400' },
  ANNULE:   { label: 'Annulé',    className: 'bg-red-50 text-red-600 ring-1 ring-red-200', dot: 'bg-red-500' },
  RETARDE:  { label: 'Retardé',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500' },
};

export default function ChauffeurTrajetsPage() {
  const { user } = useAuth();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadTrajets(); }, []);

  const loadTrajets = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await chauffeurTrajetApi.getTrajetsJour();
      console.log('=== TRAJETS PAGE ===');
      console.log('Données reçues:', data);
      // Trier par date de départ croissante (le plus proche en premier)
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(a.dateDepart).getTime() - new Date(b.dateDepart).getTime())
        : [];
      setTrajets(sorted);
    } catch (error) {
      console.error('Erreur chargement trajets', error);
      setTrajets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getVilleDepart   = (t: Trajet) => (t as any).villeDepart  || (t as any).ligne?.villeDepart  || '?';
  const getVilleArrivee  = (t: Trajet) => (t as any).villeArrivee || (t as any).ligne?.villeArrivee || '?';
  const getCompagnieNom  = (t: Trajet) => (t as any).compagnieNom || (t as any).ligne?.compagnie?.nom || 'N/A';
  const getBusMatricule  = (t: Trajet) => (t as any).busMatricule || (t as any).bus?.matricule || 'N/A';
  const getNbSieges      = (t: Trajet) => (t as any).nbSieges || (t as any).bus?.nbSieges || 0;
  const getQuaiNumero    = (t: Trajet) => (t as any).quaiNumero || (t as any).quai?.numero || 'N/A';
  const getDateDepart    = (t: Trajet) => t.dateDepart ? new Date(t.dateDepart).toLocaleString('fr-FR') : 'N/A';
  const getStatut        = (s: string) => STATUT_CONFIG[s] || { label: s, className: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Chargement des trajets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Espace Chauffeur</p>
          <h1 className="text-2xl font-bold text-slate-900">Mes Trajets à venir</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Aujourd'hui → {new Date(Date.now() + 29 * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => loadTrajets(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* ── Résumé ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: trajets.length, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'En cours', value: trajets.filter(t => t.statut === 'EN_COURS').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Planifiés', value: trajets.filter(t => t.statut === 'PLANIFIE').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl border border-slate-100 px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Liste des trajets ── */}
      {trajets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Aucun trajet prévu pour les 7 prochains jours</p>
          <p className="text-xs text-slate-400 mt-1">Revenez plus tard ou contactez votre responsable</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trajets.map((trajet, idx) => {
            const statut = getStatut(trajet.statut);
            return (
              <div
                key={trajet.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Card header */}
                <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statut.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statut.dot}`} />
                        {statut.label}
                      </span>
                      {trajet.dateDepart && new Date(trajet.dateDepart).toDateString() === new Date().toDateString() ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider">
                          Aujourd'hui
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">
                          {trajet.dateDepart ? new Date(trajet.dateDepart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-slate-400 flex-shrink-0" />
                      <h3 className="text-lg font-bold text-slate-900">
                        {getVilleDepart(trajet)}
                      </h3>
                      <ArrowRight size={16} className="text-slate-300" />
                      <h3 className="text-lg font-bold text-slate-900">
                        {getVilleArrivee(trajet)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={11} />
                      <span>{getDateDepart(trajet)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400 font-medium">Trajet #</p>
                    <p className="text-sm font-bold text-slate-700">{trajet.id}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-6 border-t border-slate-100" />

                {/* Infos grille */}
                <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoCell icon={<Building2 size={13} />} label="Compagnie" value={getCompagnieNom(trajet)} />
                  <InfoCell icon={<Bus size={13} />} label="Matricule" value={`Bus ${getBusMatricule(trajet)}`} />
                  <InfoCell icon={<ParkingCircle size={13} />} label="Quai" value={`Quai ${getQuaiNumero(trajet)}`} />
                  <InfoCell icon={<Users size={13} />} label="Sièges" value={`${trajet.nbReservations || 0} / ${getNbSieges(trajet)}`} />
                </div>

                {/* Retard éventuel */}
                {(trajet.retardMinutes || 0) > 0 && (
                  <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium">
                    <Timer size={13} />
                    Retard de {trajet.retardMinutes} min
                  </div>
                )}

                {/* Divider */}
                <div className="mx-6 border-t border-slate-100" />

                {/* Actions */}
                <div className="px-6 py-4 flex flex-wrap gap-2">
                  {trajet.statut === 'PLANIFIE' && (
                    <DepartBtn trajetId={trajet.id} onDone={() => loadTrajets(true)} />
                  )}
                  {trajet.statut === 'EN_COURS' && (
                    <TerminerBtn trajetId={trajet.id} onDone={() => loadTrajets(true)} />
                  )}
                  <ActionBtn href={`/fr/chauffeur/trajets/${trajet.id}/manifeste`} icon={<FileText size={14} />} label="Manifeste" color="indigo" />
                  <ActionBtn href={`/fr/chauffeur/scanner/ticket?trajetId=${trajet.id}`} icon={<QrCode size={14} />} label="Scanner ticket" color="emerald" />
                  <ActionBtn href={`/fr/chauffeur/scanner/bagage?trajetId=${trajet.id}`} icon={<Luggage size={14} />} label="Scanner bagage" color="violet" />
                  <ActionBtn href={`/fr/chauffeur/trajets/${trajet.id}/jalons`} icon={<Flag size={14} />} label="Jalons" color="amber" />
                  <ActionBtn href={`/fr/chauffeur/incidents?trajetId=${trajet.id}`} icon={<AlertTriangle size={14} />} label="Incident" color="red" />
                  <ActionBtn href={`/fr/chauffeur/plan-quai`} icon={<Navigation size={14} />} label="Plan quai" color="sky" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  indigo:  'bg-indigo-600 hover:bg-indigo-700',
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  violet:  'bg-violet-600 hover:bg-violet-700',
  amber:   'bg-amber-500 hover:bg-amber-600',
  red:     'bg-red-500 hover:bg-red-600',
  sky:     'bg-sky-500 hover:bg-sky-600',
};

function ActionBtn({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${COLOR_MAP[color]}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function DepartBtn({ trajetId, onDone }: { trajetId: number; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      await chauffeurDepartApi.declencherDepart(trajetId);
      onDone();
    } catch { alert('Erreur lors du départ'); } finally { setLoading(false); }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all duration-150 shadow-sm hover:shadow-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
      DÉPART
    </button>
  );
}

function TerminerBtn({ trajetId, onDone }: { trajetId: number; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/chauffeur/trajets/${trajetId}/terminer`);
      onDone();
    } catch { alert('Erreur'); } finally { setLoading(false); }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all duration-150 shadow-sm hover:shadow-md bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
      TERMINER
    </button>
  );
}
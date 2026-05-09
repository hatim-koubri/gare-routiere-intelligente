'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurJalonApi, JalonsData } from '@/lib/api/chauffeur/jalons';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Role, Trajet } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Clock, CheckCircle2, Loader2,
  Circle, CircleDot, LogOut, Timer,
} from 'lucide-react';

export default function JalonsPage() {
  const { id } = useParams();
  const [trajet, setTrajet] = useState<Trajet | null>(null);
  const [jalonsData, setJalonsData] = useState<JalonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'arriver' | 'departir' | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trajetsData, jData] = await Promise.all([
        chauffeurTrajetApi.getTrajetsJour(),
        chauffeurJalonApi.getArrets(Number(id)),
      ]);
      const found = trajetsData.find((t: any) => t.id === Number(id));
      setTrajet(found || null);
      setJalonsData(jData);
    } catch (error) {
      console.error('Erreur chargement jalons', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArriver = async (arretId: number) => {
    setActionLoading(arretId);
    setActionType('arriver');
    try {
      await chauffeurJalonApi.arriverArret(Number(id), arretId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };

  const handleDepartir = async (arretId: number) => {
    setActionLoading(arretId);
    setActionType('departir');
    try {
      await chauffeurJalonApi.departirArret(Number(id), arretId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };

  const isArrived = (arretId: number) => jalonsData?.arrives?.includes(arretId) ?? false;
  const isDeparted = (arretId: number) => jalonsData?.partis?.includes(arretId) ?? false;

  const stops = jalonsData?.arrets ?? [];
  const arrivedCount = jalonsData?.arrives?.length ?? 0;
  const totalStops = stops.length;
  const progressPct = totalStops > 0 ? Math.round((arrivedCount / totalStops) * 100) : 0;

  const getHeurePassage = (arret: any) => {
    if (!trajet?.dateDepart) return 'N/A';
    const dateDepart = new Date(trajet.dateDepart);
    if (arret.heurePrevueOffsetMinutes) {
      dateDepart.setMinutes(dateDepart.getMinutes() + arret.heurePrevueOffsetMinutes);
    }
    return dateDepart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Chargement des jalons...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 pb-16">

          <Link
            href="/fr/chauffeur/trajets"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Retour aux trajets
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h1 className="text-xl font-bold text-slate-900">Jalons du trajet</h1>
            <p className="text-sm text-slate-500 mt-1">
              #{id} — {trajet?.villeDepart || '?'} → {trajet?.villeArrivee || '?'}
            </p>
            {trajet?.dateDepart && (
              <p className="text-xs text-slate-400 mt-1">
                Départ : {new Date(trajet.dateDepart).toLocaleString('fr-FR')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">{totalStops}</p>
              <p className="text-xs font-semibold text-indigo-600 mt-1">Arrêts</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{arrivedCount}</p>
              <p className="text-xs font-semibold text-emerald-600 mt-1">Arrivées</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{progressPct}%</p>
              <p className="text-xs font-semibold text-amber-600 mt-1">Progression</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Progression du trajet</span>
              <span className="text-sm font-bold text-indigo-600">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? '#16a34a'
                    : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {stops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
                <MapPin size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">Aucun arrêt programmé</p>
              </div>
            ) : (
              stops.map((arret, idx) => {
                const arrived = isArrived(arret.id);
                const departed = isDeparted(arret.id);
                const isLoading = actionLoading === arret.id;

                return (
                  <div
                    key={arret.id}
                    className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                      arrived && departed
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : arrived
                        ? 'border-indigo-200 bg-indigo-50/30'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {idx === 0 ? (
                          <CircleDot size={24} className="text-indigo-600 flex-shrink-0" />
                        ) : idx === stops.length - 1 ? (
                          <MapPin size={24} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle size={20} className="text-slate-300 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800">{arret.ville}</p>
                            {arrived && departed && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold ring-1 ring-emerald-200">
                                <CheckCircle2 size={10} /> Terminé
                              </span>
                            )}
                            {arrived && !departed && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold ring-1 ring-indigo-200">
                                <Clock size={10} /> Arrêté
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {getHeurePassage(arret)}
                            </span>
                            {arret.dureePauseMinutes && arret.dureePauseMinutes > 0 && (
                              <span className="flex items-center gap-1">
                                <Timer size={11} /> {arret.dureePauseMinutes} min pause
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {!arrived && (
                          <button
                            onClick={() => handleArriver(arret.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                          >
                            {isLoading && actionType === 'arriver' ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Arrivé
                          </button>
                        )}
                        {arrived && !departed && (
                          <button
                            onClick={() => handleDepartir(arret.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition-all"
                          >
                            {isLoading && actionType === 'departir' ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <LogOut size={14} />
                            )}
                            Partir
                          </button>
                        )}
                        {arrived && departed && (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold">
                            <CheckCircle2 size={14} /> Fait
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { chauffeurDepartApi } from '@/lib/api/chauffeur/depart';
import { apiClient } from '@/lib/api/client';
import { Role, Arret } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Clock, Users, CheckCircle2, Hourglass,
  AlertTriangle, Route, TrendingUp, Baby, Hash, Tag,
  ChevronRight, ShieldAlert, CircleDot, Circle, Play, Square,
  Loader2, Filter,
} from 'lucide-react';

const INCIDENT_CONFIG: Record<string, { label: string; className: string }> = {
  PANNE:    { label: 'Panne',    className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  RETARD:   { label: 'Retard',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  ACCIDENT: { label: 'Accident', className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
  AUTRE:    { label: 'Autre',    className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
};

export default function ManifestePage() {
  const { id } = useParams();
  const [manifeste, setManifeste] = useState<any>(null);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [prochainArret, setProchainArret] = useState<Arret | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [trajetStatut, setTrajetStatut] = useState<string>('');

  useEffect(() => {
    loadManifeste();
    loadArrets();
    loadIncidents();
    loadTrajetStatut();
  }, [id]);

  const loadTrajetStatut = async () => {
    try {
      const data = await chauffeurTrajetApi.getTrajetsJour();
      const found = data.find((t: any) => t.id === Number(id));
      if (found) setTrajetStatut(found.statut);
    } catch {}
  };

  const loadManifeste = async () => {
    try {
      const data = await chauffeurTrajetApi.getManifeste(Number(id));
      setManifeste(data);
    } catch (error: any) {
      console.error('Erreur chargement manifeste', error);
      setError(error.response?.data?.message || 'Erreur de chargement');
    }
  };

  const loadArrets = async () => {
    try {
      const response = await apiClient.get(`/chauffeur/trajets/${id}/arrets`);
      const arretsData = Array.isArray(response.data) ? response.data : [];
      setArrets(arretsData);
      if (arretsData.length > 0) setProchainArret(arretsData[0]);
    } catch (error) {
      console.error('Erreur chargement arrêts', error);
    }
  };

  const loadIncidents = async () => {
    try {
      const response = await apiClient.get(`/chauffeur/trajets/${id}/incidents`);
      setIncidents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur chargement incidents', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const getNombreEmbarques = () =>
    manifeste?.passagers?.filter((p: any) => p.statut === 'UTILISE').length ?? 0;

  const total     = manifeste?.nbPassagers ?? 0;
  const embarques = getNombreEmbarques();
  const enAttente = total - embarques;
  const taux      = total > 0 ? Math.round((embarques / total) * 100) : 0;

  const radius        = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset    = circumference - (taux / 100) * circumference;

  const passagersFiltres = (manifeste?.passagers ?? []).filter((p: any) => {
    if (showPriorityOnly && !p.enfantSurGenoux) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.nom?.toLowerCase().includes(q) ||
      p.prenom?.toLowerCase().includes(q) ||
      String(p.siege)?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Chargement du manifeste...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 pb-16">

          {/* ── Retour ── */}
          <Link
            href="/fr/chauffeur/trajets"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Retour aux trajets
          </Link>

          {/* ── Erreur ── */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
              <AlertTriangle size={17} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {manifeste && (
            <>
              {/* ══ HEADER CARD ══ */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Manifeste de voyage</p>
                    <h1 className="text-2xl font-bold text-slate-900">{manifeste.ligne}</h1>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-400">
                      <Clock size={13} />
                      <span>Départ : {new Date(manifeste.dateDepart).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <Hash size={13} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-600">Trajet #{id}</span>
                  </div>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />
              </div>

              {/* ══ BOUTONS DÉPART / TERMINER ══ */}
              {(trajetStatut === 'PLANIFIE' || trajetStatut === 'EN_COURS') && (
                <DepartTerminerBar
                  trajetId={Number(id)}
                  statut={trajetStatut}
                  onAction={() => { loadManifeste(); loadTrajetStatut(); }}
                />
              )}

              {/* ══ PROCHAIN ARRÊT ══ */}
              {prochainArret && (
                <div className="relative bg-indigo-600 rounded-2xl shadow-lg overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute rounded-full w-40 h-40 bg-white -top-10 -right-10" />
                    <div className="absolute rounded-full w-24 h-24 bg-white bottom-0 left-20" />
                  </div>
                  <div className="relative px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Prochain arrêt</p>
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-white" />
                        <p className="text-2xl font-bold text-white">{prochainArret.ville}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Clock size={14} className="text-indigo-200" />
                      <span className="text-white text-sm font-semibold">À venir</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ KPIs + DONUT ══ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Donut embarquement */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
                  <p className="text-sm font-semibold text-slate-700 mb-5">Taux d'embarquement</p>

                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 136 136">
                      <circle cx="68" cy="68" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
                      <circle cx="68" cy="68" r={radius} fill="none"
                        stroke={taux === 100 ? '#16a34a' : taux > 50 ? '#4f46e5' : '#f59e0b'}
                        strokeWidth="16"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">{taux}%</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">embarqués</span>
                    </div>
                  </div>

                  <div className="flex gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-500">Embarqués ({embarques})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span className="text-xs text-slate-500">En attente ({enAttente})</span>
                    </div>
                  </div>
                </div>

                {/* Compteurs */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total passagers', value: total,     color: 'text-indigo-600', bg: 'bg-indigo-50',  icon: <Users size={18} className="text-indigo-600" /> },
                    { label: 'Embarqués',        value: embarques, color: 'text-emerald-600',bg: 'bg-emerald-50', icon: <CheckCircle2 size={18} className="text-emerald-600" /> },
                    { label: 'En attente',        value: enAttente, color: 'text-amber-600', bg: 'bg-amber-50',   icon: <Hourglass size={18} className="text-amber-600" /> },
                    { label: 'Taux',              value: `${taux}%`,color: 'text-violet-600',bg: 'bg-violet-50',  icon: <TrendingUp size={18} className="text-violet-600" /> },
                  ].map(({ label, value, color, bg, icon }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
                      <div>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══ BARRE DE PROGRESSION ══ */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">Progression d'embarquement</span>
                  <span className="text-sm font-bold text-indigo-600">{taux}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-700"
                    style={{
                      width: `${taux}%`,
                      background: taux === 100
                        ? '#16a34a'
                        : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* ══ PARCOURS ══ */}
              {arrets.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Route size={16} className="text-indigo-500" />
                    <p className="text-sm font-semibold text-slate-700">Parcours du trajet</p>
                  </div>
                  <div className="flex items-center overflow-x-auto pb-2 gap-0">
                    {arrets.map((arret, idx) => (
                      <div key={idx} className="flex items-center flex-shrink-0">
                        <div className="flex flex-col items-center">
                          {idx === 0 ? (
                            <CircleDot size={22} className="text-indigo-600 mb-1.5" />
                          ) : idx === arrets.length - 1 ? (
                            <MapPin size={22} className="text-emerald-500 mb-1.5" />
                          ) : (
                            <Circle size={16} className="text-slate-300 mb-1.5 mt-0.5" />
                          )}
                          <p className="text-xs font-semibold text-slate-700 text-center max-w-[80px]">{arret.ville}</p>
                          {idx === 0 && (
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide mt-0.5">Départ</span>
                          )}
                          {idx === arrets.length - 1 && (
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">Arrivée</span>
                          )}
                        </div>
                        {idx < arrets.length - 1 && (
                          <div className="flex items-center mx-1 mb-5">
                            <div className="h-0.5 w-8 bg-slate-200 rounded-full" />
                            <ChevronRight size={12} className="text-slate-300 -ml-1" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ INCIDENTS ══ */}
              {incidents.length > 0 && (
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert size={16} className="text-red-500" />
                    <p className="text-sm font-semibold text-slate-700">Incidents signalés</p>
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
                      {incidents.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {incidents.map((inc) => {
                      const cfg = INCIDENT_CONFIG[inc.type] ?? INCIDENT_CONFIG.AUTRE;
                      return (
                        <div key={inc.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.className}`}>
                                {cfg.label}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                inc.resolu
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                              }`}>
                                {inc.resolu ? 'Résolu' : 'En cours'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-snug">{inc.description}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 flex-shrink-0 text-right">
                            {new Date(inc.dateIncident).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ LISTE DES PASSAGERS ══ */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* En-tête liste */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-indigo-500" />
                    <p className="text-sm font-semibold text-slate-700">Liste des passagers</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
                      {total}
                    </span>
                    <button
                      onClick={() => setShowPriorityOnly(!showPriorityOnly)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        showPriorityOnly
                          ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                          : 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                      }`}
                    >
                      <Baby size={12} />
                      {showPriorityOnly ? 'Priorité' : 'Enfants'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un passager..."
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white w-56 transition-all"
                  />
                </div>

                {/* Tableau responsive */}
                {passagersFiltres.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">Aucun passager trouvé</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          {['Nom', 'Prénom', 'Siège', 'Catégorie', 'Statut', 'Enfant'].map((h) => (
                            <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {passagersFiltres.map((p: any, idx: number) => (
                          <tr
                            key={idx}
                            className={`hover:bg-indigo-50/30 transition-colors ${
                              p.statut === 'UTILISE' ? '' : 'bg-amber-50/20'
                            }`}
                          >
                            <td className="px-5 py-3.5 font-semibold text-slate-800">{p.nom}</td>
                            <td className="px-5 py-3.5 text-slate-600">{p.prenom}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                                <Hash size={10} /> {p.siege ?? 'N/A'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold ring-1 ring-violet-200">
                                <Tag size={10} /> {p.categorie}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {p.statut === 'UTILISE' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
                                  <CheckCircle2 size={11} /> Embarqué
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold ring-1 ring-amber-200">
                                  <Hourglass size={11} /> En attente
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {p.enfantSurGenoux ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold ring-1 ring-amber-200">
                                  <Baby size={10} /> Oui
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer table */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{passagersFiltres.length} passager(s) affiché(s)</span>
                  <span>{embarques} embarqué(s) · {enAttente} en attente</span>
                </div>
              </div>

            </>
          )}

          {!manifeste && !error && (
            <div className="text-center py-16 text-slate-400 text-sm">
              Aucun manifeste disponible pour ce trajet
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

function DepartTerminerBar({ trajetId, statut, onAction }: {
  trajetId: number;
  statut: string;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState<'depart' | 'terminer' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleDepart = async () => {
    setLoading('depart');
    setError('');
    try {
      const res = await chauffeurDepartApi.declencherDepart(trajetId);
      setMessage(res.message || 'Départ enregistré ✅');
      setTimeout(() => { setMessage(''); onAction(); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(null);
    }
  };

  const handleTerminer = async () => {
    setLoading('terminer');
    setError('');
    try {
      const res = await apiClient.post(`/chauffeur/trajets/${trajetId}/terminer`);
      setMessage(res.data.message || 'Trajet terminé ✅');
      setTimeout(() => { setMessage(''); onAction(); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(null);
    }
  };

  if (message) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-800">{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      {error && (
        <div className="mb-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
          <AlertTriangle size={15} /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Actions du trajet</p>
          <p className="text-xs text-slate-400">
            {statut === 'PLANIFIE' ? 'Le bus est au quai, prêt à partir' : 'Le trajet est en cours'}
          </p>
        </div>
        <div className="flex gap-3">
          {statut === 'PLANIFIE' && (
            <button
              onClick={handleDepart}
              disabled={loading !== null}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:bg-slate-300 shadow-sm hover:shadow-md transition-all"
            >
              {loading === 'depart' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              DÉPART
            </button>
          )}
          {statut === 'EN_COURS' && (
            <button
              onClick={handleTerminer}
              disabled={loading !== null}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 disabled:bg-slate-300 shadow-sm hover:shadow-md transition-all"
            >
              {loading === 'terminer' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Square size={16} />
              )}
              TERMINER
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
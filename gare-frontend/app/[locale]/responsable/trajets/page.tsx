'use client';

import { useState, useEffect } from 'react';
import { responsableTrajetApi } from '@/lib/api/responsable/trajets';
import { responsableBusApi } from '@/lib/api/responsable/bus';
import { responsableLigneApi } from '@/lib/api/responsable/lignes';
import { responsableChauffeurApi } from '@/lib/api/responsable/chauffeurs';
import { responsableQuaiApi } from '@/lib/api/responsable/quais';
import { responsableNotificationApi } from '@/lib/api/responsable/notifications';
import { Trajet, TrajetRequest, Bus, Ligne, Chauffeur, Quai, TypeNotification } from '@/types';
import {
  Route, Plus, X, Search, Calendar, Clock, Bus as BusIcon, User, MapPin,
  CheckCircle2, AlertCircle, AlertTriangle, Timer, LucideIcon,
  Eye, Ban, Hash, Luggage, Bell, Send
} from 'lucide-react';

const statutConfig: Record<string, { label: string; class: string; icon: LucideIcon }> = {
  PLANIFIE: { label: 'Planifié', class: 'bg-blue-50 text-blue-600', icon: Calendar },
  EN_COURS: { label: 'En cours', class: 'bg-emerald-50 text-emerald-600', icon: Timer },
  TERMINE: { label: 'Terminé', class: 'bg-slate-100 text-slate-500', icon: CheckCircle2 },
  ANNULE: { label: 'Annulé', class: 'bg-rose-50 text-rose-600', icon: AlertCircle },
  RETARDE: { label: 'Retardé', class: 'bg-amber-50 text-amber-600', icon: AlertTriangle },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr: string) {
  return `${formatDate(dateStr)} à ${formatTime(dateStr)}`;
}

function formatNullable(value: string | null | undefined, fallback = '—') {
  return value ? formatDateTime(value) : fallback;
}

export default function ResponsableTrajetsPage() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [quais, setQuais] = useState<Quai[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState<TrajetRequest>({
    ligneId: 0,
    busId: 0,
    chauffeurId: undefined,
    quaiId: undefined,
    dateDepart: '',
    dateArriveePrevue: undefined,
  });

  // Detail modal
  const [selectedTrajet, setSelectedTrajet] = useState<Trajet | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Notification modal
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifSuccess, setNotifSuccess] = useState('');

  const loadTrajets = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await responsableTrajetApi.getAll();
      setTrajets(Array.isArray(data) ? data : []);
    } catch {
      setError('Impossible de charger les trajets');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      responsableTrajetApi.getAll(),
      responsableBusApi.getAll(),
      responsableLigneApi.getAll(),
      responsableChauffeurApi.getAll(),
      responsableQuaiApi.getAll(),
    ]).then(([trajetsData, busesData, lignesData, chauffeursData, quaisData]) => {
      if (cancelled) return;
      setTrajets(Array.isArray(trajetsData) ? trajetsData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setLignes(Array.isArray(lignesData) ? lignesData : []);
      setChauffeurs(Array.isArray(chauffeursData) ? chauffeursData : []);
      setQuais(Array.isArray(quaisData) ? quaisData : []);
    }).catch(() => {
      if (!cancelled) setError('Impossible de charger les données');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const openCreateModal = () => {
    setFormData({
      ligneId: 0,
      busId: 0,
      chauffeurId: undefined,
      quaiId: undefined,
      dateDepart: '',
      dateArriveePrevue: undefined,
    });
    setShowModal(true);
  };

  const openDetailModal = async (trajet: Trajet) => {
    setDetailLoading(true);
    setSelectedTrajet(trajet);
    try {
      const detail = await responsableTrajetApi.getById(trajet.id);
      setSelectedTrajet(detail);
    } catch {
      setSelectedTrajet(trajet);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedTrajet) return;
    const nbRes = selectedTrajet.nbReservations ?? 0;
    if (nbRes > 0) {
      alert(`Ce trajet a ${nbRes} réservation(s) active(s). Impossible de l'annuler.`);
      return;
    }
    if (!confirm(`Voulez-vous vraiment annuler ce trajet ?\n\nCette action est irréversible.`)) return;
    setCancelling(true);
    try {
      await responsableTrajetApi.annuler(selectedTrajet.id);
      setSelectedTrajet(null);
      loadTrajets(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : 'Erreur lors de l\'annulation';
      alert(message);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ligneId || !formData.busId || !formData.dateDepart) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: TrajetRequest = {
        ligneId: formData.ligneId,
        busId: formData.busId,
        chauffeurId: formData.chauffeurId || undefined,
        quaiId: formData.quaiId || undefined,
        dateDepart: formData.dateDepart,
        dateArriveePrevue: formData.dateArriveePrevue || undefined,
      };
      await responsableTrajetApi.create(payload);
      setShowModal(false);
      loadTrajets(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : 'Erreur lors de la création du trajet';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLigne = lignes.find(l => l.id === formData.ligneId);

  const handleDateDepartChange = (value: string) => {
    setFormData(prev => ({ ...prev, dateDepart: value }));
    if (selectedLigne?.dureeMinutes && value) {
      const dep = new Date(value);
      dep.setMinutes(dep.getMinutes() + selectedLigne.dureeMinutes);
      setFormData(prev => ({ ...prev, dateDepart: value, dateArriveePrevue: dep.toISOString().slice(0, 16) }));
    }
  };

  const activeBuses = buses.filter(b => b.actif && !b.enMaintenance);

  const filteredTrajets = trajets.filter(t => {
    const matchSearch =
      (t.ligne?.villeDepart || t.villeDepart || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ligne?.villeArrivee || t.villeArrivee || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.bus?.matricule || t.busMatricule || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const canCancel = selectedTrajet &&
    selectedTrajet.statut !== 'ANNULE' &&
    (selectedTrajet.nbReservations ?? 0) === 0;

  const handleNotifierRetard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrajet || !notifMessage.trim()) return;
    setNotifSending(true);
    setNotifError('');
    setNotifSuccess('');
    try {
      await responsableNotificationApi.envoyer({
        trajetId: selectedTrajet.id,
        type: TypeNotification.RETARD,
        message: notifMessage.trim(),
      });
      setNotifSuccess('Notifications envoyées aux voyageurs concernés');
      setNotifMessage('');
      setTimeout(() => { setShowNotifModal(false); setNotifSuccess(''); }, 2000);
    } catch {
      setNotifError("Erreur lors de l'envoi des notifications");
    } finally {
      setNotifSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Trajets</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez les départs de votre compagnie</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={15} /> Nouveau Trajet
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher par ville, matricule..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(statutConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <div className="text-xs text-slate-400 ml-auto">
          {filteredTrajets.length} trajet{filteredTrajets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filteredTrajets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <Route size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucun trajet trouvé.</p>
          <button onClick={openCreateModal} className="mt-3 text-indigo-600 text-sm font-semibold hover:underline">
            Créer le premier trajet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrajets.map(trajet => {
            const cfg = statutConfig[trajet.statut] || statutConfig.PLANIFIE;
            const StatusIcon = cfg.icon;
            const villeDep = trajet.ligne?.villeDepart || trajet.villeDepart || '—';
            const villeArr = trajet.ligne?.villeArrivee || trajet.villeArrivee || '—';
            const busMat = trajet.bus?.matricule || trajet.busMatricule || '—';
            const chauffeurNom = trajet.chauffeur
              ? `${trajet.chauffeur.prenom} ${trajet.chauffeur.nom}`
              : trajet.chauffeurNom || '—';
            const quaiNum = trajet.quai?.numero ?? trajet.quaiNumero;

            return (
              <div
                key={trajet.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => openDetailModal(trajet)}
                  >
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Route size={18} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-base truncate">
                        {villeDep} <span className="text-slate-300 mx-1">→</span> {villeArr}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(trajet.dateDepart)}
                        {trajet.dateArriveePrevue && (
                          <> · Arrivée prévue {formatTime(trajet.dateArriveePrevue)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <BusIcon size={13} className="text-slate-400" />
                      <span className="font-mono font-semibold text-slate-700">{busMat}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User size={13} className="text-slate-400" />
                      <span className="font-medium text-slate-700">{chauffeurNom}</span>
                    </div>
                    {quaiNum !== undefined && quaiNum !== null && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="font-medium text-slate-700">Quai {quaiNum}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.class}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => openDetailModal(trajet)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Voir détails"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Détails ── */}
      {selectedTrajet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Route size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Trajet #{selectedTrajet.id}
                </h2>
              </div>
              <button onClick={() => setSelectedTrajet(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {detailLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (() => {
                const detailCfg = statutConfig[selectedTrajet.statut] || statutConfig.PLANIFIE;
                const DetailStatusIcon = detailCfg.icon;
                return (
                <div className="space-y-5">
                  {/* Statut + ID */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-slate-400" />
                      <span className="text-sm font-mono font-bold text-slate-700">ID {selectedTrajet.id}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${detailCfg.class}`}>
                      <DetailStatusIcon size={12} />
                      {detailCfg.label}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    {/* Ligne */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ligne</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedTrajet.ligne?.villeDepart || selectedTrajet.villeDepart || '—'}
                        <span className="text-slate-300 mx-1.5">→</span>
                        {selectedTrajet.ligne?.villeArrivee || selectedTrajet.villeArrivee || '—'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Ligne #{selectedTrajet.ligneId} · {selectedTrajet.ligne?.dureeMinutes ?? '—'} min · {selectedTrajet.ligne?.prixBase ?? '—'} DH
                      </p>
                    </div>

                    {/* Grid infos */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bus</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedTrajet.bus?.matricule || selectedTrajet.busMatricule || '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Bus #{selectedTrajet.busId} · {selectedTrajet.bus?.marque || ''} {selectedTrajet.bus?.nbSieges ?? ''} places
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chauffeur</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedTrajet.chauffeur
                            ? `${selectedTrajet.chauffeur.prenom} ${selectedTrajet.chauffeur.nom}`
                            : selectedTrajet.chauffeurNom || 'Non assigné'}
                        </p>
                        {selectedTrajet.chauffeurId && (
                          <p className="text-xs text-slate-400">Chauffeur #{selectedTrajet.chauffeurId}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quai</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedTrajet.quai?.numero ?? selectedTrajet.quaiNumero
                            ? `Quai ${selectedTrajet.quai?.numero ?? selectedTrajet.quaiNumero}`
                            : 'Non assigné'}
                        </p>
                        {selectedTrajet.quaiId && (
                          <p className="text-xs text-slate-400">Quai #{selectedTrajet.quaiId}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Réservations</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedTrajet.nbReservations ?? 0} réservation{(selectedTrajet.nbReservations ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dates & Horaires</p>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Départ</p>
                          <p className="font-semibold text-slate-700">{formatDateTime(selectedTrajet.dateDepart)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Arrivée prev.</p>
                          <p className="font-semibold text-slate-700">{formatNullable(selectedTrajet.dateArriveePrevue)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Arrivée réelle</p>
                          <p className="font-semibold text-slate-700">{formatNullable(selectedTrajet.dateArriveeReelle)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Retard */}
                    {(selectedTrajet.retardMinutes ?? 0) > 0 && (
                      <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
                        <Timer size={14} className="text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">
                          Retard : {selectedTrajet.retardMinutes} minutes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
              })()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              {canCancel ? (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Annulation...</>
                  ) : (
                    <><Ban size={15} /> Annuler ce trajet</>
                  )}
                </button>
              ) : selectedTrajet?.statut !== 'ANNULE' && (
                <div className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <Luggage size={14} />
                  {selectedTrajet?.nbReservations ?? 0 > 0
                    ? `Impossible : ${selectedTrajet?.nbReservations} réservation(s) active(s)`
                    : 'Trajet non annulable'}
                </div>
              )}
              <button
                onClick={() => {
                  const vDep = selectedTrajet?.ligne?.villeDepart || selectedTrajet?.villeDepart || '';
                  const vArr = selectedTrajet?.ligne?.villeArrivee || selectedTrajet?.villeArrivee || '';
                  const dDep = selectedTrajet?.dateDepart ? new Date(selectedTrajet.dateDepart).toLocaleDateString('fr-FR') : '';
                  const comp = selectedTrajet?.ligne?.compagnie?.nom || '';
                  setNotifMessage(`Retard sur le trajet ${vDep} → ${vArr} du ${dDep} (${comp}).\nCause : `);
                  setShowNotifModal(true);
                }}
                className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition flex items-center justify-center gap-2"
              >
                <Bell size={15} /> Notifier retard
              </button>
              <button
                onClick={() => setSelectedTrajet(null)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Création ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Route size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Nouveau trajet</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="trajet-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Ligne <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.ligneId || ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      setFormData(prev => ({ ...prev, ligneId: id, dateArriveePrevue: undefined }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="">Sélectionner une ligne</option>
                    {lignes.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.villeDepart} → {l.villeArrivee} ({l.dureeMinutes ? `${l.dureeMinutes} min` : `${l.prixBase} DH`})
                      </option>
                    ))}
                    {lignes.length === 0 && (
                      <option value="" disabled>Aucune ligne disponible</option>
                    )}
                  </select>
                  {selectedLigne && (
                    <p className="text-xs text-slate-400 mt-1">
                      Durée estimée : {selectedLigne.dureeMinutes ?? '—'} min · Prix base : {selectedLigne.prixBase} DH
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Bus <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.busId || ''}
                    onChange={e => setFormData(prev => ({ ...prev, busId: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="">Sélectionner un bus</option>
                    {activeBuses.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.matricule} — {b.marque} {b.modele || ''} ({b.nbSieges} places{b.climatise ? ' · Clim' : ''}{b.wifi ? ' · WiFi' : ''})
                      </option>
                    ))}
                    {activeBuses.length === 0 && (
                      <option value="" disabled>Aucun bus actif disponible</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Chauffeur</label>
                  <select
                    value={formData.chauffeurId || ''}
                    onChange={e => setFormData(prev => ({ ...prev, chauffeurId: Number(e.target.value) || undefined }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="">Non assigné</option>
                    {chauffeurs.filter(c => !c.enConge).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom} — {c.numeroPermis || 'N° permis: —'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Quai</label>
                  <select
                    value={formData.quaiId || ''}
                    onChange={e => setFormData(prev => ({ ...prev, quaiId: Number(e.target.value) || undefined }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sélectionner un quai (optionnel)</option>
                    {quais.map(q => (
                      <option key={q.id} value={q.id}>
                        Quai {q.numero}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Date & heure de départ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dateDepart ? formData.dateDepart.slice(0, 16) : ''}
                    onChange={e => handleDateDepartChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date & heure d&apos;arrivée prévue</label>
                  <input
                    type="datetime-local"
                    value={formData.dateArriveePrevue ? formData.dateArriveePrevue.slice(0, 16) : ''}
                    onChange={e => setFormData(prev => ({ ...prev, dateArriveePrevue: e.target.value || undefined }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {selectedLigne?.dureeMinutes && formData.dateDepart && !formData.dateArriveePrevue && (
                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                      <Clock size={12} /> L&apos;arrivée sera automatiquement calculée ({selectedLigne.dureeMinutes} min après départ)
                    </p>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              <button
                type="submit"
                form="trajet-form"
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Création...</>
                ) : (
                  'Créer le trajet'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Notifier Retard ── */}
      {showNotifModal && selectedTrajet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Bell size={16} className="text-amber-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Notifier un retard</h2>
              </div>
              <button onClick={() => { setShowNotifModal(false); setNotifError(''); setNotifSuccess(''); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNotifierRetard} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1 font-medium">Trajet</p>
                <p className="text-sm font-bold text-slate-800">
                  {selectedTrajet.ligne?.villeDepart || selectedTrajet.villeDepart} → {selectedTrajet.ligne?.villeArrivee || selectedTrajet.villeArrivee}
                </p>
                <p className="text-xs text-slate-400">{formatDateTime(selectedTrajet.dateDepart)}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Message de retard <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ex: Le bus a 20 minutes de retard en raison des conditions de circulation..."
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {notifError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm">{notifError}</div>
              )}
              {notifSuccess && (
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> {notifSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={notifSending || !notifMessage.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50"
                >
                  <Send size={15} />
                  {notifSending ? 'Envoi...' : `Envoyer aux voyageurs`}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNotifModal(false); setNotifError(''); setNotifSuccess(''); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

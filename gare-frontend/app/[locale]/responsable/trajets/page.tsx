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
  Eye, Ban, Hash, Luggage, Bell, Send, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const statutConfig: Record<string, { label: string; class: string; icon: LucideIcon }> = {
  PLANIFIE: { label: 'Planifié', class: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', icon: Calendar },
  EN_COURS: { label: 'En cours', class: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', icon: Timer },
  TERMINE: { label: 'Terminé', class: 'bg-slate-100 text-slate-500 dark:bg-zinc-700 dark:text-zinc-400', icon: CheckCircle2 },
  ANNULE: { label: 'Annulé', class: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', icon: AlertCircle },
  RETARDE: { label: 'Retardé', class: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', icon: AlertTriangle },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
  const [refreshing, setRefreshing] = useState(false);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [quais, setQuais] = useState<Quai[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState<TrajetRequest>({
    ligneId: 0, busId: 0, chauffeurId: undefined, quaiId: undefined, dateDepart: '', dateArriveePrevue: undefined,
  });

  const [selectedTrajet, setSelectedTrajet] = useState<Trajet | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifSuccess, setNotifSuccess] = useState('');

  const loadAll = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await responsableTrajetApi.getAll();
      setTrajets(Array.isArray(data) ? data : []);
    } catch { setError('Impossible de charger les trajets'); }
    finally { if (showLoader) setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      responsableTrajetApi.getAll(), responsableBusApi.getAll(), responsableLigneApi.getAll(),
      responsableChauffeurApi.getAll(), responsableQuaiApi.getAll(),
    ]).then(([trajetsData, busesData, lignesData, chauffeursData, quaisData]) => {
      if (cancelled) return;
      setTrajets(Array.isArray(trajetsData) ? trajetsData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setLignes(Array.isArray(lignesData) ? lignesData : []);
      setChauffeurs(Array.isArray(chauffeursData) ? chauffeursData : []);
      setQuais(Array.isArray(quaisData) ? quaisData : []);
    }).catch(() => { if (!cancelled) setError('Impossible de charger les données'); })
    .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await responsableTrajetApi.getAll();
      setTrajets(Array.isArray(data) ? data : []);
    } catch {}
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setFormData({ ligneId: 0, busId: 0, chauffeurId: undefined, quaiId: undefined, dateDepart: '', dateArriveePrevue: undefined });
    setShowModal(true);
  };

  const openDetailModal = async (trajet: Trajet) => {
    setDetailLoading(true);
    setSelectedTrajet(trajet);
    try { const detail = await responsableTrajetApi.getById(trajet.id); setSelectedTrajet(detail); }
    catch { setSelectedTrajet(trajet); }
    finally { setDetailLoading(false); }
  };

  const handleCancel = async () => {
    if (!selectedTrajet) return;
    if ((selectedTrajet.nbReservations ?? 0) > 0) {
      alert(`Ce trajet a ${selectedTrajet.nbReservations} réservation(s) active(s). Impossible de l'annuler.`);
      return;
    }
    if (!confirm('Voulez-vous vraiment annuler ce trajet ?')) return;
    setCancelling(true);
    try {
      await responsableTrajetApi.annuler(selectedTrajet.id);
      setSelectedTrajet(null);
      loadAll(true);
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.message : 'Erreur');
    } finally { setCancelling(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ligneId || !formData.busId || !formData.dateDepart) {
      alert('Veuillez remplir tous les champs obligatoires.'); return;
    }
    setSubmitting(true);
    try {
      await responsableTrajetApi.create({
        ligneId: formData.ligneId, busId: formData.busId,
        chauffeurId: formData.chauffeurId || undefined, quaiId: formData.quaiId || undefined,
        dateDepart: formData.dateDepart, dateArriveePrevue: formData.dateArriveePrevue || undefined,
      });
      setShowModal(false);
      loadAll(true);
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'response' in err ? (err as any).response?.data?.message : 'Erreur');
    } finally { setSubmitting(false); }
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

  const canCancel = selectedTrajet && selectedTrajet.statut !== 'ANNULE' && (selectedTrajet.nbReservations ?? 0) === 0;

  const handleNotifierRetard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrajet || !notifMessage.trim()) return;
    setNotifSending(true); setNotifError(''); setNotifSuccess('');
    try {
      await responsableNotificationApi.envoyer({ trajetId: selectedTrajet.id, type: TypeNotification.RETARD, message: notifMessage.trim() });
      setNotifSuccess('Notifications envoyées aux voyageurs concernés');
      setNotifMessage('');
      setTimeout(() => { setShowNotifModal(false); setNotifSuccess(''); }, 2000);
    } catch { setNotifError("Erreur lors de l'envoi des notifications"); }
    finally { setNotifSending(false); }
  };

  const planifCount = trajets.filter(t => t.statut === 'PLANIFIE').length;
  const encoursCount = trajets.filter(t => t.statut === 'EN_COURS').length;
  const termineCount = trajets.filter(t => t.statut === 'TERMINE').length;

  return (
    <div className="space-y-6 pb-10">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Planifiés', value: planifCount, gradient: 'from-blue-400 to-indigo-600', icon: Calendar },
          { label: 'En cours', value: encoursCount, gradient: 'from-emerald-400 to-teal-600', icon: Timer },
          { label: 'Terminés', value: termineCount, gradient: 'from-slate-400 to-slate-600', icon: CheckCircle2 },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} shadow-md`}>
                <stat.icon size={16} className="text-white" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
          <input type="text" placeholder="Rechercher par ville, matricule..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-600 dark:text-zinc-300">
          <option value="all">Tous les statuts</option>
          {Object.entries(statutConfig).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handleRefresh}
            className="p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 transition"
            title="Actualiser"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Nouveau Trajet</button>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des trajets…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : filteredTrajets.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route size={24} className="text-orange-400" /></div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucun trajet trouvé.</p>
          <button onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Créer le premier trajet</button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          {filteredTrajets.map((trajet, idx) => {
            const cfg = statutConfig[trajet.statut] || statutConfig.PLANIFIE;
            const StatusIcon = cfg.icon;
            const villeDep = trajet.ligne?.villeDepart || trajet.villeDepart || '—';
            const villeArr = trajet.ligne?.villeArrivee || trajet.villeArrivee || '—';
            const busMat = trajet.bus?.matricule || trajet.busMatricule || '—';
            const chauffeurNom = trajet.chauffeur ? `${trajet.chauffeur.prenom} ${trajet.chauffeur.nom}` : trajet.chauffeurNom || '—';
            const quaiNum = trajet.quai?.numero ?? trajet.quaiNumero;

            return (
              <motion.div key={trajet.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => openDetailModal(trajet)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Route size={18} className="text-white" /></div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white text-base truncate">
                        {villeDep} <span className="text-slate-300 dark:text-zinc-600 mx-1">→</span> {villeArr}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        {formatDateTime(trajet.dateDepart)}
                        {trajet.dateArriveePrevue && <> · Arrivée prévue {formatTime(trajet.dateArriveePrevue)}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <BusIcon size={13} className="text-slate-400 dark:text-zinc-500" />
                      <span className="font-mono font-semibold text-slate-700 dark:text-zinc-200">{busMat}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <User size={13} className="text-slate-400 dark:text-zinc-500" />
                      <span className="font-medium text-slate-700 dark:text-zinc-200">{chauffeurNom}</span>
                    </div>
                    {quaiNum !== undefined && quaiNum !== null && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                        <MapPin size={13} className="text-slate-400 dark:text-zinc-500" />
                        <span className="font-medium text-slate-700 dark:text-zinc-200">Quai {quaiNum}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.class}`}>
                      <StatusIcon size={12} /> {cfg.label}
                    </span>
                    <button onClick={() => openDetailModal(trajet)}
                      className="p-2 text-slate-400 dark:text-zinc-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition" title="Voir détails">
                      <Eye size={16} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Detail Modal */}
      {selectedTrajet && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                  <Route size={16} className="text-orange-500" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Trajet #{selectedTrajet.id}</h2>
              </div>
              <button onClick={() => setSelectedTrajet(null)} className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {detailLoading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : (() => {
                const detailCfg = statutConfig[selectedTrajet.statut] || statutConfig.PLANIFIE;
                const DetailStatusIcon = detailCfg.icon;
                return (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-slate-400" />
                        <span className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300">ID {selectedTrajet.id}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${detailCfg.class}`}>
                        <DetailStatusIcon size={12} /> {detailCfg.label}</span>
                    </div>
                    <div className="border-t border-slate-100 dark:border-zinc-700 pt-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Ligne</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          {selectedTrajet.ligne?.villeDepart || selectedTrajet.villeDepart || '—'}
                          <span className="text-slate-300 dark:text-zinc-600 mx-1.5">→</span>
                          {selectedTrajet.ligne?.villeArrivee || selectedTrajet.villeArrivee || '—'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">Ligne #{selectedTrajet.ligneId} · {selectedTrajet.ligne?.dureeMinutes ?? '—'} min · {selectedTrajet.ligne?.prixBase ?? '—'} DH</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Bus', value: selectedTrajet.bus?.matricule || selectedTrajet.busMatricule || '—', sub: `Bus #${selectedTrajet.busId}` },
                          { label: 'Chauffeur', value: selectedTrajet.chauffeur ? `${selectedTrajet.chauffeur.prenom} ${selectedTrajet.chauffeur.nom}` : selectedTrajet.chauffeurNom || 'Non assigné', sub: selectedTrajet.chauffeurId ? `Chauffeur #${selectedTrajet.chauffeurId}` : undefined },
                          { label: 'Quai', value: selectedTrajet.quai?.numero ?? selectedTrajet.quaiNumero ? `Quai ${selectedTrajet.quai?.numero ?? selectedTrajet.quaiNumero}` : 'Non assigné', sub: selectedTrajet.quaiId ? `Quai #${selectedTrajet.quaiId}` : undefined },
                          { label: 'Réservations', value: `${selectedTrajet.nbReservations ?? 0} réservation${(selectedTrajet.nbReservations ?? 0) !== 1 ? 's' : ''}` },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.value}</p>
                            {item.sub && <p className="text-xs text-slate-400 dark:text-zinc-500">{item.sub}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 dark:border-zinc-700 pt-4 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Dates & Horaires</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">Départ</p>
                            <p className="font-semibold text-slate-700 dark:text-zinc-200">{formatDateTime(selectedTrajet.dateDepart)}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">Arrivée prev.</p>
                            <p className="font-semibold text-slate-700 dark:text-zinc-200">{formatNullable(selectedTrajet.dateArriveePrevue)}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">Arrivée réelle</p>
                            <p className="font-semibold text-slate-700 dark:text-zinc-200">{formatNullable(selectedTrajet.dateArriveeReelle)}</p>
                          </div>
                        </div>
                      </div>
                      {(selectedTrajet.retardMinutes ?? 0) > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 flex items-center gap-2">
                          <Timer size={14} className="text-amber-500" />
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Retard : {selectedTrajet.retardMinutes} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 shrink-0 flex gap-3">
              {canCancel ? (
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {cancelling ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Annulation...</> : <><Ban size={15} /> Annuler ce trajet</>}
                </button>
              ) : selectedTrajet?.statut !== 'ANNULE' ? (
                <div className="flex-1 bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <Luggage size={14} /> {(selectedTrajet?.nbReservations ?? 0) > 0 ? `Impossible : ${selectedTrajet?.nbReservations} réservation(s)` : 'Trajet non annulable'}
                </div>
              ) : null}
              <button onClick={() => {
                const vDep = selectedTrajet?.ligne?.villeDepart || selectedTrajet?.villeDepart || '';
                const vArr = selectedTrajet?.ligne?.villeArrivee || selectedTrajet?.villeArrivee || '';
                const dDep = selectedTrajet?.dateDepart ? new Date(selectedTrajet.dateDepart).toLocaleDateString('fr-FR') : '';
                setNotifMessage(`Retard sur le trajet ${vDep} → ${vArr} du ${dDep}.\nCause : `);
                setShowNotifModal(true);
              }}
                className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 transition flex items-center justify-center gap-2">
                <Bell size={15} /> Notifier retard</button>
              <button onClick={() => setSelectedTrajet(null)}
                className="flex-1 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-600 transition">Fermer</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                  <Route size={16} className="text-orange-500" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Nouveau trajet</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="trajet-form" onSubmit={handleSubmit} className="space-y-6">
                {[
                  { label: 'Ligne', required: true, value: formData.ligneId || '', onChange: (e: any) => { const id = Number(e.target.value); setFormData(prev => ({ ...prev, ligneId: id, dateArriveePrevue: undefined })); }, options: lignes.map(l => ({ value: l.id, text: `${l.villeDepart} → ${l.villeArrivee} (${l.dureeMinutes ? `${l.dureeMinutes} min` : `${l.prixBase} DH`})` })), emptyText: 'Sélectionner une ligne', emptyDisabledText: 'Aucune ligne disponible' },
                  { label: 'Bus', required: true, value: formData.busId || '', onChange: (e: any) => setFormData(prev => ({ ...prev, busId: Number(e.target.value) })), options: activeBuses.map(b => ({ value: b.id, text: `${b.matricule} — ${b.marque} ${b.modele || ''} (${b.nbSieges} places${b.climatise ? ' · Clim' : ''}${b.wifi ? ' · WiFi' : ''})` })), emptyText: 'Sélectionner un bus', emptyDisabledText: 'Aucun bus actif disponible' },
                  { label: 'Chauffeur', required: false, value: formData.chauffeurId || '', onChange: (e: any) => setFormData(prev => ({ ...prev, chauffeurId: Number(e.target.value) || undefined })), options: chauffeurs.filter(c => !c.enConge).map(c => ({ value: c.id, text: `${c.prenom} ${c.nom} — ${c.numeroPermis || 'N° permis: —'}` })), emptyText: 'Non assigné' },
                  { label: 'Quai', required: false, value: formData.quaiId || '', onChange: (e: any) => setFormData(prev => ({ ...prev, quaiId: Number(e.target.value) || undefined })), options: quais.map(q => ({ value: q.id, text: `Quai ${q.numero}` })), emptyText: 'Sélectionner un quai (optionnel)' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select required={field.required} value={field.value} onChange={field.onChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none text-slate-900 dark:text-white">
                      <option value="">{field.emptyText}</option>
                      {field.options.map(opt => (<option key={opt.value} value={opt.value}>{opt.text}</option>))}
                      {field.options.length === 0 && (<option value="" disabled>{(field as any).emptyDisabledText || 'Aucune option disponible'}</option>)}
                    </select>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Date & heure de départ <span className="text-rose-500">*</span></label>
                    <input type="datetime-local" required value={formData.dateDepart ? formData.dateDepart.slice(0, 16) : ''}
                      onChange={e => handleDateDepartChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Arrivée prévue</label>
                    <input type="datetime-local" value={formData.dateArriveePrevue ? formData.dateArriveePrevue.slice(0, 16) : ''}
                      onChange={e => setFormData(prev => ({ ...prev, dateArriveePrevue: e.target.value || undefined }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" />
                    {selectedLigne?.dureeMinutes && formData.dateDepart && !formData.dateArriveePrevue && (
                      <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Clock size={12} /> Arrivée auto ({selectedLigne.dureeMinutes} min)</p>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 shrink-0 flex gap-3">
              <button type="submit" form="trajet-form" disabled={submitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-200/50 dark:shadow-none">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Création...</> : 'Créer le trajet'}
              </button>
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-600 transition">Annuler</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifModal && selectedTrajet && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Bell size={16} className="text-amber-600 dark:text-amber-400" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Notifier un retard</h2>
              </div>
              <button onClick={() => { setShowNotifModal(false); setNotifError(''); setNotifSuccess(''); }}
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleNotifierRetard} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">Trajet</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedTrajet.ligne?.villeDepart || selectedTrajet.villeDepart} → {selectedTrajet.ligne?.villeArrivee || selectedTrajet.villeArrivee}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">{formatDateTime(selectedTrajet.dateDepart)}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Message <span className="text-rose-500">*</span></label>
                <textarea required rows={4} placeholder="Ex: Le bus a 20 minutes de retard..." value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
              </div>
              {notifError && <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm">{notifError}</div>}
              {notifSuccess && <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-sm flex items-center gap-2"><CheckCircle2 size={16} /> {notifSuccess}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={notifSending || !notifMessage.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-amber-200/50 dark:shadow-none">
                  <Send size={15} /> {notifSending ? 'Envoi...' : 'Envoyer aux voyageurs'}
                </button>
                <button type="button" onClick={() => { setShowNotifModal(false); setNotifError(''); setNotifSuccess(''); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition">Annuler</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

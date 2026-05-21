'use client';

import { useState, useEffect } from 'react';
import { responsableBusApi } from '@/lib/api/responsable/bus';
import { Bus, BusRequest } from '@/types';
import {
  Bus as BusIcon, Plus, X, Edit, Wrench, PowerOff, CheckCircle2,
  AlertTriangle, Search, LayoutGrid, List, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResponsableBusPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'maintenance' | 'inactif'>('all');
  const [optionsFilter, setOptionsFilter] = useState<'all' | 'clim' | 'wifi'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState<BusRequest>({
    matricule: '',
    marque: '',
    modele: '',
    nbSieges: 40,
    climatise: false,
    wifi: false,
    dateMaintenance: '',
    compagnieId: 0,
  });

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await responsableBusApi.getAll();
      setBuses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les bus');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setEditingBus(null);
    setFormData({ matricule: '', marque: '', modele: '', nbSieges: 40, climatise: false, wifi: false, dateMaintenance: '', compagnieId: 0 });
    setShowModal(true);
  };

  const openEditModal = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      matricule: bus.matricule, marque: bus.marque, modele: bus.modele || '',
      nbSieges: bus.nbSieges, climatise: bus.climatise, wifi: bus.wifi,
      dateMaintenance: bus.dateMaintenance || '', compagnieId: 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBus) { await responsableBusApi.update(editingBus.id, formData); }
      else { await responsableBusApi.create(formData); }
      setShowModal(false);
      loadBuses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleToggleMaintenance = async (bus: Bus) => {
    try {
      await responsableBusApi.toggleMaintenance(bus.id, !bus.enMaintenance);
      loadBuses();
    } catch (err) { alert('Erreur lors du changement de statut'); }
  };

  const handleDesactiver = async (bus: Bus) => {
    if (!confirm(`Voulez-vous vraiment désactiver le bus ${bus.matricule} ?`)) return;
    try { await responsableBusApi.desactiver(bus.id); loadBuses(); }
    catch (err) { alert('Erreur lors de la désactivation'); }
  };

  const handleActiver = async (bus: Bus) => {
    try { await responsableBusApi.activer(bus.id); loadBuses(); }
    catch (err) { alert('Erreur lors de l\'activation'); }
  };

  const filteredBuses = buses.filter(bus => {
    const matchSearch = bus.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.marque.toLowerCase().includes(searchQuery.toLowerCase());
    let matchStatus = true;
    if (statusFilter === 'actif') matchStatus = bus.actif && !bus.enMaintenance;
    if (statusFilter === 'inactif') matchStatus = !bus.actif;
    if (statusFilter === 'maintenance') matchStatus = bus.enMaintenance;
    let matchOptions = true;
    if (optionsFilter === 'clim') matchOptions = bus.climatise;
    if (optionsFilter === 'wifi') matchOptions = bus.wifi;
    return matchSearch && matchStatus && matchOptions;
  });

  const actifCount = buses.filter(b => b.actif && !b.enMaintenance).length;
  const maintenanceCount = buses.filter(b => b.enMaintenance).length;
  const inactifCount = buses.filter(b => !b.actif).length;

  return (
    <div className="space-y-6 pb-10">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Actifs', value: actifCount, gradient: 'from-emerald-400 to-teal-600', icon: CheckCircle2 },
          { label: 'Maintenance', value: maintenanceCount, gradient: 'from-amber-400 to-orange-500', icon: Wrench },
          { label: 'Inactifs', value: inactifCount, gradient: 'from-slate-400 to-slate-600', icon: PowerOff },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} shadow-md`}>
                <stat.icon size={16} className="text-white" />
              </div>
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
        className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
            <input type="text" placeholder="Rechercher matricule, marque..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-600 dark:text-zinc-300">
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="maintenance">En Maintenance</option>
            <option value="inactif">Inactif</option>
          </select>
          <select value={optionsFilter} onChange={(e) => setOptionsFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-600 dark:text-zinc-300">
            <option value="all">Toutes les options</option>
            <option value="clim">Climatisation</option>
            <option value="wifi">Wi-Fi</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadBuses(true)}
            className="p-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 transition"
            title="Actualiser"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-xl">
            <button onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-orange-500' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'}`}><List size={18} /></button>
            <button onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-zinc-700 shadow-sm text-orange-500' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'}`}><LayoutGrid size={18} /></button>
          </div>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Nouveau Bus</button>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-zinc-500 text-sm">Chargement des bus…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm">{error}</div>
      ) : filteredBuses.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-14 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BusIcon size={24} className="text-orange-400" /></div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">Aucun bus trouvé.</p>
          <button onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-orange-200/50 dark:shadow-none">
            <Plus size={15} /> Ajouter un bus</button>
        </motion.div>
      ) : viewMode === 'table' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-700">
                  {['Matricule', 'Véhicule', 'Sièges', 'Options', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {filteredBuses.map((bus, idx) => (
                  <motion.tr key={bus.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                    className={`hover:bg-orange-50/40 dark:hover:bg-zinc-800/50 transition-colors ${!bus.actif ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-lg">{bus.matricule}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <BusIcon size={16} className="text-white" /></div>
                        <div><p className="font-semibold text-slate-800 dark:text-white text-sm">{bus.marque}</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500">{bus.modele || '—'}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-600 dark:text-zinc-300">{bus.nbSieges} places</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        {bus.climatise && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md">CLIM</span>}
                        {bus.wifi && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-md">WIFI</span>}
                        {!bus.climatise && !bus.wifi && <span className="text-slate-400 dark:text-zinc-500 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <BusStatusBadge bus={bus} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(bus)} disabled={!bus.actif}
                          className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition disabled:opacity-50" title="Modifier"><Edit size={16} /></button>
                        <button onClick={() => handleToggleMaintenance(bus)} disabled={!bus.actif}
                          className={`p-1.5 rounded-lg transition disabled:opacity-50 ${bus.enMaintenance ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400'}`}
                          title={bus.enMaintenance ? "Terminer maintenance" : "Mettre en maintenance"}>
                          {bus.enMaintenance ? <CheckCircle2 size={16} /> : <Wrench size={16} />}</button>
                        {bus.actif ? (
                          <button onClick={() => handleDesactiver(bus)}
                            className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition" title="Désactiver"><PowerOff size={16} /></button>
                        ) : (
                          <button onClick={() => handleActiver(bus)}
                            className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition" title="Réactiver"><PowerOff size={16} /></button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBuses.map((bus, idx) => (
            <motion.div key={bus.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className={`bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col ${!bus.actif ? 'opacity-60' : ''}`}>
              <div className="p-5 flex-1 border-b border-slate-50 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/50 dark:shadow-none">
                    <BusIcon size={18} className="text-white" /></div>
                  <BusStatusBadge bus={bus} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-0.5">{bus.marque}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">{bus.modele || 'Modèle standard'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Sièges</p>
                    <p className="text-lg font-black text-slate-700 dark:text-zinc-200">{bus.nbSieges}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Options</p>
                    <div className="flex gap-2">
                      <span className={`w-3 h-3 rounded-full ${bus.climatise ? 'bg-blue-500' : 'bg-slate-200 dark:bg-zinc-600'}`} title="Climatisation" />
                      <span className={`w-3 h-3 rounded-full ${bus.wifi ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-zinc-600'}`} title="Wi-Fi" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Matricule</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200 font-mono">{bus.matricule}</p>
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-800 flex gap-1">
                <button onClick={() => openEditModal(bus)} disabled={!bus.actif}
                  className="flex-1 py-2 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-orange-500 hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition disabled:opacity-50" title="Modifier"><Edit size={16} /></button>
                <button onClick={() => handleToggleMaintenance(bus)} disabled={!bus.actif}
                  className={`flex-1 py-2 flex items-center justify-center rounded-xl transition disabled:opacity-50 ${bus.enMaintenance ? 'text-emerald-600 hover:bg-white dark:hover:bg-zinc-700' : 'text-slate-500 dark:text-zinc-400 hover:text-amber-600 hover:bg-white dark:hover:bg-zinc-700'}`}
                  title={bus.enMaintenance ? "Terminer maintenance" : "Mettre en maintenance"}>
                  {bus.enMaintenance ? <CheckCircle2 size={16} /> : <Wrench size={16} />}</button>
                {bus.actif ? (
                  <button onClick={() => handleDesactiver(bus)}
                    className="flex-1 py-2 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-rose-500 hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition" title="Désactiver"><PowerOff size={16} /></button>
                ) : (
                  <button onClick={() => handleActiver(bus)}
                    className="flex-1 py-2 flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition" title="Réactiver"><PowerOff size={16} /> Réactiver</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl flex items-center justify-center">
                  <BusIcon size={16} className="text-orange-500" /></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{editingBus ? 'Modifier le bus' : 'Nouveau bus'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="bus-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Matricule *</label>
                    <input type="text" required disabled={!!editingBus} placeholder="Ex: 12345-A-6" value={formData.matricule}
                      onChange={e => setFormData({ ...formData, matricule: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Marque *</label>
                    <input type="text" required placeholder="Ex: Mercedes-Benz" value={formData.marque}
                      onChange={e => setFormData({ ...formData, marque: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Modèle</label>
                    <input type="text" placeholder="Ex: Tourismo" value={formData.modele}
                      onChange={e => setFormData({ ...formData, modele: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Nb. Sièges *</label>
                    <input type="number" required min={1} max={100} value={formData.nbSieges}
                      onChange={e => setFormData({ ...formData, nbSieges: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Date Maintenance</label>
                    <input type="date" value={formData.dateMaintenance}
                      onChange={e => setFormData({ ...formData, dateMaintenance: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-700">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Équipements & Options</p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.climatise}
                        onChange={e => setFormData({ ...formData, climatise: e.target.checked })}
                        className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Climatisation</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.wifi}
                        onChange={e => setFormData({ ...formData, wifi: e.target.checked })}
                        className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Wi-Fi à bord</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 shrink-0 flex gap-3">
              <button type="submit" form="bus-form"
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-md shadow-orange-200/50 dark:shadow-none">
                {editingBus ? 'Enregistrer' : 'Créer le bus'}</button>
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-600 transition">Annuler</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function BusStatusBadge({ bus }: { bus: Bus }) {
  if (bus.enMaintenance) {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><Wrench size={12} /> Maintenance</span>;
  }
  if (!bus.actif) {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-zinc-700 dark:text-zinc-400"><PowerOff size={12} /> Inactif</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={12} /> Actif</span>;
}

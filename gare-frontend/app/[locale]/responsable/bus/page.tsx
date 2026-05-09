'use client';

import { useState, useEffect } from 'react';
import { responsableBusApi } from '@/lib/api/responsable/bus';
import { Bus, BusRequest } from '@/types';
import {
  Bus as BusIcon, Plus, X, Edit, Wrench, Trash2, PowerOff, CheckCircle2,
  AlertTriangle, AlertCircle, Search, LayoutGrid, List
} from 'lucide-react';

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

  const [formData, setFormData] = useState<BusRequest>({
    matricule: '',
    marque: '',
    modele: '',
    nbSieges: 40,
    climatise: false,
    wifi: false,
    dateMaintenance: '',
    compagnieId: 0, // Sera écrasé par le backend
  });

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    setLoading(true);
    try {
      const data = await responsableBusApi.getAll();
      setBuses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Impossible de charger les bus');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBus(null);
    setFormData({
      matricule: '', marque: '', modele: '', nbSieges: 40,
      climatise: false, wifi: false, dateMaintenance: '', compagnieId: 0
    });
    setShowModal(true);
  };

  const openEditModal = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      matricule: bus.matricule,
      marque: bus.marque,
      modele: bus.modele || '',
      nbSieges: bus.nbSieges,
      climatise: bus.climatise,
      wifi: bus.wifi,
      dateMaintenance: bus.dateMaintenance || '',
      compagnieId: 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBus) {
        await responsableBusApi.update(editingBus.id, formData);
      } else {
        await responsableBusApi.create(formData);
      }
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
    } catch (err) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleDesactiver = async (bus: Bus) => {
    if (!confirm(`Voulez-vous vraiment désactiver le bus ${bus.matricule} ?`)) return;
    try {
      await responsableBusApi.desactiver(bus.id);
      loadBuses();
    } catch (err) {
      alert('Erreur lors de la désactivation');
    }
  };

  const handleActiver = async (bus: Bus) => {
    try {
      await responsableBusApi.activer(bus.id);
      loadBuses();
    } catch (err) {
      alert('Erreur lors de l\'activation');
    }
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

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flotte de Bus</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez les véhicules de votre compagnie</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={15} /> Nouveau Bus
        </button>
      </div>

      {/* ── Filtres & Vue ── */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher matricule, marque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="maintenance">En Maintenance</option>
            <option value="inactif">Inactif</option>
          </select>

          <select 
            value={optionsFilter}
            onChange={(e) => setOptionsFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600"
          >
            <option value="all">Toutes les options</option>
            <option value="clim">Climatisation</option>
            <option value="wifi">Wi-Fi</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">{error}</div>
      ) : filteredBuses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <BusIcon size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucun bus ne correspond à votre recherche.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Matricule', 'Véhicule', 'Sièges', 'Options', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBuses.map((bus) => (
                <tr key={bus.id} className={`hover:bg-slate-50 transition-colors ${!bus.actif ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      {bus.matricule}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 text-sm">{bus.marque}</p>
                    <p className="text-xs text-slate-400">{bus.modele || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-600">
                    {bus.nbSieges} places
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      {bus.climatise && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">CLIM</span>}
                      {bus.wifi && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md">WIFI</span>}
                      {!bus.climatise && !bus.wifi && <span className="text-slate-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {bus.enMaintenance ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
                        <Wrench size={12} /> Maintenance
                      </span>
                    ) : !bus.actif ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        <PowerOff size={12} /> Inactif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={12} /> Actif
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(bus)}
                        disabled={!bus.actif}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleMaintenance(bus)}
                        disabled={!bus.actif}
                        className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                          bus.enMaintenance 
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={bus.enMaintenance ? "Terminer maintenance" : "Mettre en maintenance"}
                      >
                        {bus.enMaintenance ? <CheckCircle2 size={16} /> : <Wrench size={16} />}
                      </button>
                      {bus.actif ? (
                        <button
                          onClick={() => handleDesactiver(bus)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Désactiver"
                        >
                          <PowerOff size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActiver(bus)}
                          className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          title="Réactiver"
                        >
                          <PowerOff size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBuses.map((bus) => (
            <div key={bus.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${!bus.actif ? 'opacity-60' : ''}`}>
              <div className="p-5 flex-1 border-b border-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">
                    {bus.matricule}
                  </span>
                  <div>
                    {bus.enMaintenance ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600" title="En maintenance">
                        <Wrench size={14} />
                      </span>
                    ) : !bus.actif ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500" title="Inactif">
                        <PowerOff size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600" title="Actif">
                        <CheckCircle2 size={14} />
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-lg mb-0.5">{bus.marque}</h3>
                <p className="text-sm text-slate-500 mb-4">{bus.modele || 'Modèle standard'}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sièges</p>
                    <p className="text-sm font-semibold text-slate-700">{bus.nbSieges}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Options</p>
                    <div className="flex gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${bus.climatise ? 'bg-blue-500' : 'bg-slate-200'}`} title="Climatisation" />
                      <span className={`w-2 h-2 rounded-full ${bus.wifi ? 'bg-indigo-500' : 'bg-slate-200'}`} title="Wi-Fi" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 bg-slate-50 flex gap-1">
                <button
                  onClick={() => openEditModal(bus)}
                  disabled={!bus.actif}
                  className="flex-1 py-2 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition disabled:opacity-50"
                  title="Modifier"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleToggleMaintenance(bus)}
                  disabled={!bus.actif}
                  className={`flex-1 py-2 flex items-center justify-center rounded-xl transition disabled:opacity-50 ${
                    bus.enMaintenance 
                      ? 'text-emerald-600 hover:bg-white' 
                      : 'text-slate-500 hover:text-amber-600 hover:bg-white'
                  }`}
                  title={bus.enMaintenance ? "Terminer maintenance" : "Mettre en maintenance"}
                >
                  {bus.enMaintenance ? <CheckCircle2 size={16} /> : <Wrench size={16} />}
                </button>
                {bus.actif ? (
                  <button
                    onClick={() => handleDesactiver(bus)}
                    className="flex-1 py-2 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-white rounded-xl transition"
                    title="Désactiver"
                  >
                    <PowerOff size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleActiver(bus)}
                    className="flex-1 py-2 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-white rounded-xl transition"
                    title="Réactiver"
                  >
                    <PowerOff size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Création / Modif ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BusIcon size={16} className="text-indigo-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingBus ? 'Modifier le bus' : 'Nouveau bus'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="bus-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Matricule *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingBus}
                      placeholder="Ex: 12345-A-6"
                      value={formData.matricule}
                      onChange={e => setFormData({ ...formData, matricule: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Marque *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mercedes-Benz"
                      value={formData.marque}
                      onChange={e => setFormData({ ...formData, marque: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Modèle</label>
                    <input
                      type="text"
                      placeholder="Ex: Tourismo"
                      value={formData.modele}
                      onChange={e => setFormData({ ...formData, modele: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nb. Sièges *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={formData.nbSieges}
                      onChange={e => setFormData({ ...formData, nbSieges: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date Maintenance</label>
                    <input
                      type="date"
                      value={formData.dateMaintenance}
                      onChange={e => setFormData({ ...formData, dateMaintenance: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Équipements & Options</p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.climatise}
                        onChange={e => setFormData({ ...formData, climatise: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Climatisation</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.wifi}
                        onChange={e => setFormData({ ...formData, wifi: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Wi-Fi à bord</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
              <button
                type="submit"
                form="bus-form"
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition"
              >
                {editingBus ? 'Enregistrer' : 'Créer le bus'}
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
    </div>
  );
}

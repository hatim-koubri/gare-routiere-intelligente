'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminBusApi } from '@/lib/api/admin/bus';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { Bus, Compagnie } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Bus as BusIcon, Plus, RefreshCw, Wifi, Wind, X } from 'lucide-react';

const CHART_COLORS = ['#059669','#0d9488','#0891b2','#7c3aed','#d97706','#dc2626'];

export default function BusPage() {
  const [bus, setBus] = useState<Bus[]>([]);
  const [busFiltres, setBusFiltres] = useState<Bus[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtreCompagnieId, setFiltreCompagnieId] = useState<number>(0);
  const [formData, setFormData] = useState({
    matricule: '',
    marque: '',
    modele: '',
    nbSieges: 50,
    climatise: false,
    wifi: false,
    compagnieId: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Appliquer le filtre quand bus ou filtreCompagnieId change
  useEffect(() => {
    if (filtreCompagnieId === 0) {
      setBusFiltres(bus);
    } else {
      setBusFiltres(bus.filter((b) => b.compagnieId === filtreCompagnieId));
    }
  }, [bus, filtreCompagnieId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [busData, compagniesData] = await Promise.all([
        adminBusApi.getAll(),
        adminCompagnieApi.getAll(),
      ]);
      setBus(Array.isArray(busData) ? busData : []);
      setCompagnies(Array.isArray(compagniesData) ? compagniesData : []);
    } catch (error) {
      console.error('Erreur chargement', error);
      setBus([]);
      setCompagnies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminBusApi.create(formData);
      setShowModal(false);
      setFormData({ matricule: '', marque: '', modele: '', nbSieges: 50, climatise: false, wifi: false, compagnieId: 0 });
      loadData();
    } catch (error) {
      console.error('Erreur création', error);
      alert('Erreur lors de la création');
    }
  };

  const handleDesactiver = async (id: number) => {
    if (confirm('Désactiver ce bus ?')) {
      await adminBusApi.desactiver(id);
      loadData();
    }
  };

  const getCompagnieNom = (bus: Bus) => {
    return bus.compagnieNom || '-';
  };

  const fleetChartData = compagnies.map(c => ({
    name: c.nom,
    bus: bus.filter(b => b.compagnieId === c.id).length,
  }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement de la flotte…</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flotte de bus</h1>
          <p className="text-slate-500 text-sm mt-0.5">{bus.length} bus enregistrés</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:border-emerald-300 transition">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus size={16} /> Nouveau bus
          </button>
        </div>
      </div>

      {/* Chart flotte */}
      {fleetChartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="font-semibold text-slate-700 text-sm mb-4">Répartition de la flotte par compagnie</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fleetChartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f0fdf4' }} />
              <Bar dataKey="bus" name="Bus" radius={[6,6,0,0]}>
                {fleetChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtre */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select
          value={filtreCompagnieId}
          onChange={(e) => setFiltreCompagnieId(parseInt(e.target.value))}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        >
          <option value={0}>Toutes les compagnies</option>
          {compagnies.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        {filtreCompagnieId !== 0 && (
          <button onClick={() => setFiltreCompagnieId(0)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <X size={13} /> Réinitialiser
          </button>
        )}
        <span className="text-sm text-slate-500 ml-auto font-medium">{busFiltres.length} bus</span>
      </div>

      {busFiltres.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <BusIcon size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aucun bus trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Matricule','Marque','Modèle','Sièges','Compagnie','Options','Statut','Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {busFiltres.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-800 text-sm">{b.matricule}</td>
                  <td className="px-5 py-4 text-slate-700 text-sm">{b.marque}</td>
                  <td className="px-5 py-4 text-slate-500 text-sm">{b.modele || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-800">{b.nbSieges}</span>
                    <span className="text-slate-400 text-xs ml-1">sièges</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{getCompagnieNom(b)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {b.climatise && <span className="flex items-center gap-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full"><Wind size={10} />Clim</span>}
                      {b.wifi && <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"><Wifi size={10} />WiFi</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${b.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                      {b.actif ? '✓ Actif' : '× Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {b.actif && (
                      <button onClick={() => handleDesactiver(b.id)} className="text-xs text-rose-500 hover:text-rose-700 font-medium transition">Désactiver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Nouveau bus</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>
            <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Matricule *</label>
                <input
                  type="text"
                  required
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Marque *</label>
                <input
                  type="text"
                  required
                  value={formData.marque}
                  onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Modèle</label>
                <input
                  type="text"
                  value={formData.modele || ''}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nombre de sièges</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.nbSieges ?? 50}
                  onChange={(e) => setFormData({ ...formData, nbSieges: parseInt(e.target.value) || 50 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Compagnie *</label>
                <select
                  required
                  value={formData.compagnieId}
                  onChange={(e) => setFormData({ ...formData, compagnieId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Sélectionner une compagnie</option>
                  {compagnies.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.climatise}
                    onChange={(e) => setFormData({ ...formData, climatise: e.target.checked })}
                  />
                  Climatisé
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.wifi}
                    onChange={(e) => setFormData({ ...formData, wifi: e.target.checked })}
                  />
                  WiFi
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg">
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminBusApi } from '@/lib/api/admin/bus';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { Bus, Compagnie } from '@/types';

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bus</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nouveau Bus
        </button>
      </div>

      {/* Filtre par compagnie */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filtrer par compagnie :</label>
        <select
          value={filtreCompagnieId}
          onChange={(e) => setFiltreCompagnieId(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0}>Toutes les compagnies</option>
          {compagnies.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        {filtreCompagnieId !== 0 && (
          <button
            onClick={() => setFiltreCompagnieId(0)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Réinitialiser
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          {busFiltres.length} bus trouvé{busFiltres.length > 1 ? 's' : ''}
        </span>
      </div>

      {busFiltres.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun bus trouvé
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marque</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modèle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sièges</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {busFiltres.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{b.matricule}</td>
                  <td className="px-6 py-4">{b.marque}</td>
                  <td className="px-6 py-4">{b.modele || '-'}</td>
                  <td className="px-6 py-4">{b.nbSieges}</td>
                  <td className="px-6 py-4">{getCompagnieNom(b)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${b.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {b.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {b.actif && (
                      <button
                        onClick={() => handleDesactiver(b.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Désactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouveau Bus</h2>
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
      )}
    </AdminLayout>
  );
}
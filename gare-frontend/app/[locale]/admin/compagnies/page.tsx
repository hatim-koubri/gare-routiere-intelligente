'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { Compagnie } from '@/types';

export default function CompagniesPage() {
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    email: '',
    telephone: '',
    description: '',
  });

  useEffect(() => {
    loadCompagnies();
  }, []);

  const loadCompagnies = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminCompagnieApi.getAll();
      setCompagnies(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setError('Impossible de charger les compagnies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCompagnieApi.create(formData);
      setShowModal(false);
      setFormData({ nom: '', code: '', email: '', telephone: '', description: '' });
      loadCompagnies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const filteredCompagnies = useMemo(() => {
    return compagnies.filter(c =>
      c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [compagnies, searchQuery]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏢 Compagnies</h1>
          <p className="text-sm text-gray-500 mt-1">{compagnies.length} compagnie(s) enregistrée(s)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nouvelle Compagnie
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={loadCompagnies} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
            Réessayer
          </button>
        </div>
      ) : filteredCompagnies.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          Aucune compagnie trouvée
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCompagnies.map((compagnie) => (
                <tr key={compagnie.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{compagnie.nom}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                      {compagnie.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{compagnie.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{compagnie.telephone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${compagnie.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {compagnie.actif ? 'Active' : 'Inactive'}
                    </span>
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
            <h2 className="text-xl font-bold mb-4">Nouvelle Compagnie</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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
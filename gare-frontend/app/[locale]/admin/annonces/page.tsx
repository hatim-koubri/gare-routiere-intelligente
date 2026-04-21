'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';

interface Annonce {
  id: number;
  titreFr: string;
  titreAr?: string;
  contenuFr: string;
  contenuAr?: string;
  dateDebut?: string;
  dateFin?: string;
  active: boolean;
  compagnieId?: number;
}

interface Compagnie {
  id: number;
  nom: string;
}

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    titreFr: '',
    titreAr: '',
    contenuFr: '',
    contenuAr: '',
    dateDebut: '',
    dateFin: '',
    compagnieId: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annoncesData, compagniesData] = await Promise.all([
        adminPromotionApi.getAnnonces(),
        adminCompagnieApi.getAll(),
      ]);
      setAnnonces(annoncesData);
      setCompagnies(compagniesData);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnonces = annonces.filter(a =>
    a.titreFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.titreAr && a.titreAr.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminPromotionApi.createAnnonce({
        ...formData,
        compagnieId: formData.compagnieId || undefined,
      });
      setShowModal(false);
      setFormData({ titreFr: '', titreAr: '', contenuFr: '', contenuAr: '', dateDebut: '', dateFin: '', compagnieId: 0 });
      loadData();
    } catch (error) {
      console.error('Erreur création', error);
      alert('Erreur lors de la création');
    }
  };

  const handleDesactiver = async (id: number) => {
    if (confirm('Désactiver cette annonce ?')) {
      await adminPromotionApi.desactiverAnnonce(id);
      loadData();
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Annonces</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nouvelle Annonce
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher une annonce..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filteredAnnonces.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          Aucune annonce trouvée
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre (FR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre (AR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contenu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date début</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAnnonces.map((annonce) => (
                <tr key={annonce.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{annonce.titreFr}</td>
                  <td className="px-6 py-4 text-right" dir="rtl">{annonce.titreAr || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{annonce.contenuFr}</td>
                  <td className="px-6 py-4 text-sm">
                    {annonce.dateDebut ? new Date(annonce.dateDebut).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {annonce.dateFin ? new Date(annonce.dateFin).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {annonce.compagnieId ? compagnies.find(c => c.id === annonce.compagnieId)?.nom || '-' : 'Globale'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${annonce.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {annonce.active ? 'Active' : 'Désactivée'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {annonce.active && (
                      <button
                        onClick={() => handleDesactiver(annonce.id)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle Annonce</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre (Français) *</label>
                  <input
                    type="text"
                    required
                    value={formData.titreFr}
                    onChange={(e) => setFormData({ ...formData, titreFr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre (Arabe)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.titreAr}
                    onChange={(e) => setFormData({ ...formData, titreAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (Français) *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.contenuFr}
                    onChange={(e) => setFormData({ ...formData, contenuFr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (Arabe)</label>
                  <textarea
                    dir="rtl"
                    rows={3}
                    value={formData.contenuAr}
                    onChange={(e) => setFormData({ ...formData, contenuAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                  <input
                    type="datetime-local"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input
                    type="datetime-local"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie (optionnel)</label>
                <select
                  value={formData.compagnieId}
                  onChange={(e) => setFormData({ ...formData, compagnieId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Toutes les compagnies</option>
                  {compagnies.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
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
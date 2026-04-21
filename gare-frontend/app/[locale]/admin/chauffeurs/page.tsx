'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminChauffeurApi } from '@/lib/api/admin/chauffeurs';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { apiClient } from '@/lib/api/client';
import { Chauffeur, Compagnie } from '@/types';

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompagnie, setSelectedCompagnie] = useState<number>(0);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    numeroPermis: '',
    dateEmbauche: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedCompagnie]);

  const loadData = async () => {
    setLoading(true);
    try {
      const compagniesData = await adminCompagnieApi.getAll();
      setCompagnies(compagniesData);
      
      if (selectedCompagnie > 0) {
        try {
          const chauffeursData = await adminChauffeurApi.getByCompagnie(selectedCompagnie);
          setChauffeurs(Array.isArray(chauffeursData) ? chauffeursData : []);
        } catch (error) {
          console.error('Erreur chargement chauffeurs (endpoint peut ne pas exister)', error);
          setChauffeurs([]);
        }
      } else {
        setChauffeurs([]);
      }
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompagnie || selectedCompagnie === 0) {
      alert('Veuillez sélectionner une compagnie');
      return;
    }

    try {
      const response = await apiClient.post(`/admin/chauffeurs/compagnie/${selectedCompagnie}`, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        telephone: formData.telephone,
        numeroPermis: formData.numeroPermis,
        dateEmbauche: formData.dateEmbauche,
        role: 'CHAUFFEUR'
      });

      if (response.status === 200) {
        setShowModal(false);
        setFormData({ 
          nom: '', 
          prenom: '', 
          email: '', 
          password: '', 
          telephone: '', 
          numeroPermis: '', 
          dateEmbauche: '' 
        });
        loadData();
        alert('Chauffeur créé avec succès');
      }
    } catch (error: any) {
      console.error('Erreur création', error);
      alert(error.response?.data?.message || 'Erreur lors de la création du chauffeur');
    }
  };

  const handleConge = async (id: number, enConge: boolean) => {
    try {
      const action = enConge ? 'retirerConge' : 'mettreEnConge';
      await adminChauffeurApi[action](id);
      loadData();
    } catch (error) {
      console.error('Erreur modification congé', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chauffeurs</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          disabled={!selectedCompagnie}
        >
          + Nouveau Chauffeur
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Filtrer par compagnie</label>
        <select
          value={selectedCompagnie}
          onChange={(e) => setSelectedCompagnie(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-lg w-64"
        >
          <option value={0}>Sélectionner une compagnie</option>
          {compagnies.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : chauffeurs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun chauffeur trouvé pour cette compagnie
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chauffeurs.map((chauffeur) => (
                <tr key={chauffeur.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {chauffeur.prenom} {chauffeur.nom}
                  </td>
                  <td className="px-6 py-4">{chauffeur.email}</td>
                  <td className="px-6 py-4">{chauffeur.telephone || '-'}</td>
                  <td className="px-6 py-4">{chauffeur.numeroPermis || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${chauffeur.enConge ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {chauffeur.enConge ? 'En congé' : 'Disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleConge(chauffeur.id, chauffeur.enConge)}
                      className={`text-sm ${chauffeur.enConge ? 'text-green-600' : 'text-yellow-600'} hover:underline`}
                    >
                      {chauffeur.enConge ? 'Retirer congé' : 'Mettre en congé'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouveau Chauffeur</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-sm">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 mb-1 text-sm">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 mb-1 text-sm">Mot de passe *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 mb-1 text-sm">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-700 mb-1 text-sm">Numéro de permis</label>
                <input
                  type="text"
                  value={formData.numeroPermis}
                  onChange={(e) => setFormData({ ...formData, numeroPermis: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="ex: P123456"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1 text-sm">Date d'embauche</label>
                <input
                  type="date"
                  value={formData.dateEmbauche}
                  onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Compagnie: {compagnies.find(c => c.id === selectedCompagnie)?.nom || 'Non sélectionnée'}
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
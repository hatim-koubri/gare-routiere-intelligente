'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminLigneApi } from '@/lib/api/admin/lignes';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { Ligne, Compagnie, Arret } from '@/types';

export default function LignesPage() {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [formData, setFormData] = useState({
    villeDepart: '',
    villeArrivee: '',
    dureeMinutes: '',
    prixBase: 0,
    compagnieId: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lignesData, compagniesData] = await Promise.all([
        adminLigneApi.getAll(),
        adminCompagnieApi.getAll(),
      ]);
      setLignes(Array.isArray(lignesData) ? lignesData : []);
      setCompagnies(Array.isArray(compagniesData) ? compagniesData : []);
    } catch (error) {
      console.error('Erreur chargement', error);
      setLignes([]);
      setCompagnies([]);
    } finally {
      setLoading(false);
    }
  };

  const ajouterArret = () => {
    setArrets([
      ...arrets,
      { ville: '', ordre: arrets.length + 1, dureePauseMinutes: 0, heurePrevueOffsetMinutes: 0 },
    ]);
  };

  const modifierArret = (index: number, field: keyof Arret, value: any) => {
    const newArrets = [...arrets];
    newArrets[index] = { ...newArrets[index], [field]: value };
    setArrets(newArrets);
  };

  const supprimerArret = (index: number) => {
    const newArrets = arrets.filter((_, i) => i !== index);
    setArrets(newArrets.map((a, i) => ({ ...a, ordre: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminLigneApi.create({
        ...formData,
        dureeMinutes: formData.dureeMinutes ? parseInt(formData.dureeMinutes) : undefined,
        prixBase: formData.prixBase,
        compagnieId: formData.compagnieId,
        arrets: arrets.filter(a => a.ville),
      });
      setShowModal(false);
      setFormData({ villeDepart: '', villeArrivee: '', dureeMinutes: '', prixBase: 0, compagnieId: 0 });
      setArrets([]);
      loadData();
    } catch (error) {
      console.error('Erreur création', error);
      alert('Erreur lors de la création');
    }
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
        <h1 className="text-2xl font-bold">Lignes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nouvelle Ligne
        </button>
      </div>

      {lignes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucune ligne trouvée
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Départ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrêts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lignes.map((ligne) => (
                <tr key={ligne.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{ligne.villeDepart}</td>
                  <td className="px-6 py-4">{ligne.villeArrivee}</td>
                  <td className="px-6 py-4">{ligne.dureeMinutes ? `${ligne.dureeMinutes} min` : '-'}</td>
                  <td className="px-6 py-4">{ligne.prixBase} DH</td>
                  <td className="px-6 py-4">{ligne.compagnieNom || '-'}</td>
                  <td className="px-6 py-4">{ligne.arrets?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Ligne</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Ville départ *</label>
                  <input
                    type="text"
                    required
                    value={formData.villeDepart}
                    onChange={(e) => setFormData({ ...formData, villeDepart: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Ville arrivée *</label>
                  <input
                    type="text"
                    required
                    value={formData.villeArrivee}
                    onChange={(e) => setFormData({ ...formData, villeArrivee: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Durée (minutes)</label>
                  <input
                    type="number"
                    value={formData.dureeMinutes}
                    onChange={(e) => setFormData({ ...formData, dureeMinutes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Prix base (DH) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.prixBase}
                    onChange={(e) => setFormData({ ...formData, prixBase: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
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

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 font-semibold">Arrêts</label>
                  <button type="button" onClick={ajouterArret} className="text-blue-600 text-sm">
                    + Ajouter un arrêt
                  </button>
                </div>
                {arrets.map((arret, index) => (
                  <div key={index} className="border rounded-lg p-3 mb-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        placeholder="Ville"
                        value={arret.ville}
                        onChange={(e) => modifierArret(index, 'ville', e.target.value)}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Ordre"
                        value={arret.ordre}
                        onChange={(e) => modifierArret(index, 'ordre', parseInt(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Pause (min)"
                        value={arret.dureePauseMinutes ?? 0}
                        onChange={(e) => modifierArret(index, 'dureePauseMinutes', parseInt(e.target.value) || 0)}
                        className="px-2 py-1 border rounded"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => supprimerArret(index)}
                      className="text-red-600 text-sm mt-2"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg">
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setArrets([]);
                  }}
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
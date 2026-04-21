'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { CodePromo, Compagnie, TarificationConfig } from '@/types';

export default function PromotionsPage() {
  const [promos, setPromos] = useState<CodePromo[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'promos' | 'tarification'>('promos');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    pourcentageReduction: 0,
    dateExpiration: '',
    nbUtilisationsMax: '',
    compagnieId: 0,
  });
  const [tarifConfig, setTarifConfig] = useState<TarificationConfig>({
    reductionTrentejours: 20,
    reductionQuinzeJours: 10,
    supplementJourMeme: 10,
    seuilHaut: 80,
    supplementHaut: 15,
    seuilBas: 30,
    reductionBas: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promosData, compagniesData] = await Promise.all([
        adminPromotionApi.getPromos(),
        adminCompagnieApi.getAll(),
      ]);
      setPromos(Array.isArray(promosData) ? promosData : []);
      setCompagnies(Array.isArray(compagniesData) ? compagniesData : []);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminPromotionApi.createPromo({
        code: formData.code,
        pourcentageReduction: formData.pourcentageReduction,
        dateExpiration: formData.dateExpiration,
        nbUtilisationsMax: formData.nbUtilisationsMax ? parseInt(formData.nbUtilisationsMax) : undefined,
        compagnieId: formData.compagnieId || undefined,
      });
      setShowModal(false);
      setFormData({ code: '', pourcentageReduction: 0, dateExpiration: '', nbUtilisationsMax: '', compagnieId: 0 });
      loadData();
      alert('Code promo créé avec succès');
    } catch (error: any) {
      console.error('Erreur création', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDesactiver = async (id: number) => {
    if (confirm('Désactiver ce code promo ?')) {
      await adminPromotionApi.desactiverPromo(id);
      loadData();
    }
  };

  const handleConfigurerTarification = async () => {
    try {
      await adminPromotionApi.configurerTarification(tarifConfig);
      alert('Configuration sauvegardée');
    } catch (error) {
      console.error('Erreur configuration', error);
      alert('Erreur lors de la sauvegarde');
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
      <div className="space-y-6">
        {/* Onglets */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2 font-medium ${activeTab === 'promos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Codes Promo
          </button>
          <button
            onClick={() => setActiveTab('tarification')}
            className={`px-4 py-2 font-medium ${activeTab === 'tarification' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Tarification
          </button>
        </div>

        {/* Onglet Promos */}
        {activeTab === 'promos' && (
          <>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Codes Promo</h1>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Nouveau Code Promo
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réduction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promos.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono font-bold">{promo.code}</td>
                      <td className="px-6 py-4 text-green-600 font-semibold">{promo.pourcentageReduction}%</td>
                      <td className="px-6 py-4">{new Date(promo.dateExpiration).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{promo.nbUtilisationsActuel} / {promo.nbUtilisationsMax || '∞'}</td>
                      <td className="px-6 py-4">{compagnies.find(c => c.id === promo.compagnieId)?.nom || 'Toutes'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${promo.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {promo.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {promo.actif && (
                          <button
                            onClick={() => handleDesactiver(promo.id)}
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
          </>
        )}

        {/* Onglet Tarification */}
        {activeTab === 'tarification' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Configuration Tarification</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">1. Tarification par délai de réservation</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">-30 jours (%)</label>
                  <input
                    type="number"
                    value={tarifConfig.reductionTrentejours}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, reductionTrentejours: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">-15 jours (%)</label>
                  <input
                    type="number"
                    value={tarifConfig.reductionQuinzeJours}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, reductionQuinzeJours: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Jour même (%)</label>
                  <input
                    type="number"
                    value={tarifConfig.supplementJourMeme}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, supplementJourMeme: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">2. Smart Pricing (taux de remplissage)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Seuil haut (%)</label>
                  <input
                    type="number"
                    value={tarifConfig.seuilHaut}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, seuilHaut: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <label className="block text-sm text-gray-600 mt-2">Supplément (%)</label>
                  <input
                    type="number"
                    value={tarifConfig.supplementHaut}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, supplementHaut: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Seuil bas (%)</label>
                  <input
                    type="number"
                    value={tarifConfig.seuilBas}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, seuilBas: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <label className="block text-sm text-gray-600 mt-2">Réduction (%)</label>
                  <input
                    type="number"
                    value={tarifConfig.reductionBas}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, reductionBas: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleConfigurerTarification}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Sauvegarder la configuration
            </button>
          </div>
        )}
      </div>

      {/* Modal création promo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouveau Code Promo</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="PROMO20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Réduction (%) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={formData.pourcentageReduction}
                  onChange={(e) => setFormData({ ...formData, pourcentageReduction: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Date d'expiration *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dateExpiration}
                  onChange={(e) => setFormData({ ...formData, dateExpiration: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nombre max d'utilisations</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Illimité"
                  value={formData.nbUtilisationsMax}
                  onChange={(e) => setFormData({ ...formData, nbUtilisationsMax: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Compagnie (optionnel)</label>
                <select
                  value={formData.compagnieId}
                  onChange={(e) => setFormData({ ...formData, compagnieId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Toutes les compagnies</option>
                  {compagnies.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
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
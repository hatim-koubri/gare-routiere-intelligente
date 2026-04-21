'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminQuaiApi } from '@/lib/api/admin/quais';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { Quai, Compagnie } from '@/types';

export default function QuaisPage() {
  const [quais, setQuais] = useState<Quai[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [attribuerTarget, setAttribuerTarget] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ numero: 1, tarifHoraire: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quaisData, compagniesData] = await Promise.all([
        adminQuaiApi.getAll(),
        adminCompagnieApi.getAll(),
      ]);
      setQuais(quaisData);
      setCompagnies(compagniesData);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminQuaiApi.create(formData);
      setShowAddModal(false);
      setFormData({ numero: 1, tarifHoraire: 0 });
      loadData();
    } catch (error) {
      alert('Erreur lors de la création');
    }
  };

  const handleAttribuer = async (compagnieId: number) => {
    if (!attribuerTarget) return;
    try {
      await adminQuaiApi.attribuer(attribuerTarget, compagnieId);
      setAttribuerTarget(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur attribution');
    }
  };

  const handleLiberer = async (quaiId: number) => {
    if (confirm('Libérer ce quai ?')) {
      await adminQuaiApi.liberer(quaiId);
      loadData();
    }
  };

  const filteredQuais = useMemo(() => {
    return quais.filter(q =>
      q.numero.toString().includes(searchQuery) ||
      q.compagnieNom?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [quais, searchQuery]);

  const disponibles = quais.filter(q => q.disponible).length;
  const occupes = quais.length - disponibles;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🅿️ Gestion des Quais</h1>
          <div className="flex gap-4 mt-1 text-sm">
            <span className="text-green-600 font-medium">✅ {disponibles} disponibles</span>
            <span className="text-red-600 font-medium">🔴 {occupes} occupés</span>
            <span className="text-gray-500">Total: {quais.length}</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nouveau Quai
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher par numéro ou compagnie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Légende */}
      <div className="flex gap-4 mb-4 text-xs font-medium">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400" />
          <span>Occupé</span>
        </div>
      </div>

      {/* Grille parking */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <>
          {/* Entrée parking */}
          <div className="flex justify-center mb-2">
            <div className="bg-gray-800 text-white text-xs font-bold px-8 py-2 rounded-t-lg tracking-widest uppercase">
              🚌 Entrée / Sortie
            </div>
          </div>

          {/* Zone parking avec bordure */}
          <div className="border-4 border-gray-800 rounded-2xl p-6 bg-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredQuais.map((quai) => (
                <div
                  key={quai.id}
                  className={`relative rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all duration-200 shadow-sm
                    ${quai.disponible
                      ? 'bg-green-50 border-green-400 hover:shadow-md hover:scale-105'
                      : 'bg-red-50 border-red-400 hover:shadow-md hover:scale-105'
                    }`}
                >
                  {/* Numéro quai */}
                  <div className={`text-2xl font-black ${quai.disponible ? 'text-green-700' : 'text-red-700'}`}>
                    P{quai.numero}
                  </div>

                  {/* Icône bus */}
                  <div className="text-2xl">
                    {quai.disponible ? '🟢' : '🚌'}
                  </div>

                  {/* Tarif */}
                  <div className="text-xs text-gray-500 font-medium">
                    {quai.tarifHoraire} DH/h
                  </div>

                  {/* Compagnie */}
                  {!quai.disponible && quai.compagnieNom && (
                    <div className="text-[10px] font-bold text-red-600 text-center bg-red-100 px-2 py-0.5 rounded-full truncate max-w-full">
                      {quai.compagnieNom}
                    </div>
                  )}

                  {/* Statut badge */}
                  <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
                    ${quai.disponible ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {quai.disponible ? 'Libre' : 'Occupé'}
                  </div>

                  {/* Actions */}
                  <div className="w-full mt-1">
                    {quai.disponible ? (
                      <button
                        onClick={() => setAttribuerTarget(quai.id)}
                        className="w-full text-xs bg-blue-600 text-white py-1 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Attribuer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLiberer(quai.id)}
                        className="w-full text-xs bg-red-600 text-white py-1 rounded-lg hover:bg-red-700 font-medium"
                      >
                        Libérer
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Cases vides pour effet parking */}
              {filteredQuais.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400">
                  Aucun quai trouvé
                </div>
              )}
            </div>
          </div>

          {/* Sortie parking */}
          <div className="flex justify-center mt-2">
            <div className="bg-gray-800 text-white text-xs font-bold px-8 py-2 rounded-b-lg tracking-widest uppercase">
              🛣️ Route principale
            </div>
          </div>
        </>
      )}

      {/* Modal création quai */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouveau Quai</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarif horaire (DH) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min={0}
                  value={formData.tarifHoraire}
                  onChange={(e) => setFormData({ ...formData, tarifHoraire: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal attribution compagnie */}
      {attribuerTarget !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Attribuer Quai P{quais.find(q => q.id === attribuerTarget)?.numero} à une compagnie
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {compagnies.map((compagnie) => (
                <button
                  key={compagnie.id}
                  onClick={() => handleAttribuer(compagnie.id)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <div className="font-semibold">{compagnie.nom}</div>
                  <div className="text-sm text-gray-500">Code: {compagnie.code}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setAttribuerTarget(null)}
              className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
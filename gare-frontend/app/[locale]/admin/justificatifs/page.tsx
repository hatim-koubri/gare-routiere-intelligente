'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminJustificatifApi } from '@/lib/api/admin/justificatifs';
import type { VoyageurJustificatif } from '@/lib/api/admin/justificatifs';
import { FileText, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function AdminJustificatifsPage() {
  const [list, setList] = useState<VoyageurJustificatif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated'>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = filter === 'all'
        ? await adminJustificatifApi.getAll()
        : filter === 'pending'
          ? await adminJustificatifApi.getEnAttente()
          : await adminJustificatifApi.getAll().then(d => d.filter(j => j.valide));
      setList(data);
    } catch (err) {
      console.error('Erreur chargement justificatifs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprouver = async (id: number) => {
    setActionLoading(id);
    try {
      await adminJustificatifApi.approuver(id);
      loadData();
    } catch (err) {
      console.error('Erreur approbation', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejeter = async (id: number) => {
    if (!confirm('Supprimer ce justificatif ?')) return;
    setActionLoading(id);
    try {
      await adminJustificatifApi.rejeter(id);
      loadData();
    } catch (err) {
      console.error('Erreur rejet', err);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: 'pending', label: 'En attente' },
    { key: 'validated', label: 'Validés' },
    { key: 'all', label: 'Tous' },
  ] as const;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Justificatifs</h1>
            <p className="text-gray-600">Valider les justificatifs uploadés par les voyageurs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Chargement...</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              Aucun justificatif {filter === 'pending' ? 'en attente' : filter === 'validated' ? 'validé' : ''}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voyageur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fichier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{item.prenom} {item.nom}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{item.categorieTarifaire}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={item.justificatifUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <ExternalLink size={14} />
                        Voir
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {item.valide ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          <CheckCircle size={12} /> Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                          <FileText size={12} /> En attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!item.valide && (
                          <>
                            <button
                              onClick={() => handleApprouver(item.id)}
                              disabled={actionLoading === item.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:bg-gray-300 transition"
                            >
                              <CheckCircle size={14} />
                              Approuver
                            </button>
                            <button
                              onClick={() => handleRejeter(item.id)}
                              disabled={actionLoading === item.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:bg-gray-300 transition"
                            >
                              <XCircle size={14} />
                              Rejeter
                            </button>
                          </>
                        )}
                        {item.valide && (
                          <span className="text-xs text-gray-400">Déjà validé</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

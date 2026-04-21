'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminOcrApi } from '@/lib/api/admin/ocr';
import { StationnementOCR } from '@/types';

export default function OCRAdminPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stationnements, setStationnements] = useState<StationnementOCR[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStationnements();
  }, []);

  const loadStationnements = async () => {
    try {
      const data = await adminOcrApi.getStationnements();
      setStationnements(data);
    } catch (err) {
      console.error('Erreur chargement stationnements', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await adminOcrApi.uploadImage(image);
      setResult(response);
      if (response.succès) {
        loadStationnements();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du traitement');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const colors: Record<string, string> = {
      EN_COURS: 'bg-yellow-100 text-yellow-800',
      TERMINE: 'bg-green-100 text-green-800',
      CORRECTION_MANUELLE: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      CORRECTION_MANUELLE: 'Correction requise',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[statut] || 'bg-gray-100'}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard OCR</h1>
            <p className="text-gray-600">Gestion de la détection automatique des plaques</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">📷 Simulation caméra OCR</h2>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border rounded-lg p-2"
              />
              {preview && (
                <img src={preview} alt="Aperçu" className="max-w-full rounded-lg border" />
              )}
              <button
                onClick={handleUpload}
                disabled={loading || !image}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Traitement en cours...' : '🔍 Détecter la plaque'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Résultat de détection</h3>
                <p><strong>Matricule:</strong> <span className="font-mono">{result.matricule}</span></p>
                <p><strong>Statut:</strong> {result.statut}</p>
                <p><strong>Compagnie:</strong> {result.compagnie || '-'}</p>
                <p><strong>Quai attribué:</strong> {result.quaiAttribue || '-'}</p>
                <p><strong>Message:</strong> {result.message}</p>
              </div>
            )}
          </div>

          {/* Liste stationnements */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <h2 className="text-lg font-semibold p-4 border-b">🚌 Stationnements en cours</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quai</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stationnements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Aucun stationnement en cours
                      </td>
                    </tr>
                  ) : (
                    stationnements.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">{s.matricule}</td>
                        <td className="px-4 py-3">{s.compagnieNom || '-'}</td>
                        <td className="px-4 py-3">{s.quaiAttribue || '-'}</td>
                        <td className="px-4 py-3 text-sm">{new Date(s.debut).toLocaleString()}</td>
                        <td className="px-4 py-3">{getStatutBadge(s.statut)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
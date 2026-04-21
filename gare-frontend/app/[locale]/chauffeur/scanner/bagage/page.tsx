'use client';

import { useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurBagageApi } from '@/lib/api/chauffeur/bagages';
import { Role } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function ScannerBagagePage() {
  const searchParams = useSearchParams();
  const { locale } = useParams();
  const trajetId = searchParams.get('trajetId');
  const [bagageId, setBagageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(bagageId);
    if (!id || isNaN(id)) {
      setError('Veuillez entrer un ID de bagage valide');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chauffeurBagageApi.scannerBagage(id);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du scan du bagage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-md">
          <div className="mb-6">
            <Link href={`/${locale}/chauffeur/dashboard`} className="text-blue-600 hover:underline">
              ← Retour
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-4">Scanner bagage</h1>
            <p className="text-gray-600 mb-4">Trajet #{trajetId}</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">ID du bagage</label>
                <input
                  type="number"
                  value={bagageId}
                  onChange={(e) => setBagageId(e.target.value)}
                  placeholder="Scanner ou entrer l'ID"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {loading ? 'Scan en cours...' : '🔍 Scanner bagage'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-4 p-4 bg-green-100 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Bagage enregistré</h3>
                <p><strong>Voyageur:</strong> {result.nomVoyageur}</p>
                <p><strong>Email:</strong> {result.emailVoyageur}</p>
                <p><strong>Poids:</strong> {result.poidsKg} kg</p>
                <p><strong>Surplus:</strong> {result.surplusPrix} MAD</p>
                <p className="mt-2 text-sm text-gray-600">QR Code bagage: {result.qrCodeBagage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
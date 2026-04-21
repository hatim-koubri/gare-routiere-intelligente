'use client';

import { useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTicketApi } from '@/lib/api/chauffeur/tickets';
import { Role } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function ScannerTicketPage() {
  const searchParams = useSearchParams();
  const { locale } = useParams();
  const trajetId = searchParams.get('trajetId');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      setError('Veuillez entrer ou scanner un QR code');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chauffeurTicketApi.validerTicket(qrCode);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  // Simulation scanner (dans une vraie app, utiliser caméra)
  const simulateScan = () => {
    setQrCode('TICKET-' + Math.random().toString(36).substring(2, 10).toUpperCase());
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
            <h1 className="text-2xl font-bold mb-4">Scanner ticket</h1>
            <p className="text-gray-600 mb-4">Trajet #{trajetId}</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">QR Code</label>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Scanner ou entrer le code"
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={simulateScan}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  📷 Simuler scan
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Validation...' : '✅ Valider'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {result && result.valide && (
              <div className="mt-4 p-4 bg-green-100 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Embarquement validé</h3>
                <p><strong>Passager:</strong> {result.prenomPassager} {result.nomPassager}</p>
                <p><strong>Siège:</strong> {result.numeroSiege}</p>
                <p><strong>Catégorie:</strong> {result.categorie}</p>
                {result.enfantSurGenoux && <p className="text-amber-600">⚠️ Enfant sur genoux</p>}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
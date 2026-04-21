'use client';

import { useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurIncidentApi } from '@/lib/api/chauffeur/incidents';
import { Role } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function IncidentPage() {
  const searchParams = useSearchParams();
  const { locale } = useParams();
  const router = useRouter();
  const trajetId = searchParams.get('trajetId');
  const [formData, setFormData] = useState({
    type: 'RETARD',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const types = [
    { value: 'RETARD', label: '⏰ Retard', color: 'bg-yellow-100' },
    { value: 'PANNE', label: '🔧 Panne mécanique', color: 'bg-red-100' },
    { value: 'ACCIDENT', label: '💥 Accident', color: 'bg-red-100' },
    { value: 'AUTRE', label: '📝 Autre', color: 'bg-gray-100' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setError('Veuillez décrire l\'incident');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await chauffeurIncidentApi.signalerIncident({
        trajetId: Number(trajetId),
        type: formData.type,
        description: formData.description,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/chauffeur/dashboard`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du signalement');
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
            <h1 className="text-2xl font-bold mb-4">⚠️ Signaler un incident</h1>
            <p className="text-gray-600 mb-4">Trajet #{trajetId}</p>

            {success ? (
              <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center">
                ✅ Incident signalé avec succès !
                <br />
                Redirection en cours...
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Type d'incident *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {types.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t.value })}
                        className={`p-3 rounded-lg border transition ${
                          formData.type === t.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez précisément l'incident..."
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {loading ? 'Signalement en cours...' : '🚨 Signaler l\'incident'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
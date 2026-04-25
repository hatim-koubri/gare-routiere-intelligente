'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Trajet, Role } from '@/types';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HistoriquePage() {
  const { user } = useAuth();
  const { locale } = useParams();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    setLoading(true);
    try {
      const data = await chauffeurTrajetApi.getHistoriqueTrajets();
      setTrajets(data);
    } catch (error) {
      console.error('Erreur chargement historique', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      TERMINE: 'bg-green-100 text-green-800',
      ANNULE: 'bg-red-100 text-red-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      TERMINE: '✅ Terminé',
      ANNULE: '❌ Annulé',
    };
    return labels[statut] || statut;
  };

  const stats = {
    total: trajets.length,
    termine: trajets.filter(t => t.statut === 'TERMINE').length,
    annule: trajets.filter(t => t.statut === 'ANNULE').length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
        <Header />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Historique des trajets</h1>
                <p className="text-gray-600 mt-1">
                  Bonjour {user?.prenom} {user?.nom}
                </p>
              </div>
              <Link
                href={`/${locale}/chauffeur/dashboard`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                ← Retour
              </Link>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.termine}</p>
              <p className="text-sm text-gray-500">Terminés</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.annule}</p>
              <p className="text-sm text-gray-500">Annulés</p>
            </div>
          </div>

          {/* Liste des trajets */}
          {trajets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              Aucun trajet terminé ou annulé
            </div>
          ) : (
            <div className="space-y-4">
              {trajets.map((trajet) => (
                <div key={trajet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {trajet.villeDepart || '?'} → {trajet.villeArrivee || '?'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {trajet.compagnieNom || 'N/A'} • Bus {trajet.busMatricule || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatutColor(trajet.statut)}`}>
                          {getStatutLabel(trajet.statut)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Départ:</span>
                        <span className="font-medium ml-2">
                          {trajet.dateDepart ? new Date(trajet.dateDepart).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Heure:</span>
                        <span className="font-medium ml-2">
                          {trajet.dateDepart ? new Date(trajet.dateDepart).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Passagers:</span>
                        <span className="font-medium ml-2">{trajet.nbReservations || 0}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <Link
                        href={`/${locale}/chauffeur/trajets/${trajet.id}/manifeste`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        📋 Voir le manifeste
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
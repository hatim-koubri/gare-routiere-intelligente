'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/layout/Header';
import HoraireDownload from '@/components/offline/HoraireDownload';
import NotificationSync from '@/components/offline/NotificationSync';
import { Role } from '@/types';
import { apiClient } from '@/lib/api/client';

export default function DashboardPage() {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      await apiClient.get('/offline/horaires/1');
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('error');
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          {/* Statut backend */}
          <div className="mb-4 p-3 rounded-lg text-center">
            {backendStatus === 'checking' && (
              <div className="bg-gray-100 text-gray-700">Vérification connexion backend...</div>
            )}
            {backendStatus === 'connected' && (
              <div className="bg-green-100 text-green-700">✅ Backend connecté</div>
            )}
            {backendStatus === 'error' && (
              <div className="bg-red-100 text-red-700">
                ❌ Backend non accessible. Vérifie que Spring Boot tourne sur http://localhost:8080
              </div>
            )}
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-gray-600">
              Bienvenue {user?.prenom} {user?.nom} ({user?.role})
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <HoraireDownload />
            <NotificationSync />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
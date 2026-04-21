'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { chauffeurTrajetApi } from '@/lib/api/chauffeur/trajets';
import { Trajet } from '@/types';
import Link from 'next/link';

export default function ChauffeurTrajetsPage() {
  const { locale } = useParams();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrajets();
  }, []);

  const loadTrajets = async () => {
    setLoading(true);
    try {
      const data = await chauffeurTrajetApi.getTrajetsJour();
      console.log('Trajets reçus:', data);
      setTrajets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement trajets', error);
      setTrajets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      PLANIFIE: 'bg-blue-100 text-blue-800',
      EN_COURS: 'bg-green-100 text-green-800',
      TERMINE: 'bg-gray-100 text-gray-800',
      ANNULE: 'bg-red-100 text-red-800',
      RETARDE: 'bg-yellow-100 text-yellow-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      PLANIFIE: 'Planifié',
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
      RETARDE: 'Retardé',
    };
    return labels[statut] || statut;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (trajets.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Mes trajets</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun trajet prévu pour aujourd'hui
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes trajets</h1>
      
      <div className="grid gap-4">
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
                <span className={`px-2 py-1 rounded text-xs ${getStatutColor(trajet.statut)}`}>
                  {getStatutLabel(trajet.statut)}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Départ:</span>
                  <span className="font-medium ml-2">
                    {trajet.dateDepart ? new Date(trajet.dateDepart).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Quai:</span>
                  <span className="font-medium ml-2">{trajet.quaiNumero || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Passagers:</span>
                  <span className="font-medium ml-2">{trajet.nbReservations || 0}/{trajet.nbSieges || 0}</span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2 border-t flex-wrap">
                <Link
                  href={`/${locale}/chauffeur/trajets/${trajet.id}/manifeste`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  📋 Manifeste
                </Link>
                <Link
                  href={`/${locale}/chauffeur/trajets/${trajet.id}/jalons`}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                >
                  📍 Jalons
                </Link>
                <Link
                  href={`/${locale}/chauffeur/scanner/ticket?trajetId=${trajet.id}`}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  🎫 Scanner ticket
                </Link>
                <Link
                  href={`/${locale}/chauffeur/incidents?trajetId=${trajet.id}`}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  ⚠️ Incident
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
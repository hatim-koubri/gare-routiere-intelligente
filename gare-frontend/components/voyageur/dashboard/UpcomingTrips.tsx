// components/voyageur/dashboard/UpcomingTrips.tsx
'use client';

import { ReservationHistorique } from '@/lib/api/voyageur/dashboard';
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UpcomingTripsProps {
  trips: ReservationHistorique[];
  onViewDetails: (reservationId: number) => void;
}

export default function UpcomingTrips({ trips, onViewDetails }: UpcomingTripsProps) {
  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">Aucun trajet à venir</p>
        <a href="/recherche" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          Réservez votre prochain voyage →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onViewDetails(trip.id)}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {format(new Date(trip.dateDepart), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-lg">{trip.villeDepart}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-lg">{trip.villeArrivee}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {trip.compagnieNom}
                </span>
                <span className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  {trip.nombrePassagers} passager(s)
                </span>
                {trip.numerosSieges.length > 0 && (
                  <span className="text-blue-600">
                    Sièges: {trip.numerosSieges.join(', ')}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {trip.prixTotal.toLocaleString()} MAD
              </div>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Confirmé
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
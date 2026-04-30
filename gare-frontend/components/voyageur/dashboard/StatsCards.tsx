// components/voyageur/dashboard/StatsCards.tsx
'use client';

import { VoyageurStats } from '@/lib/api/voyageur/dashboard';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  TicketIcon, 
  TruckIcon 
} from '@heroicons/react/24/outline';

interface StatsCardsProps {
  stats: VoyageurStats;
}

const StatCard = ({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total voyages"
        value={stats.totalReservations}
        icon={TicketIcon}
        color="bg-blue-500"
      />
      <StatCard
        title="Trajets à venir"
        value={stats.totalTrajetsAvenir}
        icon={CalendarIcon}
        color="bg-green-500"
      />
      <StatCard
        title="Trajets effectués"
        value={stats.totalTrajetsPasses}
        icon={TruckIcon}
        color="bg-purple-500"
      />
      <StatCard
        title="Dépense totale"
        value={`${stats.totalDepense.toLocaleString()} MAD`}
        icon={CurrencyDollarIcon}
        color="bg-orange-500"
      />
    </div>
  );
}
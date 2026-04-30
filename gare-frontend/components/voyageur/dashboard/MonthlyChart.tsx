// components/voyageur/dashboard/MonthlyChart.tsx
'use client';

import { VoyageurStats } from '@/lib/api/voyageur/dashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface MonthlyChartProps {
  data: VoyageurStats['trajetsParMois'];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mois" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="count" name="Nombre de trajets" fill="#3B82F6" />
        <Bar yAxisId="right" dataKey="totalDepense" name="Dépense (MAD)" fill="#F97316" />
      </BarChart>
    </ResponsiveContainer>
  );
}
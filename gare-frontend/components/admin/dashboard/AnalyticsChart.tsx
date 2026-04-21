'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'S', value: 400 },
  { name: 'M', value: 300 },
  { name: 'T', value: 500 },
  { name: 'W', value: 800 },
  { name: 'T', value: 450 },
  { name: 'F', value: 380 },
  { name: 'S', value: 320 },
];

export function AnalyticsChart() {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fontWeight: 600, fill: '#9CA3AF' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#9CA3AF' }} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value > 600 ? '#f97316' : '#ea580c'} opacity={entry.value > 600 ? 1 : 0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

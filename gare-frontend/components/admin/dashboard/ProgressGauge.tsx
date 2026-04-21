'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Completed', value: 41 },
  { name: 'In Progress', value: 30 },
  { name: 'Pending', value: 29 },
];

const COLORS = ['#6366f1', '#4f46e5', 'rgba(255,255,255,0.05)'];

export function ProgressGauge() {
  return (
    <div className="h-[180px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <div className="text-3xl font-black text-foreground">41%</div>
        <div className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Taux Moyen</div>
      </div>
    </div>
  );
}

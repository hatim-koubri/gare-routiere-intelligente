'use client';

import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const team = [
  { id: 1, name: 'Alexandra Deff', role: 'Chauffeur - Ligne Casa-Marrak.', status: 'Terminé', type: 'success' },
  { id: 2, name: 'Edwin Adenike', role: 'Staff - Maintenance Quai 1', status: 'En cours', type: 'warning' },
  { id: 3, name: 'Isaac Oluwatemilorun', role: 'Sécurité - Hall Principal', status: 'En attente', type: 'info' },
  { id: 4, name: 'David Oshodi', role: 'Chauffeur - Ligne Rabat-Fès', status: 'En cours', type: 'warning' },
];

export function TeamCollaboration() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-border/50 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black tracking-tight text-foreground">Personnel en Service</h3>
        <button className="flex items-center gap-2 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold px-4 py-2 rounded-xl transition-all">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
        {team.map((member) => (
          <div key={member.id} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-border flex items-center justify-center text-xs font-black text-muted-foreground transition-all group-hover:scale-110">
                {member.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-foreground group-hover:text-orange-500 transition-colors">{member.name}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{member.role}</span>
              </div>
            </div>
            
            <div className={`
              text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border
              ${member.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                member.type === 'warning' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                'bg-blue-500/10 text-blue-500 border-blue-500/20'}
            `}>
              {member.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

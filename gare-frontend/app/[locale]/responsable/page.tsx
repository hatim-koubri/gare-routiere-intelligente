'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { responsableStatsApi } from '@/lib/api/responsable/stats';
import { responsableExportApi } from '@/lib/api/responsable/exports';
import { CompagnieStats } from '@/types';
import {
  Route, Ticket, Euro, TrendingUp, Bus, Tag,
  Building2, Loader2, FileText, FileSpreadsheet
} from 'lucide-react';

const kpis: {
  key: keyof CompagnieStats;
  label: string;
  icon: any;
  format: (v: any) => string;
  color: string;
  bg: string;
}[] = [
  { key: 'totalTrajets', label: 'Total Trajets', icon: Route, format: v => `${v}`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'totalReservations', label: 'Total Réservations', icon: Ticket, format: v => `${v}`, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'totalVentes', label: 'Total Ventes (CA)', icon: Euro, format: v => `${v.toFixed(2)} DH`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'tauxRemplissageMoyen', label: 'Taux Remplissage Moyen', icon: TrendingUp, format: v => `${v.toFixed(1)}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'totalBusActifs', label: 'Bus Actifs', icon: Bus, format: v => `${v}`, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'totalCodesPromoActifs', label: 'Codes Promo Actifs', icon: Tag, format: v => `${v}`, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function ResponsableDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CompagnieStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [periode, setPeriode] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, [periode]);

  const loadStats = async () => {
    setLoading(true);
    const data = await responsableStatsApi.getStats(periode || undefined);
    if (data) setStats(data);
    setLoading(false);
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    setExporting(type);
    try {
      if (type === 'pdf') await responsableExportApi.exportPdf();
      else await responsableExportApi.exportExcel();
    } catch (err) {
      alert('Erreur lors de l\'export');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            <Building2 size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bonjour, {user?.prenom} {user?.nom}
            </h1>
            <p className="text-slate-500 mt-1">
              Bienvenue dans votre espace Responsable de Compagnie.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="">Tout</option>
            <option value="jour">Aujourd'hui</option>
            <option value="mois">Ce mois</option>
            <option value="an">Cette année</option>
          </select>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <FileText size={15} className="text-red-500" />
            {exporting === 'pdf' ? 'Export...' : 'PDF'}
          </button>

          <button
            onClick={() => handleExport('excel')}
            disabled={exporting !== null}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            {exporting === 'excel' ? 'Export...' : 'Excel'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-indigo-600 animate-spin" />
        </div>
      ) : !stats ? (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm">
          Impossible de charger les statistiques.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            const value = stats[kpi.key];
            return (
              <div key={kpi.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className={kpi.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{kpi.format(value)}</p>
                <p className="text-sm text-slate-500 mt-0.5">{kpi.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

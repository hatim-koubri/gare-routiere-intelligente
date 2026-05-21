'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminDashboardApi } from '@/lib/api/admin/dashboard';
import { adminOcrApi } from '@/lib/api/admin/ocr';
import { QuaiStationnementSummaryDTO, QuaiStationnementDetailDTO, StationnementLigneDTO } from '@/types';
import {
  FileText, Building2, Clock, DollarSign, Search,
  RefreshCw, TrendingUp, Calendar, Download
} from 'lucide-react';
import { downloadBlob } from '@/lib/utils/download';

function formatDur(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export default function FacturationQuaisPage() {
  const [data, setData] = useState<QuaiStationnementSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuai, setSelectedQuai] = useState<QuaiStationnementDetailDTO | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const resp = await adminDashboardApi.getStationnementQuais();
        if (!cancelled) setData(resp);
      } catch (error) {
        if (!cancelled) console.error('Erreur chargement facturation', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.quais.filter(q =>
      q.quaiNumero.toString().includes(searchQuery) ||
      q.compagnieNom.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const totalGeneral = data?.totalGeneral ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6 pb-16">

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-8"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Facturation Quais</h1>
              </div>
              <p className="text-white/50 text-xs font-medium">Récapitulatif des stationnements par quai</p>
            </div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-5 flex items-center gap-6 flex-wrap">
            {[
              { icon: Building2, label: 'Quais', value: data?.quais.length ?? 0, color: 'text-emerald-300' },
              { icon: TrendingUp, label: 'Total facturé', value: `${totalGeneral.toFixed(2)} DH`, color: 'text-yellow-300' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                  <s.icon size={13} className={s.color} />
                </div>
                <span className="text-white font-black text-base">{s.value}</span>
                <span className="text-white/30 text-[9px] font-bold uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ═══ BARRE DE RECHERCHE ═══ */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher quai ou compagnie..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>

        {/* ═══ CONTENU ═══ */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin mr-3" />
            Chargement...
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(quai => {
              const totalStationnements = quai.stationnements.length;
              const termines = quai.stationnements.filter(s => s.statut !== 'EN_COURS').length;
              const enCours = totalStationnements - termines;

              return (
                <motion.div
                  key={quai.quaiId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedQuai(selectedQuai?.quaiId === quai.quaiId ? null : quai)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedQuai?.quaiId === quai.quaiId ? 'border-emerald-400 shadow-lg ring-2 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm">
                        {quai.quaiNumero}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">Quai {quai.quaiNumero}</h3>
                        <p className="text-xs text-gray-400 font-medium">{quai.compagnieNom !== '-' ? quai.compagnieNom : '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{quai.tarifHoraire} DH/h</p>
                        <p className="text-sm font-bold text-gray-800">{quai.totalQuai.toFixed(2)} DH</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{totalStationnements} stationnement{totalStationnements > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {selectedQuai?.quaiId === quai.quaiId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      {enCours > 0 && (
                        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {enCours} en cours
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {quai.stationnements.map(st => (
                          <FactureRow key={st.stationnementId} st={st} />))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <FileText size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucune facturation trouvée</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ RÉCAPITULATIF ═══ */}
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-200" />
                <span className="text-sm font-bold uppercase tracking-wider opacity-70">Total général facturé</span>
              </div>
              <span className="text-2xl font-black">{totalGeneral.toFixed(2)} DH</span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs opacity-60">
              <span className="flex items-center gap-1">
                <Building2 size={12} /> {data.quais.length} quais
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
          </motion.div>
        )}

      </div>
    </AdminLayout>
  );
}

function FactureRow({ st }: { st: StationnementLigneDTO }) {
  const [downloading, setDownloading] = useState(false);

  const handleFacture = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await adminOcrApi.telechargerFacture(st.stationnementId);
      downloadBlob(blob, `facture-stationnement-${st.stationnementId}.pdf`);
    } catch (e) {
      console.error('Erreur téléchargement facture', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold text-gray-700">{st.matricule}</span>
        <span className="text-xs text-gray-400">{st.compagnieNom}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">{formatDur(st.dureeMinutes)}</span>
        <span className="font-bold text-gray-800">{st.coutCalcule.toFixed(2)} DH</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
          st.statut === 'EN_COURS'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-200 text-gray-600'
        }`}>
          {st.statut === 'EN_COURS' ? 'En cours' : 'Terminé'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleFacture(); }}
          disabled={downloading}
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all disabled:opacity-50"
        >
          <Download size={11} />
          {downloading ? '...' : 'Facture'}
        </button>
      </div>
    </div>
  );
}

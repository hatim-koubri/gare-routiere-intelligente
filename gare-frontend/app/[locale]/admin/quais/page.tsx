'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminQuaiApi } from '@/lib/api/admin/quais';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { adminDashboardApi } from '@/lib/api/admin/dashboard';
import { Quai, Compagnie, QuaiStationnementDetailDTO, StationnementLigneDTO } from '@/types';
import {
  Plus, Search, CheckCircle2, AlertCircle,
  Building2, SquareStack, RefreshCw, Clock, DollarSign, FileText
} from 'lucide-react';
import { adminOcrApi } from '@/lib/api/admin/ocr';
import { downloadBlob } from '@/lib/utils/download';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function useElapsed(startStr: string | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startStr) { setElapsed(0); return; }
    const start = new Date(startStr).getTime();
    if (isNaN(start)) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 60000));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [startStr]);
  return elapsed;
}

export default function QuaisPage() {
  const [quais, setQuais] = useState<Quai[]>([]);
  const [stationData, setStationData] = useState<QuaiStationnementDetailDTO[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [attribuerTarget, setAttribuerTarget] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ numero: 1, tarifHoraire: 0 });
  const [selectedQuaiId, setSelectedQuaiId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<QuaiStationnementDetailDTO | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quaisData, compagniesData, stationDataResp] = await Promise.all([
        adminQuaiApi.getAll(),
        adminCompagnieApi.getAll(),
        adminDashboardApi.getStationnementQuais(),
      ]);
      setQuais(quaisData);
      setCompagnies(compagniesData);
      setStationData(stationDataResp?.quais ?? []);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminQuaiApi.create(formData);
      setShowAddModal(false);
      setFormData({ numero: 1, tarifHoraire: 0 });
      loadData();
    } catch {
      alert('Erreur lors de la création');
    }
  };

  const handleAttribuer = async (compagnieId: number) => {
    if (!attribuerTarget) return;
    try {
      await adminQuaiApi.attribuer(attribuerTarget, compagnieId);
      setAttribuerTarget(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur attribution');
    }
  };

  const handleLiberer = async (quaiId: number) => {
    if (confirm('Libérer ce quai ?')) {
      await adminQuaiApi.liberer(quaiId);
      loadData();
    }
  };

  const filteredQuais = useMemo(() =>
    quais.filter(q =>
      q.numero.toString().includes(searchQuery) ||
      (q.compagnieNom?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
    ), [quais, searchQuery]);

  const disponibles = quais.filter(q => q.disponible).length;
  const occupes = quais.length - disponibles;

  const getStationForQuai = (quaiId: number): StationnementLigneDTO | undefined => {
    const quaiStation = stationData.find(s => s.quaiId === quaiId);
    if (!quaiStation) return undefined;
    const enCours = quaiStation.stationnements.find(s => s.statut === 'EN_COURS');
    if (enCours) return enCours;
    return quaiStation.stationnements[0];
  };

  const handleQuaiClick = (quai: Quai) => {
    const detail = stationData.find(s => s.quaiId === quai.id) ?? null;
    setSelectedDetail(detail);
    setSelectedQuaiId(quai.id);
  };

  function QuaiCard({ quai }: { quai: Quai }) {
    const stat = getStationForQuai(quai.id);
    const liveDur = useElapsed(stat?.debut ?? null);
    const displayDur = stat?.statut === 'EN_COURS' ? liveDur : (stat?.dureeMinutes ?? 0);
    const liveCost = stat?.statut === 'EN_COURS'
      ? Math.round((liveDur / 60) * quai.tarifHoraire * 100) / 100
      : (stat?.coutCalcule ?? 0);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => handleQuaiClick(quai)}
        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
          selectedQuaiId === quai.id
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
            : quai.disponible
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-red-200 bg-red-50/50'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-black tracking-tight text-gray-800">Q{quai.numero}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            quai.disponible
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {quai.disponible ? 'Libre' : 'Occupé'}
          </span>
        </div>

        <div className="text-sm text-gray-500 font-medium mb-2">
          {quai.tarifHoraire} DH/h
        </div>

        {!quai.disponible && quai.compagnieNom && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2 bg-white/60 rounded-lg px-2 py-1">
            <Building2 size={12} />
            {quai.compagnieNom}
          </div>
        )}

        {!quai.disponible && stat && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
              <Clock size={12} />
              <span className="font-medium">{formatDuration(displayDur)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mt-1">
              <DollarSign size={12} />
              <span>{liveCost.toFixed(2)} DH</span>
            </div>
            {stat.statut === 'EN_COURS' && (
              <div className="mt-2 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-600 font-semibold">EN COURS</span>
              </div>
            )}
          </>
        )}

        {quai.disponible && (
          <div className="mt-4 pt-3 border-t border-emerald-100 flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setAttribuerTarget(quai.id); }}
              className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
            >
              Attribuer
            </button>
          </div>
        )}

        <div className="absolute -top-1 -right-1 flex gap-0.5">
          <div className={`w-3 h-3 rounded-full ${quai.disponible ? 'bg-emerald-400' : 'bg-red-400'} ring-2 ring-white`} />
        </div>
      </motion.div>
    );
  }

  const selectedQuaiDetail = selectedQuaiId ? quais.find(q => q.id === selectedQuaiId) : null;

  return (
    <AdminLayout>
      <div className="space-y-6 pb-16">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <SquareStack size={20} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Quais</h1>
              </div>
              <p className="text-white/50 text-xs font-medium">Visualisation et attribution des quais d'embarquement</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-white/20 transition-all"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-5 flex items-center gap-6 flex-wrap">
            {[
              { icon: SquareStack, label: 'Total', value: quais.length, color: 'text-blue-300' },
              { icon: CheckCircle2, label: 'Libres', value: disponibles, color: 'text-emerald-300' },
              { icon: AlertCircle, label: 'Occupés', value: occupes, color: 'text-red-300' },
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

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher quai..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <button onClick={loadData} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-3" />
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredQuais.map(quai => (
                <QuaiCard key={quai.id} quai={quai} />
              ))}
            </AnimatePresence>
            {filteredQuais.length === 0 && (
              <div className="col-span-full flex flex-col items-center py-16 text-gray-400">
                <SquareStack size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucun quai trouvé</p>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {selectedDetail && selectedQuaiDetail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => { setSelectedDetail(null); setSelectedQuaiId(null); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              >
                <div className={`px-6 py-4 border-b flex items-center justify-between ${
                  selectedQuaiDetail.disponible ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div>
                    <h2 className="text-lg font-black text-gray-800">Quai {selectedQuaiDetail.numero}</h2>
                    <p className="text-xs text-gray-500 font-medium">{selectedQuaiDetail.tarifHoraire} DH/h</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedQuaiDetail.disponible
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedQuaiDetail.disponible ? 'Disponible' : 'Occupé'}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {selectedQuaiDetail.compagnieNom && selectedQuaiDetail.compagnieNom !== '-' && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Building2 size={16} />
                      {selectedQuaiDetail.compagnieNom}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Stationnements</h3>
                    {selectedDetail.stationnements.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Aucun stationnement enregistré</p>
                    ) : (
                      selectedDetail.stationnements.map(st => (
                        <StationnementRow key={st.stationnementId} st={st} tarifHoraire={selectedQuaiDetail.tarifHoraire} />
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-gray-800">
                    <span>Total Quai</span>
                    <span>{selectedDetail.totalQuai.toFixed(2)} DH</span>
                  </div>
                </div>

                <div className="px-6 py-3 border-t border-gray-100 flex gap-2 justify-end">
                  <button
                    onClick={() => { setSelectedDetail(null); setSelectedQuaiId(null); }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    Fermer
                  </button>
                  {!selectedQuaiDetail.disponible && (
                    <button
                      onClick={() => { handleLiberer(selectedQuaiDetail.id); setSelectedDetail(null); setSelectedQuaiId(null); }}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                      Libérer
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {attribuerTarget !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setAttribuerTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              >
                <h3 className="text-base font-black text-gray-800 mb-1">Attribuer le quai</h3>
                <p className="text-xs text-gray-400 mb-4">Sélectionner une compagnie</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {compagnies.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleAttribuer(c.id)}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    >
                      {c.nom}
                    </button>
                  ))}
                  {compagnies.length === 0 && <p className="text-xs text-gray-400 italic">Aucune compagnie</p>}
                </div>
                <button
                  onClick={() => setAttribuerTarget(null)}
                  className="mt-4 w-full py-2 text-xs font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.form
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onSubmit={handleCreate}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
              >
                <h3 className="text-base font-black text-gray-800">Nouveau Quai</h3>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Numéro</label>
                  <input type="number" required min={1} value={formData.numero}
                    onChange={e => setFormData(f => ({ ...f, numero: parseInt(e.target.value) || 1 }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tarif horaire (DH)</label>
                  <input type="number" required min={0} step={0.5} value={formData.tarifHoraire}
                    onChange={e => setFormData(f => ({ ...f, tarifHoraire: parseFloat(e.target.value) || 0 }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                    Annuler
                  </button>
                  <button type="submit"
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all">
                    Créer
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}

function StationnementRow({ st, tarifHoraire }: { st: StationnementLigneDTO; tarifHoraire: number }) {
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
  const liveDur = st.statut === 'EN_COURS' ? useElapsed(st.debut) : 0;
  const dispDur = st.statut === 'EN_COURS' ? liveDur : st.dureeMinutes;
  const cost = st.statut === 'EN_COURS'
    ? Math.round((liveDur / 60) * tarifHoraire * 100) / 100
    : st.coutCalcule;

  return (
    <div className={`p-3 rounded-xl border ${
      st.statut === 'EN_COURS' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-gray-700">{st.matricule}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold ${
          st.statut === 'EN_COURS' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
        }">{st.statut === 'EN_COURS' ? 'EN COURS' : 'TERMINÉ'}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(dispDur)}</span>
        <span className="font-bold text-gray-700">{cost.toFixed(2)} DH</span>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        {st.statut === 'EN_COURS' && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-600 font-semibold">En direct</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleFacture(); }}
          disabled={downloading}
          className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all disabled:opacity-50"
        >
          <FileText size={11} />
          {downloading ? '...' : 'Facture'}
        </button>
      </div>
    </div>
  );
}

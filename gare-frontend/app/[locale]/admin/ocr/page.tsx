'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminOcrApi } from '@/lib/api/admin/ocr';
import { StationnementOCR, OCRCorrectionRequest } from '@/types';
import { ManualOCRCorrectionModal } from '@/components/admin/ocr/ManualOCRCorrectionModal';
import { Edit2, UploadCloud, Bus, CheckCircle2, History, Camera, Search, AlertCircle, X, Clock } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 } as const,
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 } as const,
  } as const,
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 } as const,
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, damping: 22, stiffness: 180 } as const,
  } as const,
};

export default function OCRAdminPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stationnements, setStationnements] = useState<StationnementOCR[]>([]);
  const [error, setError] = useState('');
  const [selectedStationnement, setSelectedStationnement] = useState<StationnementOCR | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStationnements();
  }, []);

  const loadStationnements = async () => {
    try {
      const data = await adminOcrApi.getStationnements();
      setStationnements(data);
    } catch (err) {
      console.error('Erreur chargement stationnements', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await adminOcrApi.uploadImage(image);
      setResult(response);
      if (response.succès) {
        loadStationnements();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du traitement');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionSubmit = async (data: OCRCorrectionRequest) => {
    if (!selectedStationnement) return;
    try {
      await adminOcrApi.corrigerOCR(selectedStationnement.id, data);
      loadStationnements();
      setIsModalOpen(false);
      setResult(null);
    } catch (err: any) {
      console.error('Erreur lors de la correction', err);
      setError(err.response?.data?.message || 'Erreur lors de la correction');
    }
  };

  const openCorrection = (s: StationnementOCR) => {
    setSelectedStationnement(s);
    setIsModalOpen(true);
  };

  const openCorrectionForResult = () => {
    if (!result) return;
    const dummy: StationnementOCR = {
      id: result.stationnementId,
      matricule: result.matricule,
      quaiAttribue: result.quaiAttribue,
      debut: new Date().toISOString(),
      statut: 'CORRECTION_MANUELLE',
      correctionManuelle: true
    };
    setSelectedStationnement(dummy);
    setIsModalOpen(true);
  };

  const getStatutBadge = (statut: string) => {
    const colors: Record<string, string> = {
      EN_COURS: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30',
      TERMINE: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/30',
      CORRECTION_MANUELLE: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30',
    };
    const labels: Record<string, string> = {
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      CORRECTION_MANUELLE: 'Correction requise',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${colors[statut] || 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          statut === 'EN_COURS' ? 'bg-yellow-500' :
          statut === 'TERMINE' ? 'bg-green-500' :
          statut === 'CORRECTION_MANUELLE' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
        {labels[statut] || statut}
      </span>
    );
  };

  const filteredStationnements = stationnements.filter(s =>
    s.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.compagnieNom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.quaiAttribue || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: stationnements.length,
    enCours: stationnements.filter(s => s.statut === 'EN_COURS').length,
    termine: stationnements.filter(s => s.statut === 'TERMINE').length,
    correction: stationnements.filter(s => s.statut === 'CORRECTION_MANUELLE').length,
  }), [stationnements]);

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">

        {/* ═══ HERO HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160 }}
          className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-orange-700 via-orange-600 to-red-600 p-10 md:p-14"
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
              style={{ top: `${10 + Math.random() * 80}%`, left: `${10 + Math.random() * 80}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            />
          ))}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-orange-400/20 rounded-full blur-[100px]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: 'spring', damping: 18 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                    Dashboard OCR
                  </h1>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                    Détection Automatique des Plaques
                  </p>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm mt-4 max-w-lg leading-relaxed"
              >
                Intelligence artificielle pour la reconnaissance et la gestion des stationnements.
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-8 flex-wrap"
          >
            {[
              { icon: Bus, label: 'Total', value: stats.total },
              { icon: Clock, label: 'En cours', value: stats.enCours },
              { icon: CheckCircle2, label: 'Terminé', value: stats.termine },
              { icon: AlertCircle, label: 'Correction', value: stats.correction },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <s.icon size={14} className="text-orange-200" />
                </div>
                <div>
                  <span className="text-white font-black text-lg">{s.value}</span>
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider ml-2">{s.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ═══ STATS KPI ═══ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-4"
        >
          {[
            { label: 'Total stationnements', value: stats.total, icon: Bus, color: 'orange' },
            { label: 'En cours', value: stats.enCours, icon: Clock, color: 'yellow' },
            { label: 'Terminé', value: stats.termine, icon: CheckCircle2, color: 'green' },
            { label: 'Correction requise', value: stats.correction, icon: AlertCircle, color: 'red' },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon size={15} className={
                  s.color === 'orange' ? 'text-orange-500' :
                  s.color === 'yellow' ? 'text-yellow-500' :
                  s.color === 'green' ? 'text-green-500' : 'text-red-500'
                } />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{s.label}</span>
              </div>
              <motion.span
                key={s.value}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="text-3xl font-bold text-slate-800 dark:text-zinc-100"
              >
                {s.value}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-zinc-800/60 rounded-[2.5rem] border border-slate-100 dark:border-zinc-700/50 shadow-sm p-8 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10">
              <UploadCloud size={120} />
            </div>

            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-orange-500 rounded-full" />
              SIMULATION CAMÉRA
            </h2>

            <div className="space-y-6">
              <div className="group relative">
                <div className="absolute inset-0 bg-orange-500/5 rounded-3xl border-2 border-dashed border-orange-500/20 group-hover:bg-orange-500/10 group-hover:border-orange-500/40 transition-all cursor-pointer" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="relative w-full opacity-0 h-40 cursor-pointer z-10"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <UploadCloud className="text-orange-500 mb-3" size={40} />
                  <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    {image ? image.name : "Cliquez ou glissez une photo de plaque"}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-2 font-black">JPG, PNG jusqu'à 10MB</p>
                </div>
              </div>

              {preview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-3xl overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl"
                >
                  <img src={preview} alt="Aperçu" className="w-full h-auto" />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Aperçu en direct
                  </div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleUpload}
                disabled={loading || !image}
                className="w-full bg-zinc-900 dark:bg-orange-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-orange-950/20 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Détecter la plaque
                  </>
                )}
              </motion.button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl text-sm text-rose-700 dark:text-rose-400 font-medium"
              >
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-700/50 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-500/10 p-2 rounded-xl text-orange-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200">Résultat de détection</h3>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Matricule</p>
                    <p className="font-mono text-lg font-black text-orange-600">{result.matricule}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Statut</p>
                    <div className="flex items-center">
                      {getStatutBadge(result.statut)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Compagnie</p>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">{result.compagnie || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quai Attribué</p>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">{result.quaiAttribue || '—'}</p>
                  </div>
                  <div className="col-span-2 space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-700/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Message</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{result.message}</p>
                  </div>
                </div>

                {(result.statut === 'INCONNU' || result.statut === 'ILLISIBLE' || result.statut === 'CORRECTION_MANUELLE') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openCorrectionForResult}
                    className="mt-8 w-full bg-orange-500 text-white px-4 py-4 rounded-2xl hover:bg-orange-600 flex items-center justify-center gap-2 font-black shadow-lg shadow-orange-500/20 transition-all uppercase text-[10px] tracking-widest"
                  >
                    <Edit2 size={16} />
                    Corriger manuellement
                  </motion.button>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Liste stationnements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-800/60 rounded-[2.5rem] border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 dark:border-zinc-700/50 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black flex items-center gap-3">
                  <div className="w-2 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  STATIONNEMENTS
                </h2>
                <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2">
                  <History size={16} className="text-zinc-500" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Temps réel</span>
                </div>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Rechercher par matricule, compagnie, quai…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80">
                  <tr>
                    {['Matricule', 'Compagnie', 'Quai', 'Début', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-4 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/30">
                  {filteredStationnements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                        Aucun stationnement trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredStationnements.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, type: 'spring', damping: 25, stiffness: 200 }}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30 transition-colors"
                      >
                        <td className="px-4 py-4 font-mono font-bold text-sm text-zinc-800 dark:text-zinc-100">{s.matricule}</td>
                        <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">{s.compagnieNom || '-'}</td>
                        <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">{s.quaiAttribue || '-'}</td>
                        <td className="px-4 py-4 text-sm text-zinc-500 dark:text-zinc-400">{new Date(s.debut).toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-4">{getStatutBadge(s.statut)}</td>
                        <td className="px-4 py-4 text-right">
                          {s.statut === 'CORRECTION_MANUELLE' && (
                            <button
                              onClick={() => openCorrection(s)}
                              className="text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 p-2 rounded-xl transition-all"
                              title="Corriger manuellement"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      <ManualOCRCorrectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stationnement={selectedStationnement}
        onSubmit={handleCorrectionSubmit}
      />
    </AdminLayout>
  );
}

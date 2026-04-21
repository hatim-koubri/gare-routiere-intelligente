'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminTrajetApi } from '@/lib/api/admin/trajets';
import { adminBusApi } from '@/lib/api/admin/bus';
import { adminLigneApi } from '@/lib/api/admin/lignes';
import { adminQuaiApi } from '@/lib/api/admin/quais';
import { adminChauffeurApi } from '@/lib/api/admin/chauffeurs';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { Trajet, Bus, Ligne, Quai, Chauffeur, Compagnie } from '@/types';
import { motion } from 'framer-motion';
import { MapPin, Plus, Bus as BusIcon, AlertCircle } from 'lucide-react';

export default function TrajetsPage() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [bus, setBus] = useState<Bus[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [quais, setQuais] = useState<Quai[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompagnie, setSelectedCompagnie] = useState<number>(0);
  const [formData, setFormData] = useState({
    ligneId: 0,
    busId: 0,
    chauffeurId: 0,
    quaiId: 0,
    dateDepart: '',
    dateArriveePrevue: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trajetsData, compagniesData] = await Promise.all([
        adminTrajetApi.getAll(),
        adminCompagnieApi.getAll(),
      ]);
      setTrajets(trajetsData);
      setCompagnies(compagniesData);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompagnieData = async (compagnieId: number) => {
    try {
      const [busData, lignesData, quaisData, chauffeursData] = await Promise.all([
        adminBusApi.getByCompagnie(compagnieId),
        adminLigneApi.getByCompagnie(compagnieId),
        adminQuaiApi.getAll().then(q => q.filter(qq => qq.compagnieId === compagnieId)),
        adminChauffeurApi.getByCompagnie(compagnieId),
      ]);
      setBus(busData);
      setLignes(lignesData);
      setQuais(quaisData);
      setChauffeurs(chauffeursData);
    } catch (error) {
      console.error('Erreur chargement données compagnie', error);
    }
  };

  const handleCompagnieChange = (compagnieId: number) => {
    setSelectedCompagnie(compagnieId);
    if (compagnieId > 0) {
      loadCompagnieData(compagnieId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminTrajetApi.create(formData);
      setShowModal(false);
      setFormData({ ligneId: 0, busId: 0, chauffeurId: 0, quaiId: 0, dateDepart: '', dateArriveePrevue: '' });
      loadData();
    } catch (error) {
      console.error('Erreur création', error);
      alert('Erreur lors de la création du trajet');
    }
  };

  const handleAnnuler = async (id: number) => {
    if (confirm('Annuler ce trajet ?')) {
      await adminTrajetApi.annuler(id);
      loadData();
    }
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      PLANIFIE: 'bg-blue-100 text-blue-800',
      EN_COURS: 'bg-green-100 text-green-800',
      TERMINE: 'bg-gray-100 text-gray-800',
      ANNULE: 'bg-red-100 text-red-800',
      RETARDE: 'bg-yellow-100 text-yellow-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="space-y-10 pb-20">
        
        {/* Module Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 glass-premium p-10 rounded-[3rem] border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
           
           <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-indigo-500 text-white rounded-2.5xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                    <MapPin size={28} strokeWidth={2.5} />
                 </div>
                 <h1 className="text-4xl font-black tracking-tighter text-foreground italic">Transit Registry</h1>
              </div>
              <p className="text-muted-foreground text-sm font-medium opacity-60 ml-1">Live coordination and dispatching for the transport network.</p>
           </div>

           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setShowModal(true)}
             className="flex items-center gap-2 bg-indigo-500 text-white px-8 py-4 rounded-2.5xl font-black text-xs shadow-2xl shadow-indigo-500/20 group/btn relative z-10"
           >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              CREATE DISPATCH
           </motion.button>
        </div>

        {loading ? (
          <div className="text-center py-20">
             <div className="w-12 h-12 border-t-[3px] border-indigo-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
             <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">Synching Telemetry...</p>
          </div>
        ) : (
          <div className="glass-premium rounded-[3rem] border-white/5 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none" />
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="bg-indigo-500/5 text-indigo-400">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Transit Vector</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Deployment Time</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Asset Signal</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Operator</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Terminal Slot</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Net Status</th>
                    <th className="px-8 py-6 text-right opacity-60"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trajets.map((trajet, idx) => (
                    <motion.tr 
                        initial={{ opacity: 0, scale: 0.98, x: -5 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        key={trajet.id} 
                        className="group hover:bg-white/[0.03] transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover:scale-150 transition-transform" />
                           <span className="font-black text-foreground uppercase tracking-tighter italic text-sm group-hover:text-indigo-400 transition-colors">
                            {trajet.ligneNom || `Ligne #${trajet.ligneId}`}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-xs font-black text-foreground">{new Date(trajet.dateDepart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           <span className="text-[10px] text-muted-foreground font-bold opacity-40 uppercase tracking-widest">{new Date(trajet.dateDepart).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <BusIcon size={12} className="text-indigo-400 opacity-60" />
                            <span className="text-[11px] font-black text-foreground tracking-tighter uppercase">{trajet.busMatricule || 'NO_TAG'}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase">
                              {trajet.chauffeurNom?.substring(0,1) || '?'}
                           </div>
                           <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{trajet.chauffeurNom || 'Inconnu'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-[11px] font-black text-indigo-400 italic bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10">
                            {trajet.quaiNumero ? `ZONE_${trajet.quaiNumero}` : 'PENDING'}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${
                                trajet.statut === 'EN_COURS' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                trajet.statut === 'ANNULE' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                trajet.statut === 'RETARDE' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                'bg-indigo-400 opacity-40'
                           }`} />
                           <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                                trajet.statut === 'EN_COURS' ? 'text-emerald-400' :
                                trajet.statut === 'ANNULE' ? 'text-red-400' :
                                trajet.statut === 'RETARDE' ? 'text-amber-400' :
                                'text-muted-foreground opacity-60'
                           }`}>
                            {trajet.statut}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {trajet.statut === 'PLANIFIE' && (
                          <button
                            onClick={() => handleAnnuler(trajet.id)}
                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all transform hover:scale-110 shadow-lg shadow-red-500/10 border border-red-500/20"
                          >
                            <AlertCircle size={16} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Nouveau Trajet</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Compagnie *</label>
                <select
                  required
                  value={selectedCompagnie}
                  onChange={(e) => handleCompagnieChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Sélectionner une compagnie</option>
                  {compagnies.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              {selectedCompagnie > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Ligne *</label>
                      <select
                        required
                        value={formData.ligneId}
                        onChange={(e) => setFormData({ ...formData, ligneId: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value={0}>Sélectionner</option>
                        {lignes.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.villeDepart} → {l.villeArrivee}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Bus *</label>
                      <select
                        required
                        value={formData.busId}
                        onChange={(e) => setFormData({ ...formData, busId: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value={0}>Sélectionner</option>
                        {bus.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.matricule} - {b.marque} ({b.nbSieges} places)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Chauffeur</label>
                      <select
                        value={formData.chauffeurId}
                        onChange={(e) => setFormData({ ...formData, chauffeurId: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value={0}>Non assigné</option>
                        {chauffeurs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.prenom} {c.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Quai</label>
                      <select
                        value={formData.quaiId}
                        onChange={(e) => setFormData({ ...formData, quaiId: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value={0}>Non assigné</option>
                        {quais.map((q) => (
                          <option key={q.id} value={q.id}>
                            Quai {q.numero}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-2">Date/Heure départ *</label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.dateDepart}
                        onChange={(e) => setFormData({ ...formData, dateDepart: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Date/Heure arrivée prévue</label>
                      <input
                        type="datetime-local"
                        value={formData.dateArriveePrevue}
                        onChange={(e) => setFormData({ ...formData, dateArriveePrevue: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg">
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCompagnie(0);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
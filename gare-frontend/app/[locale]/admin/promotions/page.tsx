'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { CodePromo, Compagnie, TarificationConfig } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts';
import { Plus, X, Tag } from 'lucide-react';

const COLORS = ['#f59e0b','#0891b2','#059669','#7c3aed','#dc2626','#0d9488'];

export default function PromotionsPage() {
  const [promos, setPromos] = useState<CodePromo[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'promos' | 'tarification'>('promos');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    pourcentageReduction: 0,
    dateExpiration: '',
    nbUtilisationsMax: '',
    compagnieId: 0,
  });
  const [tarifConfig, setTarifConfig] = useState<TarificationConfig>({
    reductionTrentejours: 20,
    reductionQuinzeJours: 10,
    supplementJourMeme: 10,
    seuilHaut: 80,
    supplementHaut: 15,
    seuilBas: 30,
    reductionBas: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promosData, compagniesData] = await Promise.all([
        adminPromotionApi.getPromos(),
        adminCompagnieApi.getAll(),
      ]);
      setPromos(Array.isArray(promosData) ? promosData : []);
      setCompagnies(Array.isArray(compagniesData) ? compagniesData : []);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminPromotionApi.createPromo({
        code: formData.code,
        pourcentageReduction: formData.pourcentageReduction,
        dateExpiration: formData.dateExpiration,
        nbUtilisationsMax: formData.nbUtilisationsMax ? parseInt(formData.nbUtilisationsMax) : undefined,
        compagnieId: formData.compagnieId || undefined,
      });
      setShowModal(false);
      setFormData({ code: '', pourcentageReduction: 0, dateExpiration: '', nbUtilisationsMax: '', compagnieId: 0 });
      loadData();
      alert('Code promo créé avec succès');
    } catch (error: any) {
      console.error('Erreur création', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDesactiver = async (id: number) => {
    if (confirm('Désactiver ce code promo ?')) {
      await adminPromotionApi.desactiverPromo(id);
      loadData();
    }
  };

  const handleConfigurerTarification = async () => {
    try {
      await adminPromotionApi.configurerTarification(tarifConfig);
      alert('Configuration sauvegardée');
    } catch (error) {
      console.error('Erreur configuration', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement des promotions…</p>
        </div>
      </AdminLayout>
    );
  }

  // Chart data
  const promosByCompagnie = [
    { name: 'Global', promos: promos.filter(p => !p.compagnieId || p.compagnieId === 0).length },
    ...compagnies.map(c => ({
      name: c.nom,
      promos: promos.filter(p => Number(p.compagnieId) === Number(c.id)).length,
    }))
  ];
  const now = new Date();
  const actifData = [
    { name: 'Actifs', value: promos.filter(p => p.actif && new Date(p.dateExpiration) > now).length, color: '#10b981' },
    { name: 'Expirés/Désactivés', value: promos.filter(p => !p.actif || new Date(p.dateExpiration) <= now).length, color: '#f43f5e' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Promotions</h1>
            <p className="text-slate-500 text-sm mt-0.5">{promos.length} codes promo au total</p>
          </div>
          {activeTab === 'promos' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition shadow-sm"
            >
              <Plus size={16} /> Nouveau code promo
            </button>
          )}
        </div>

        {/* Charts */}
        {activeTab === 'promos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="font-semibold text-slate-700 text-sm mb-4">Codes promo par compagnie</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={promosByCompagnie} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#fffbeb' }} />
                  <Bar dataKey="promos" name="Codes" radius={[6,6,0,0]}>
                    {promosByCompagnie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="font-semibold text-slate-700 text-sm mb-4">Actifs vs Expirés</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={actifData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {actifData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {actifData.map(d => (
                    <div key={d.name}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-slate-600">{d.name}</span>
                      </div>
                      <p className="text-2xl font-bold ml-5" style={{ color: d.color }}>{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Onglets */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'promos'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Codes Promo
          </button>
          <button
            onClick={() => setActiveTab('tarification')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'tarification'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tarification
          </button>
        </div>

        {/* Onglet Promos */}
        {activeTab === 'promos' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Code','Réduction','Expiration','Utilisations','Compagnie','Statut','Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {promos.map((promo) => {
                  const expired = new Date(promo.dateExpiration) <= new Date();
                  return (
                  <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-amber-700 text-sm">{promo.code}</td>
                    <td className="px-5 py-4"><span className="font-bold text-emerald-600">{promo.pourcentageReduction}%</span></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{new Date(promo.dateExpiration).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{promo.nbUtilisationsActuel} / {promo.nbUtilisationsMax || '∞'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{compagnies.find(c => c.id === promo.compagnieId)?.nom || 'Toutes'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        promo.actif && !expired ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {promo.actif && !expired ? '✓ Actif' : expired ? 'Expiré' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {promo.actif && <button onClick={() => handleDesactiver(promo.id)} className="text-xs text-rose-500 hover:text-rose-700 font-medium transition">Désactiver</button>}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Onglet Tarification */}
        {activeTab === 'tarification' && (
          <div className="space-y-5">
            {/* Bloc 1 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Tarification par délai de réservation</p>
                  <p className="text-xs text-slate-500">Réductions automatiques selon l'anticipation</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">30 jours à l'avance</p>
                    <span className="text-2xl font-black text-emerald-600">-{tarifConfig.reductionTrentejours}%</span>
                  </div>
                  <p className="text-xs text-emerald-600/70 mb-4">Réservation très anticipée</p>
                  <input type="range" min={0} max={50} step={1}
                    value={tarifConfig.reductionTrentejours}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, reductionTrentejours: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-emerald-500 mt-1"><span>0%</span><span>50%</span></div>
                </div>
                <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">15 jours à l'avance</p>
                    <span className="text-2xl font-black text-teal-600">-{tarifConfig.reductionQuinzeJours}%</span>
                  </div>
                  <p className="text-xs text-teal-600/70 mb-4">Réservation anticipée</p>
                  <input type="range" min={0} max={50} step={1}
                    value={tarifConfig.reductionQuinzeJours}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, reductionQuinzeJours: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-teal-500 mt-1"><span>0%</span><span>50%</span></div>
                </div>
                <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Jour même</p>
                    <span className="text-2xl font-black text-rose-600">+{tarifConfig.supplementJourMeme}%</span>
                  </div>
                  <p className="text-xs text-rose-600/70 mb-4">Supplément last minute</p>
                  <input type="range" min={0} max={50} step={1}
                    value={tarifConfig.supplementJourMeme}
                    onChange={(e) => setTarifConfig({ ...tarifConfig, supplementJourMeme: parseFloat(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-rose-400 mt-1"><span>0%</span><span>50%</span></div>
                </div>
              </div>
            </div>

            {/* Bloc 2 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Smart Pricing — Taux de remplissage</p>
                  <p className="text-xs text-slate-500">Ajustement dynamique selon l'occupation du bus</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Bus très rempli</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-amber-700 font-medium">Seuil déclencheur</label>
                      <span className="text-sm font-black text-amber-700">{tarifConfig.seuilHaut}% occ.</span>
                    </div>
                    <input type="range" min={50} max={100} step={1}
                      value={tarifConfig.seuilHaut}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, seuilHaut: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-amber-400 mt-1"><span>50%</span><span>100%</span></div>
                  </div>
                  <div className="pt-2 border-t border-amber-100">
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-amber-700 font-medium">Supplément appliqué</label>
                      <span className="text-sm font-black text-amber-700">+{tarifConfig.supplementHaut}%</span>
                    </div>
                    <input type="range" min={0} max={50} step={1}
                      value={tarifConfig.supplementHaut}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, supplementHaut: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-amber-400 mt-1"><span>0%</span><span>50%</span></div>
                  </div>
                  <div className="bg-amber-100 rounded-xl p-3 text-xs text-amber-700">
                    📈 Si remplissage ≥ <strong>{tarifConfig.seuilHaut}%</strong> → prix +<strong>{tarifConfig.supplementHaut}%</strong>
                  </div>
                </div>
                <div className="bg-cyan-50 rounded-2xl p-5 border border-cyan-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                    <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Bus peu rempli</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-cyan-700 font-medium">Seuil déclencheur</label>
                      <span className="text-sm font-black text-cyan-700">{tarifConfig.seuilBas}% occ.</span>
                    </div>
                    <input type="range" min={0} max={50} step={1}
                      value={tarifConfig.seuilBas}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, seuilBas: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-cyan-400 mt-1"><span>0%</span><span>50%</span></div>
                  </div>
                  <div className="pt-2 border-t border-cyan-100">
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-cyan-700 font-medium">Réduction appliquée</label>
                      <span className="text-sm font-black text-cyan-700">-{tarifConfig.reductionBas}%</span>
                    </div>
                    <input type="range" min={0} max={50} step={1}
                      value={tarifConfig.reductionBas}
                      onChange={(e) => setTarifConfig({ ...tarifConfig, reductionBas: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-cyan-400 mt-1"><span>0%</span><span>50%</span></div>
                  </div>
                  <div className="bg-cyan-100 rounded-xl p-3 text-xs text-cyan-700">
                    📉 Si remplissage ≤ <strong>{tarifConfig.seuilBas}%</strong> → prix -<strong>{tarifConfig.reductionBas}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleConfigurerTarification}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-sm"
              >
                <span>💾</span> Sauvegarder la configuration
              </button>
            </div>
          </div>
        )}

      {/* Modal création promo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouveau Code Promo</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="PROMO20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Réduction (%) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={formData.pourcentageReduction}
                  onChange={(e) => setFormData({ ...formData, pourcentageReduction: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Date d'expiration *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dateExpiration}
                  onChange={(e) => setFormData({ ...formData, dateExpiration: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nombre max d'utilisations</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Illimité"
                  value={formData.nbUtilisationsMax}
                  onChange={(e) => setFormData({ ...formData, nbUtilisationsMax: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Compagnie (optionnel)</label>
                <select
                  value={formData.compagnieId}
                  onChange={(e) => setFormData({ ...formData, compagnieId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Toutes les compagnies</option>
                  {compagnies.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg">
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
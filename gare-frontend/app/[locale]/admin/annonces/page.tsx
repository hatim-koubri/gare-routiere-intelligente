'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminPromotionApi } from '@/lib/api/admin/promotions';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { Plus, X, Search } from 'lucide-react';

const COLORS = ['#7c3aed','#0891b2','#059669','#f59e0b','#dc2626','#0d9488'];

interface Annonce {
  id: number;
  titreFr: string;
  titreAr?: string;
  contenuFr: string;
  contenuAr?: string;
  dateDebut?: string;
  dateFin?: string;
  active: boolean;
  compagnieId?: number;
}

interface Compagnie {
  id: number;
  nom: string;
}

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    titreFr: '',
    titreAr: '',
    contenuFr: '',
    contenuAr: '',
    dateDebut: '',
    dateFin: '',
    compagnieId: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annoncesData, compagniesData] = await Promise.all([
        adminPromotionApi.getAnnonces(),
        adminCompagnieApi.getAll(),
      ]);
      setAnnonces(annoncesData);
      setCompagnies(compagniesData);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnonces = annonces.filter(a =>
    a.titreFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.titreAr && a.titreAr.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminPromotionApi.createAnnonce({
        ...formData,
        compagnieId: formData.compagnieId || undefined,
      });
      setShowModal(false);
      setFormData({ titreFr: '', titreAr: '', contenuFr: '', contenuAr: '', dateDebut: '', dateFin: '', compagnieId: 0 });
      loadData();
    } catch (error) {
      console.error('Erreur création', error);
      alert('Erreur lors de la création');
    }
  };

  const handleDesactiver = async (id: number) => {
    if (confirm('Désactiver cette annonce ?')) {
      await adminPromotionApi.desactiverAnnonce(id);
      loadData();
    }
  };

  // Chart data
  const annoncesByCompagnie = [
    { name: 'Global', annonces: annonces.filter(a => !a.compagnieId || a.compagnieId === 0).length },
    ...compagnies.map(c => ({
      name: c.nom,
      annonces: annonces.filter(a => Number(a.compagnieId) === Number(c.id)).length,
    }))
  ];
  const statutData = [
    { name: 'Actives', value: annonces.filter(a => a.active).length, color: '#7c3aed' },
    { name: 'Désactivées', value: annonces.filter(a => !a.active).length, color: '#94a3b8' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Annonces</h1>
          <p className="text-slate-500 text-sm mt-0.5">{annonces.length} annonces publiées</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
        >
          <Plus size={16} /> Nouvelle annonce
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="font-semibold text-slate-700 text-sm mb-4">Annonces par compagnie</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={annoncesByCompagnie} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f5f3ff' }} />
              <Bar dataKey="annonces" name="Annonces" radius={[6,6,0,0]}>
                {annoncesByCompagnie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="font-semibold text-slate-700 text-sm mb-4">Actives vs Désactivées</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={statutData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {statutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {statutData.map(d => (
                <div key={d.name}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-slate-600">{d.name}</span>
                  </div>
                  <p className="text-3xl font-bold ml-5" style={{ color: d.color }}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher une annonce…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
        />
      </div>

      {/* Loading / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement…</p>
        </div>
      ) : filteredAnnonces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">Aucune annonce trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Titre','Contenu','Début','Fin','Compagnie','Statut','Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAnnonces.map((annonce) => (
                <tr key={annonce.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{annonce.titreFr}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 max-w-xs truncate">{annonce.contenuFr}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{annonce.dateDebut ? new Date(annonce.dateDebut).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{annonce.dateFin ? new Date(annonce.dateFin).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{annonce.compagnieId ? compagnies.find(c => c.id === annonce.compagnieId)?.nom || '—' : 'Globale'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${annonce.active ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
                      {annonce.active ? '✓ Active' : 'Désactivée'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {annonce.active && (
                      <button onClick={() => handleDesactiver(annonce.id)} className="text-xs text-rose-500 hover:text-rose-700 font-medium transition">Désactiver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle Annonce</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre (Français) *</label>
                  <input
                    type="text"
                    required
                    value={formData.titreFr}
                    onChange={(e) => setFormData({ ...formData, titreFr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre (Arabe)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.titreAr}
                    onChange={(e) => setFormData({ ...formData, titreAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (Français) *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.contenuFr}
                    onChange={(e) => setFormData({ ...formData, contenuFr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (Arabe)</label>
                  <textarea
                    dir="rtl"
                    rows={3}
                    value={formData.contenuAr}
                    onChange={(e) => setFormData({ ...formData, contenuAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                  <input
                    type="datetime-local"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input
                    type="datetime-local"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie (optionnel)</label>
                <select
                  value={formData.compagnieId}
                  onChange={(e) => setFormData({ ...formData, compagnieId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Toutes les compagnies</option>
                  {compagnies.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
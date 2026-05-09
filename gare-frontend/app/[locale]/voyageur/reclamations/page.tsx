'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reclamationApi } from '@/lib/api/voyageur/reclamations';
import { Reclamation, TypeReclamation } from '@/types';
import {
  ArrowLeft, AlertTriangle, Package, Clock,
  HeadphonesIcon, HelpCircle, Plus,
  ChevronRight, AlertCircle, CheckCircle2,
  XCircle, RefreshCw, MessageSquare, Search
} from 'lucide-react';

const typeConfig: Record<TypeReclamation, { label: string; icon: any; color: string; bg: string }> = {
  BAGAGE_PERDU: { label: 'Bagage perdu', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  BAGAGE_ENDOMMAGE: { label: 'Bagage endommagé', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
  RETARD: { label: 'Retard', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  SERVICE_CLIENT: { label: 'Service client', icon: HeadphonesIcon, color: 'text-violet-600', bg: 'bg-violet-50' },
  AUTRE: { label: 'Autre', icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
};

const statutConfig: Record<string, { label: string; icon: any; color: string }> = {
  OUVERTE: { label: 'Ouverte', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
  EN_COURS: { label: 'En cours', icon: RefreshCw, color: 'text-blue-600 bg-blue-50' },
  RESOLUE: { label: 'Résolue', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  REJETEE: { label: 'Rejetée', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

export default function MesReclamationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [selected, setSelected] = useState<Reclamation | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/fr/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reclamationApi.getAll();
      setReclamations(data);
    } catch (err: any) {
      setError(err.response?.data || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = reclamations.filter(r => {
    if (filterStatut !== 'TOUS' && r.statut !== filterStatut) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.sujet.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes réclamations</h1>
          <p className="text-slate-500 text-sm mt-0.5">Suivez l'état de vos réclamations</p>
        </div>
        <Link
          href="/fr/voyageur/reclamations/creer"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
        >
          <Plus size={16} />
          Nouvelle réclamation
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="OUVERTE">Ouverte</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLUE">Résolue</option>
          <option value="REJETEE">Rejetée</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">Aucune réclamation trouvée</p>
          <Link
            href="/fr/voyageur/reclamations/creer"
            className="inline-flex items-center gap-2 mt-4 text-violet-600 text-sm font-medium hover:text-violet-700"
          >
            <Plus size={14} /> Créer une réclamation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const tc = typeConfig[r.type];
            const sc = statutConfig[r.statut];
            const StatutIcon = sc.icon;
            const TypeIcon = tc.icon;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 p-5 hover:border-violet-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon size={18} className={tc.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-400">{tc.label}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{new Date(r.dateCreation).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="font-semibold text-slate-800 truncate">{r.sujet}</p>
                    {r.reservationId && (
                      <p className="text-xs text-slate-400 mt-0.5">Réservation #{r.reservationId}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                      <StatutIcon size={11} />
                      {sc.label}
                    </span>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start gap-4 mb-5">
              <div className={`w-12 h-12 rounded-xl ${typeConfig[selected.type].bg} flex items-center justify-center flex-shrink-0`}>
                {(() => { const Icon = typeConfig[selected.type].icon; return <Icon size={22} className={typeConfig[selected.type].color} />; })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">{typeConfig[selected.type].label}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selected.sujet}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(selected.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                {selected.reservationId && (
                  <p className="text-xs text-slate-400 mt-0.5">Réservation #{selected.reservationId}</p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statutConfig[selected.statut].color}`}>
                {(() => { const Icon = statutConfig[selected.statut].icon; return <Icon size={12} />; })()}
                {statutConfig[selected.statut].label}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl mb-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
            </div>

            {selected.trajetInfo && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Clock size={14} />
                {selected.trajetInfo}
              </div>
            )}

            {selected.reponseResponsable && (
              <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-violet-600" />
                  <p className="text-xs font-semibold text-violet-700">Réponse du responsable</p>
                </div>
                <p className="text-sm text-violet-800 whitespace-pre-wrap">{selected.reponseResponsable}</p>
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import type { Remboursement } from '@/types';
import {
  ArrowLeft, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Hourglass, XCircle, Wallet, Bus, Calendar
} from 'lucide-react';
import Link from 'next/link';

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

function StatutBadge({ statut }: { statut: string }) {
  const cfg: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200', Icon: Hourglass },
    ACCEPTE: { label: 'Accepté', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', Icon: CheckCircle2 },
    REFUSE: { label: 'Refusé', cls: 'bg-red-50 text-red-600 border border-red-200', Icon: XCircle },
  };
  const { label, cls, Icon } = cfg[statut] ?? { label: statut, cls: 'bg-slate-50 text-slate-600 border border-slate-200', Icon: AlertCircle };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

export default function MesRemboursementsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/fr/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadRemboursements();
  }, [user]);

  const loadRemboursements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/voyageur/reservations/remboursements');
      const data = response.data;
      setRemboursements(data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRemboursements();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement de vos remboursements…</p>
      </div>
    );
  }

  const stats = {
    total: remboursements.length,
    enAttente: remboursements.filter(r => r.statut === 'EN_ATTENTE').length,
    acceptes: remboursements.filter(r => r.statut === 'ACCEPTE').length,
    refuses: remboursements.filter(r => r.statut === 'REFUSE').length,
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes remboursements</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {remboursements.length} demande{remboursements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:border-slate-300 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100">
          <p className="text-2xl font-bold text-amber-600">{stats.enAttente}</p>
          <p className="text-xs text-amber-600">En attente</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-600">{stats.acceptes}</p>
          <p className="text-xs text-emerald-600">Acceptés</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-red-100">
          <p className="text-2xl font-bold text-red-600">{stats.refuses}</p>
          <p className="text-xs text-red-600">Refusés</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* List */}
      {remboursements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucun remboursement</h3>
          <p className="text-sm text-slate-400">Vous n&apos;avez pas encore de demande de remboursement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {remboursements.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatutBadge statut={r.statut} />
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{r.motif}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(r.dateDemande)}
                    </span>
                    {r.dateTraitement && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Traité le {formatDate(r.dateTraitement)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-slate-900">{r.montant} MAD</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

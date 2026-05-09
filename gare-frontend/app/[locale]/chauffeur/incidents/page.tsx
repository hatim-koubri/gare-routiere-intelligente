'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurIncidentApi } from '@/lib/api/chauffeur/incidents';
import { Role } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, Loader2, CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const INCIDENT_TYPES = [
  { value: 'RETARD', label: 'Retard', icon: '⏰', color: 'bg-amber-50 border-amber-200 text-amber-700', activeColor: 'bg-amber-500 border-amber-600 text-white' },
  { value: 'PANNE', label: 'Panne mécanique', icon: '🔧', color: 'bg-red-50 border-red-200 text-red-700', activeColor: 'bg-red-500 border-red-600 text-white' },
  { value: 'ACCIDENT', label: 'Accident', icon: '💥', color: 'bg-orange-50 border-orange-200 text-orange-700', activeColor: 'bg-orange-500 border-orange-600 text-white' },
  { value: 'AUTRE', label: 'Autre', icon: '📝', color: 'bg-slate-50 border-slate-200 text-slate-600', activeColor: 'bg-slate-600 border-slate-700 text-white' },
];

export default function IncidentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trajetId = searchParams.get('trajetId');
  const [formData, setFormData] = useState({ type: 'RETARD', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setError('Veuillez décrire l\'incident');
      return;
    }
    setLoading(true); setError(''); setSuccess(false);
    try {
      await chauffeurIncidentApi.signalerIncident({
        trajetId: Number(trajetId),
        type: formData.type,
        description: formData.description,
      });
      setSuccess(true);
      setTimeout(() => router.push('/fr/chauffeur/trajets'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

          <Link
            href="/fr/chauffeur/trajets"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Retour aux trajets
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Signaler un incident</h1>
                {trajetId && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Trajet <span className="text-red-600 font-semibold">#{trajetId}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <p className="text-emerald-800 font-bold text-lg">Incident signalé</p>
              <p className="text-emerald-600 text-sm mt-1">Redirection vers les trajets...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Type d&apos;incident
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INCIDENT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.value })}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        formData.type === t.value ? t.activeColor : t.color
                      }`}
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez précisément l'incident..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm hover:shadow-md transition-all"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signalement en cours...</>
                ) : (
                  <><AlertTriangle size={16} /> Signaler l&apos;incident</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

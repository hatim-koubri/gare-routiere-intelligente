'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { reclamationApi } from '@/lib/api/voyageur/reclamations';
import { apiClient } from '@/lib/api/client';
import { TypeReclamation } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, Package, Clock,
  HeadphonesIcon, HelpCircle, Send, AlertCircle,
  CheckCircle2, Info, QrCode
} from 'lucide-react';

const typeOptions: { value: TypeReclamation; label: string; desc: string; icon: any; color: string; activeBg: string }[] = [
  { value: 'BAGAGE_PERDU', label: 'Bagage perdu', desc: 'Je ne trouve plus mon bagage', icon: AlertTriangle, color: 'text-rose-600', activeBg: 'border-rose-400 bg-rose-50' },
  { value: 'BAGAGE_ENDOMMAGE', label: 'Bagage endommagé', desc: 'Mon bagage a subi des dégâts', icon: Package, color: 'text-amber-600', activeBg: 'border-amber-400 bg-amber-50' },
  { value: 'RETARD', label: 'Retard', desc: 'Mon voyage a eu du retard', icon: Clock, color: 'text-blue-600', activeBg: 'border-blue-400 bg-blue-50' },
  { value: 'SERVICE_CLIENT', label: 'Service client', desc: 'Question sur un service', icon: HeadphonesIcon, color: 'text-violet-600', activeBg: 'border-violet-400 bg-violet-50' },
  { value: 'AUTRE', label: 'Autre', desc: 'Autre motif', icon: HelpCircle, color: 'text-slate-600', activeBg: 'border-slate-400 bg-slate-50' },
];

interface ReservationOption {
  id: number;
  label: string;
}

export default function CreerReclamationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [type, setType] = useState<TypeReclamation>('SERVICE_CLIENT');
  const [sujet, setSujet] = useState('');
  const [description, setDescription] = useState('');
  const [reservationId, setReservationId] = useState<number | undefined>(
    searchParams.get('reservation') ? Number(searchParams.get('reservation')) : undefined
  );
  const [codeBagage, setCodeBagage] = useState('');
  const [reservations, setReservations] = useState<ReservationOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isBagageType = type === 'BAGAGE_PERDU' || type === 'BAGAGE_ENDOMMAGE';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/fr/auth/login');
      return;
    }
    if (user) {
      loadReservations();
    }
  }, [user, authLoading, router]);

  const loadReservations = async () => {
    try {
      const res = await apiClient.get('/voyageur/reservations');
      const list = (res.data.content || res.data || [])
        .filter((r: any) => r.statut === 'CONFIRMEE' || r.statut === 'ANNULEE')
        .map((r: any) => ({
          id: r.id,
          label: `#${r.id} - ${r.trajet?.villeDepart || ''} → ${r.trajet?.villeArrivee || ''} (${new Date(r.trajet?.dateDepart).toLocaleDateString('fr-FR')})`,
        }));
      setReservations(list);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sujet.trim() || !description.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (isBagageType && !codeBagage.trim()) {
      setError('Veuillez entrer le code QR de votre bagage');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reclamationApi.creer({
        type,
        sujet: sujet.trim(),
        description: description.trim(),
        reservationId: reservationId || undefined,
        codeBagage: codeBagage.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={38} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Réclamation envoyée</h2>
        <p className="text-slate-500 max-w-sm mb-6">
          Votre réclamation a été transmise à notre équipe. Vous serez informé dès qu'une réponse sera apportée.
        </p>
        <div className="flex gap-3">
          <Link
            href="/fr/voyageur/reclamations"
            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
          >
            Voir mes réclamations
          </Link>
          <button
            onClick={() => { setSuccess(false); setSujet(''); setDescription(''); }}
            className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
          >
            Créer une autre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link
          href="/fr/voyageur/reclamations"
          className="p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouvelle réclamation</h1>
          <p className="text-slate-500 text-sm mt-0.5">Soumettez une réclamation à notre équipe</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
        <Info size={17} className="text-violet-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-violet-700">
          Les réclamations sont traitées sous <strong>48 heures ouvrées</strong>. Vous recevrez une notification dès qu'une réponse sera apportée.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Type de réclamation
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {typeOptions.map(opt => {
                const isActive = type === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${isActive ? opt.activeBg : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <Icon size={20} className={`mb-2 ${isActive ? opt.color : 'text-slate-400'}`} />
                    <p className={`text-sm font-semibold ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{opt.label}</p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Sujet
            </label>
            <input
              type="text"
              value={sujet}
              onChange={e => setSujet(e.target.value)}
              placeholder="Résumez votre réclamation"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          {isBagageType && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Code QR du bagage
              </label>
              <div className="relative">
                <QrCode size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={codeBagage}
                  onChange={e => setCodeBagage(e.target.value)}
                  placeholder="Ex: BAG-12345"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Le code QR se trouve sur l'étiquette de votre bagage scannée par le chauffeur</p>
            </div>
          )}

          {reservations.length > 0 && !searchParams.get('reservation') && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Réservation concernée (optionnel)
              </label>
              <select
                value={reservationId || ''}
                onChange={e => setReservationId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Aucune réservation</option>
                {reservations.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          )}
          {searchParams.get('reservation') && (
            <div className="p-3 bg-violet-50 rounded-xl text-sm text-violet-700 flex items-center gap-2">
              <Info size={15} />
              Réclamation liée à la réservation #{searchParams.get('reservation')}
            </div>
          )}
        </div>

        {error && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {submitting ? 'Envoi en cours…' : 'Soumettre la réclamation'}
          </button>
        </div>
      </form>
    </div>
  );
}

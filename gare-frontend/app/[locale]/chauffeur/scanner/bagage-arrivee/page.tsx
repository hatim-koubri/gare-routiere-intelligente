'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurBagageApi } from '@/lib/api/chauffeur/bagages';
import { Role } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle,
  Loader2, User, Mail, Weight, Banknote, Scan, Luggage,
} from 'lucide-react';

export default function ScannerBagageArriveePage() {
  const [bagageId, setBagageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(bagageId);
    if (!id || isNaN(id)) { setError('Veuillez entrer un ID de bagage valide'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await chauffeurBagageApi.scannerBagageArrivee(id);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du scan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setBagageId(''); setResult(null); setError(''); };

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

          <Link
            href="/fr/chauffeur/trajets"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Retour aux trajets
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Scan size={22} className="text-teal-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Bagage — Arrivée</h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Scanner un bagage à l&apos;arrivée pour确认 l&apos;identité
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  QR Code du bagage
                </label>
                <input
                  type="text"
                  value={bagageId}
                  onChange={(e) => { setBagageId(e.target.value); setError(''); }}
                  placeholder="Entrer le code ou l&apos;ID du bagage..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !bagageId.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Scan en cours...</>
                ) : (
                  <><Scan size={16} /> Scanner à l&apos;arrivée</>
                )}
              </button>
            </form>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Identité non confirmée</p>
                <p className="text-red-500 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                <XCircle size={16} />
              </button>
            </div>
          )}

          {result?.valide && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
                <div className="bg-teal-500 px-6 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">Identité confirmée</p>
                    <p className="text-teal-100 text-xs font-medium">Bagage récupéré avec succès</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-teal-200 uppercase tracking-wider">Bagage #</p>
                    <p className="text-white font-bold">{result.bagageId || bagageId}</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voyageur</p>
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <User size={15} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nom</p>
                      <p className="text-sm font-semibold text-slate-800">{result.nomVoyageur}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Mail size={15} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-semibold text-slate-800">{result.emailVoyageur}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Détails du bagage</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                        <Weight size={15} className="text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Poids</p>
                          <p className="text-sm font-semibold text-slate-800">{result.poidsKg} kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                        <Banknote size={15} className="text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Surplus</p>
                          <p className="text-sm font-semibold text-slate-800">{result.surplusPrix} MAD</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 transition-all"
              >
                Scanner un autre bagage
              </button>
            </div>
          )}

          {result && !result.valide && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <XCircle size={40} className="text-red-400 mx-auto mb-3" />
              <p className="text-red-700 font-semibold">Bagage non trouvé</p>
              <p className="text-red-400 text-sm mt-1">Vérifiez l&apos;ID du bagage et réessayez</p>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

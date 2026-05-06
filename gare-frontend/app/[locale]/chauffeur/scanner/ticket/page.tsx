'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTicketApi } from '@/lib/api/chauffeur/tickets';
import { Role } from '@/types';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  QrCode, CheckCircle2, XCircle, Scan, ArrowLeft,
  User, Hash, CalendarDays, Baby, Loader2, AlertCircle,
} from 'lucide-react';

export default function ScannerTicketPage() {
  const searchParams = useSearchParams();
  const trajetId = searchParams.get('trajetId');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (result?.valide && qrCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrCode, {
        width: 100, margin: 1,
        color: { dark: '#185FA5', light: '#ffffff' },
      });
    }
  }, [result, qrCode]);

  useEffect(() => {
    if (result?.valide) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 300);
      return () => clearTimeout(t);
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) { setError('Veuillez entrer ou scanner un QR code'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await chauffeurTicketApi.validerTicket(qrCode);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const simulateScan = () => {
    setQrCode('TICKET-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  };

  const handleReset = () => { setQrCode(''); setResult(null); setError(''); };

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

          {/* ── Header ── */}
          <div>
            <Link
              href="/fr/chauffeur/trajets"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-5"
            >
              <ArrowLeft size={15} /> Retour aux trajets
            </Link>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <QrCode size={22} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Scanner Ticket</h1>
                  {trajetId && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Trajet <span className="text-indigo-600 font-semibold">#{trajetId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Formulaire ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Code QR du ticket
                </label>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => { setQrCode(e.target.value); setError(''); }}
                  placeholder="Scanner ou entrer le code manuellement..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={simulateScan}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:border-slate-300 transition-all"
                >
                  <Scan size={16} /> Simuler scan
                </button>
                <button
                  type="submit"
                  disabled={loading || !qrCode.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Validation...</>
                  ) : (
                    <><CheckCircle2 size={16} /> Valider</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Erreur ── */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ticket invalide</p>
                <p className="text-red-500 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* ── Résultat : ticket validé ── */}
          {result?.valide && (
            <div className="rounded-2xl overflow-hidden shadow-xl border border-white/20"
              style={{ background: '#0f172a', fontFamily: "'Courier Prime', 'Space Mono', monospace" }}>

              {/* Header ticket */}
              <div className="relative px-6 py-6 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)' }}>
                <div className="absolute rounded-full opacity-10" style={{ width: 120, height: 120, top: -40, right: -30, background: 'white' }} />
                <div className="absolute rounded-full opacity-10" style={{ width: 70, height: 70, bottom: -25, left: 50, background: 'white' }} />

                <p className="text-[10px] tracking-[0.25em] text-indigo-300 uppercase mb-1 relative z-10">Boarding Pass</p>
                <p className="text-2xl font-bold text-white tracking-wide relative z-10">
                  {result.prenomPassager} {result.nomPassager}
                </p>
                <div className="flex items-center gap-2 mt-2 relative z-10">
                  <span className="px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-semibold"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    {result.categorie}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                    <CheckCircle2 size={11} /> Embarqué
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 flex gap-5 items-start">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { icon: <Hash size={11} />, label: 'Siège', value: result.numeroSiege },
                    { icon: <Hash size={11} />, label: 'Trajet', value: `#${trajetId}` },
                    { icon: <CalendarDays size={11} />, label: 'Date', value: new Date().toLocaleDateString('fr-FR') },
                    { icon: <User size={11} />, label: 'Statut', value: 'Embarqué', green: true },
                  ].map(({ icon, label, value, green }) => (
                    <div key={label}>
                      <div className="flex items-center gap-1 mb-1" style={{ color: '#64748b' }}>
                        {icon}
                        <p className="text-[10px] tracking-[0.2em] uppercase">{label}</p>
                      </div>
                      <p className={`text-sm font-bold ${green ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="p-1.5 rounded-lg" style={{ border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
                    <canvas ref={qrCanvasRef} className="rounded" />
                  </div>
                  <p className="text-[9px] tracking-widest uppercase" style={{ color: '#475569' }}>QR Code</p>
                </div>
              </div>

              {result.enfantSurGenoux && (
                <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Baby size={13} /> Enfant sur genoux
                </div>
              )}

              {/* Ligne de découpe */}
              <div className="flex items-center">
                <div className="rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: '#0f172a', marginLeft: -10 }} />
                <div className="flex-1 flex gap-1 justify-center px-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="rounded-full flex-shrink-0" style={{ width: 3, height: 3, background: 'rgba(255,255,255,0.12)' }} />
                  ))}
                </div>
                <div className="rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: '#0f172a', marginRight: -10 }} />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex gap-0.5 items-center mb-1.5" style={{ height: 32 }}>
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className="rounded-sm flex-shrink-0" style={{
                        width: `${(i % 3) + 1}px`,
                        height: `${16 + (i % 14)}px`,
                        background: 'rgba(255,255,255,0.25)',
                      }} />
                    ))}
                  </div>
                  <p className="text-[10px] tracking-wider font-mono" style={{ color: '#334155' }}>{qrCode}</p>
                </div>
                <div className="flex items-center justify-center flex-col flex-shrink-0 w-12 h-12 rounded-full"
                  style={{ border: '2.5px solid #22c55e' }}>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-[7px] font-bold tracking-widest text-emerald-500 mt-0.5">OK</span>
                </div>
              </div>
            </div>
          )}

          {/* Ticket invalide */}
          {result && !result.valide && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <XCircle size={40} className="text-red-400 mx-auto mb-3" />
              <p className="text-red-700 font-semibold">Ticket invalide</p>
              <p className="text-red-400 text-sm mt-1">Ce ticket n'est pas valide pour ce trajet</p>
            </div>
          )}

          {/* Reset */}
          {result && (
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            >
              Scanner un autre ticket
            </button>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
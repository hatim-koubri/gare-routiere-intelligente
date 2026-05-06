'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurBagageApi } from '@/lib/api/chauffeur/bagages';
import { Role } from '@/types';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Luggage, ArrowLeft, CheckCircle2, XCircle, AlertCircle,
  Loader2, User, Mail, Weight, Banknote, QrCode, Hash, Printer
} from 'lucide-react';

export default function ScannerBagagePage() {
  const searchParams = useSearchParams();
  const trajetId = searchParams.get('trajetId');
  const [bagageId, setBagageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (showModal && result?.qrCodeBagage && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, result.qrCodeBagage, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    }
  }, [showModal, result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(bagageId);
    if (!id || isNaN(id)) { setError('Veuillez entrer un ID de bagage valide'); return; }
    setLoading(true); setError(''); setResult(null); setShowModal(false);
    try {
      const response = await chauffeurBagageApi.scannerBagage(id);
      setResult(response);
      setShowModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du scan du bagage');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setBagageId(''); setResult(null); setError(''); setShowModal(false); };

  const handlePrint = () => {
    if (qrCanvasRef.current && result) {
      const dataUrl = qrCanvasRef.current.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Étiquette Bagage - ${result.bagageId || bagageId}</title>
              <style>
                body { 
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px; 
                  background: #fff;
                  color: #000;
                  margin: 0;
                }
                .ticket { 
                  border: 2px solid #000; 
                  border-radius: 12px;
                  padding: 30px; 
                  display: inline-block; 
                  width: 320px; 
                  box-sizing: border-box;
                }
                .header {
                  text-transform: uppercase;
                  font-size: 14px;
                  font-weight: bold;
                  letter-spacing: 2px;
                  color: #666;
                  margin-bottom: 15px;
                  border-bottom: 1px dashed #ccc;
                  padding-bottom: 10px;
                }
                img { 
                  width: 220px; 
                  height: 220px; 
                  margin: 15px 0;
                }
                h1 { 
                  margin: 10px 0; 
                  font-size: 28px; 
                  font-weight: 900;
                }
                .id-box { 
                  background: #000;
                  color: #fff;
                  font-weight: bold; 
                  font-size: 24px; 
                  margin-top: 20px; 
                  padding: 10px;
                  border-radius: 8px;
                  letter-spacing: 1px;
                }
                @media print {
                  @page { margin: 0; size: auto; }
                  body { padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                }
              </style>
            </head>
            <body>
              <div class="ticket">
                <div class="header">Gare Routière</div>
                <h1>${result.nomVoyageur}</h1>
                <img src="${dataUrl}" alt="QR Code" />
                <div class="id-box">ID: ${result.bagageId || bagageId}</div>
              </div>
              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 200);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const hasSurplus = result && parseFloat(result.surplusPrix) > 0;

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <div className="min-h-screen bg-slate-50 relative">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

          {/* ── Header ── */}
          <div>
            <Link
              href="/fr/chauffeur/trajets"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 font-medium transition-colors mb-5"
            >
              <ArrowLeft size={15} /> Retour aux trajets
            </Link>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Luggage size={22} className="text-violet-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Scanner Bagage</h1>
                  {trajetId && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Trajet <span className="text-violet-600 font-semibold">#{trajetId}</span>
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
                  ID du bagage
                </label>
                <input
                  type="number"
                  value={bagageId}
                  onChange={(e) => { setBagageId(e.target.value); setError(''); }}
                  placeholder="Entrer l'identifiant du bagage..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !bagageId.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Scan en cours...</>
                ) : (
                  <><Luggage size={16} /> Scanner le bagage</>
                )}
              </button>
            </form>
          </div>

          {/* ── Erreur ── */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Scan échoué</p>
                <p className="text-red-500 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* ── Résultat ── */}
          {result && (
            <div className="space-y-4">

              {/* Carte résultat */}
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">

                {/* Bande verte en haut */}
                <div className="bg-emerald-500 px-6 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">Bagage enregistré</p>
                    <p className="text-emerald-100 text-xs font-medium">Scan effectué avec succès</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-emerald-200 uppercase tracking-wider">Bagage #</p>
                    <p className="text-white font-bold">{result.bagageId || bagageId}</p>
                  </div>
                </div>

                {/* Infos voyageur */}
                <div className="p-6 space-y-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informations voyageur</p>
                  <div className="grid grid-cols-1 gap-3">
                    <ResultRow icon={<User size={15} className="text-slate-400" />} label="Voyageur" value={result.nomVoyageur} />
                    <ResultRow icon={<Mail size={15} className="text-slate-400" />} label="Email" value={result.emailVoyageur} />
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Détails du bagage</p>
                    <div className="grid grid-cols-2 gap-3">
                      <ResultRow icon={<Weight size={15} className="text-slate-400" />} label="Poids" value={`${result.poidsKg} kg`} />
                      <ResultRow
                        icon={<Banknote size={15} className={hasSurplus ? 'text-amber-500' : 'text-slate-400'} />}
                        label="Surplus"
                        value={`${result.surplusPrix} MAD`}
                        highlight={hasSurplus}
                      />
                    </div>
                  </div>

                  {result.qrCodeBagage && (
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-start gap-2">
                        <QrCode size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">QR Code bagage</p>
                          <p className="text-xs font-mono text-slate-600 break-all mb-2">{result.qrCodeBagage}</p>
                          <button
                            onClick={() => setShowModal(true)}
                            className="text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                          >
                            Afficher le QR Code
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alerte surplus */}
                {hasSurplus && (
                  <div className="mx-6 mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Banknote size={16} className="text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Surplus à payer</p>
                      <p className="text-xs text-amber-600">Le voyageur doit régler {result.surplusPrix} MAD</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-violet-600 hover:border-violet-200 transition-all"
              >
                Scanner un autre bagage
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Modal QR Code Popup ── */}
      {showModal && result && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white relative text-center">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition"
              >
                <XCircle size={24} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/30">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-black mb-1 tracking-tight">Bagage Validé</h2>
              <p className="text-violet-100 text-sm font-medium">ID: {result.bagageId || bagageId}</p>
            </div>
            
            <div className="p-8 flex flex-col items-center bg-white relative">
              {/* Pointillés décoratifs */}
              <div className="absolute top-0 left-0 w-full h-0 border-t-2 border-dashed border-slate-200 -translate-y-1/2"></div>
              <div className="absolute top-0 left-[-12px] w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full -translate-y-1/2"></div>
              <div className="absolute top-0 right-[-12px] w-6 h-6 bg-slate-900/60 backdrop-blur-sm rounded-full -translate-y-1/2"></div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Voyageur</p>
              <p className="text-2xl font-black text-slate-800 mb-8 text-center">{result.nomVoyageur}</p>
              
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner mb-6 flex flex-col items-center">
                <canvas ref={qrCanvasRef} className="rounded-xl"></canvas>
                <p className="text-[10px] font-mono text-slate-400 mt-2 font-semibold">QR: {result.qrCodeBagage?.substring(0, 16)}...</p>
              </div>
              
              <p className="text-xs text-slate-500 text-center font-medium">
                Veuillez vérifier et attacher ce bagage.
              </p>
            </div>
            
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-xl font-bold transition-colors"
              >
                <Printer size={18} />
                Imprimer
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-lg shadow-slate-900/20"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

function ResultRow({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-semibold truncate ${highlight ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
  );
}
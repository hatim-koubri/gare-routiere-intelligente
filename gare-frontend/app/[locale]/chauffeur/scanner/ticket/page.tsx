'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { chauffeurTicketApi } from '@/lib/api/chauffeur/tickets';
import { Role } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import QRCode from 'qrcode';

export default function ScannerTicketPage() {
  const searchParams = useSearchParams();
  const { locale } = useParams();
  const trajetId = searchParams.get('trajetId');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code on canvas whenever result arrives
  useEffect(() => {
    if (result?.valide && qrCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrCode, {
        width: 100,
        margin: 1,
        color: {
          dark: '#185FA5',
          light: '#ffffff',
        },
      });
    }
  }, [result, qrCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      setError('Veuillez entrer ou scanner un QR code');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await chauffeurTicketApi.validerTicket(qrCode);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  // Simulation scanner (dans une vraie app, utiliser caméra)
  const simulateScan = () => {
    setQrCode('TICKET-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  };

  return (
    <ProtectedRoute allowedRoles={[Role.CHAUFFEUR]}>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-md">

          {/* Back link */}
          <div className="mb-6">
            <Link
              href={`/${locale}/chauffeur/dashboard`}
              className="text-blue-600 hover:underline text-sm"
            >
              ← Retour au tableau de bord
            </Link>
          </div>

          {/* Scanner card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Scanner ticket</h1>
            <p className="text-sm text-gray-500 mb-5">Trajet #{trajetId}</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  QR Code
                </label>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Scanner ou entrer le code"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={simulateScan}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <span>📷</span> Simuler scan
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Validation...
                    </>
                  ) : (
                    <><span>✅</span> Valider</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Styled Ticket */}
          {result && result.valide && (
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: '#1a1a2e', fontFamily: "'Courier Prime', 'Space Mono', monospace" }}
            >

              {/* Header */}
              <div
                className="px-6 py-5 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #185FA5 0%, #0C447C 100%)' }}
              >
                {/* Decorative circles */}
                <div
                  className="absolute rounded-full"
                  style={{ width: 100, height: 100, top: -30, right: -30, background: 'rgba(255,255,255,0.1)' }}
                />
                <div
                  className="absolute rounded-full"
                  style={{ width: 60, height: 60, bottom: -20, left: 40, background: 'rgba(255,255,255,0.07)' }}
                />

                <p className="text-xs tracking-widest opacity-60 uppercase mb-1 relative z-10">
                  Boarding Pass
                </p>
                <p className="text-xl font-bold tracking-wide relative z-10">
                  {result.prenomPassager} {result.nomPassager}
                </p>
                <span
                  className="inline-block mt-2 px-3 py-1 rounded-full text-xs tracking-widest uppercase relative z-10"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                  {result.categorie}
                </span>
              </div>

              {/* Body */}
              <div className="px-6 py-5 flex gap-4 items-start">
                {/* Info grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-4">
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#999' }}>Siège</p>
                      <p className="text-sm font-bold text-white">{result.numeroSiege}</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#999' }}>Trajet</p>
                      <p className="text-sm font-bold text-white">#{trajetId}</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#999' }}>Statut</p>
                      <p className="text-sm font-bold" style={{ color: '#22c55e' }}>Embarqué</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#999' }}>Date</p>
                      <p className="text-sm font-bold text-white">
                        {new Date().toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {result.enfantSurGenoux && (
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                    >
                      ⚠ Enfant sur genoux
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <canvas
                    ref={qrCanvasRef}
                    className="rounded-lg"
                    style={{ border: '3px solid rgba(255,255,255,0.12)' }}
                  />
                  <p className="text-xs tracking-widest uppercase" style={{ color: '#666' }}>
                    QR Code
                  </p>
                </div>
              </div>

              {/* Tear line */}
              <div className="flex items-center" style={{ margin: '0 -1px' }}>
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: 20, height: 20, background: '#111827', marginLeft: -10 }}
                />
                <div className="flex-1 flex gap-1 justify-center px-2">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full flex-shrink-0"
                      style={{ width: 3, height: 3, background: 'rgba(255,255,255,0.18)' }}
                    />
                  ))}
                </div>
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: 20, height: 20, background: '#111827', marginRight: -10 }}
                />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  {/* Fake barcode */}
                  <div className="flex gap-0.5 items-center mb-1.5" style={{ height: 32 }}>
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-sm flex-shrink-0"
                        style={{
                          width: `${(i % 3) + 1}px`,
                          height: `${16 + (i % 14)}px`,
                          background: 'rgba(255,255,255,0.35)',
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-xs tracking-wider"
                    style={{ color: '#555', fontFamily: 'monospace', fontSize: '10px' }}
                  >
                    {qrCode}
                  </p>
                </div>

                {/* Validation stamp */}
                <div
                  className="flex items-center justify-center flex-col flex-shrink-0"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    border: '2.5px solid #22c55e',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span
                    className="font-bold uppercase"
                    style={{ color: '#22c55e', fontSize: '7px', letterSpacing: '1.5px', marginTop: 1 }}
                  >
                    OK
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
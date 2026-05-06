// app/[locale]/confirmation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Home, Printer, MapPin, Calendar, Clock, Bus, Users, CreditCard, Building, Ticket, User, CheckCircle, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { useRef } from 'react';

interface TicketData {
  paiementId: number;
  reservationId: number;
  montant: number;
  methodePaiement: string;
  transactionId: string;
  datePaiement: string;
  confirme: boolean;
  statutReservation: string;
}

interface Passager {
  nom: string;
  prenom: string;
  siege?: string;
  categorieTarifaire?: string;
  enfantSurGenoux?: boolean;
}

export default function ConfirmationPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = 'fr';
  const reservationId = searchParams.get('reservationId');

  const [paiementData, setPaiementData] = useState<TicketData | null>(null);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const storedPaiement = sessionStorage.getItem('paiement_response');
    const storedReservationInfo = sessionStorage.getItem('reservation_info');
    
    if (storedPaiement) {
      setPaiementData(JSON.parse(storedPaiement));
    }
    
    if (storedReservationInfo) {
      const data = JSON.parse(storedReservationInfo);
      setConfirmationData(data);
      console.log('Données reservation_info:', data);
    }
    
    setLoading(false);
  }, []);

  const handlePrint = () => window.print();
  
  // Utiliser la liste de tickets reçue du backend s'ils existent, sinon fallback
  const tousLesPassagers = confirmationData?.tickets || [];
  const currentPassager = tousLesPassagers[currentTicketIndex];
  const trajetInfo = confirmationData?.trajet || {};
  
  useEffect(() => {
    if (currentPassager?.qrCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, currentPassager.qrCode, {
        width: 150,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    }
  }, [currentPassager, currentTicketIndex]);

  // Calcul du prix unitaire
  const getPrixUnitaire = () => {
    if (currentPassager?.prix) return currentPassager.prix;
    const prixTotal = paiementData?.montant || confirmationData?.prixTotal || 0;
    const nbPassagers = tousLesPassagers.length || 1;
    return prixTotal / nbPassagers;
  };
  
  const prixUnitaire = getPrixUnitaire();
  
  const nextTicket = () => {
    if (tousLesPassagers.length > 1) {
      setCurrentTicketIndex((prev) => (prev + 1) % tousLesPassagers.length);
    }
  };
  
  const prevTicket = () => {
    if (tousLesPassagers.length > 1) {
      setCurrentTicketIndex((prev) => (prev - 1 + tousLesPassagers.length) % tousLesPassagers.length);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 space-y-6">

          {/* Message de succès */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-green-700">Paiement réussi !</h1>
            <p className="text-green-600 text-sm mt-1">Votre réservation est confirmée</p>
          </motion.div>

          {/* Navigation entre tickets (si plusieurs passagers) */}
          {tousLesPassagers.length > 1 && (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={prevTicket}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center">
                <span className="text-sm text-gray-500">
                  Ticket {currentTicketIndex + 1} sur {tousLesPassagers.length}
                </span>
                <div className="flex gap-1 justify-center mt-1">
                  {tousLesPassagers.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTicketIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentTicketIndex ? 'bg-orange-500 w-4' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={nextTicket}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Ticket pour le passager actuel */}
          <motion.div
            key={currentTicketIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg"
          >
            {/* En-tête du ticket */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/80 text-xs">Billet électronique</p>
                  <p className="text-white font-bold text-sm">Réservation #{confirmationData?.reservationId || reservationId}</p>
                </div>
                <Ticket className="w-8 h-8 text-white/80" />
              </div>
            </div>

            {/* Corps du ticket */}
            <div className="p-5 space-y-4">
              {/* Trajet */}
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">Départ</p>
                  <p className="text-lg font-bold text-gray-800">{trajetInfo?.villeDepart || '?'}</p>
                  <p className="text-sm text-gray-600">{trajetInfo?.dateDepart && formatTime(trajetInfo.dateDepart)}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-center gap-1">
                    <div className="h-px bg-gray-300 flex-1" />
                    <span className="text-xs text-gray-400">→</span>
                    <div className="h-px bg-gray-300 flex-1" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{trajetInfo?.duree || 'Direct'}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">Arrivée</p>
                  <p className="text-lg font-bold text-gray-800">{trajetInfo?.villeArrivee || '?'}</p>
                  <p className="text-sm text-gray-600">{trajetInfo?.dateArriveePrevue ? formatTime(trajetInfo.dateArriveePrevue) : 'N/A'}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Date</span>
                <span className="text-sm font-medium text-gray-800 ml-auto">
                  {trajetInfo?.dateDepart ? formatDate(trajetInfo.dateDepart) : 'N/A'}
                </span>
              </div>

              {/* Passager */}
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Passager</span>
                <span className="text-sm font-medium text-gray-800 ml-auto">
                  {currentPassager?.prenomPassager} {currentPassager?.nomPassager}
                </span>
              </div>

              {/* Siège */}
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Siège</span>
                <span className="text-sm font-bold text-orange-600 ml-auto">{currentPassager?.numeroSiege || 'N/A'}</span>
              </div>

              {/* Compagnie */}
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Compagnie</span>
                <span className="text-sm font-medium text-gray-800 ml-auto">{trajetInfo?.compagnieNom || 'N/A'}</span>
              </div>

              {/* Bus */}
              <div className="flex items-center gap-3">
                <Bus className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Bus</span>
                <span className="text-sm font-medium text-gray-800 ml-auto">{trajetInfo?.busMatricule || 'N/A'}</span>
              </div>

              {/* Quai */}
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600">Quai</span>
                <span className="text-sm font-medium text-gray-800 ml-auto">
                  {trajetInfo?.quaiNumero ? `Quai ${trajetInfo.quaiNumero}` : 'N/A'}
                </span>
              </div>

              {/* Prix */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <CreditCard className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-gray-800">Prix du billet</span>
                <span className="text-lg font-black text-orange-500 ml-auto">
                  {Math.round(prixUnitaire).toLocaleString()} MAD
                </span>
              </div>

              {/* Bagages (si existants sur la réservation) */}
              {confirmationData?.bagages && confirmationData.bagages.length > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">Bagages liés à la réservation</span>
                  <span className="text-sm font-medium text-gray-800 ml-auto">
                    {confirmationData.bagages.length} bagage(s)
                  </span>
                </div>
              )}

              {/* Vrai QR Code */}
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-center">
                <div className="flex flex-col items-center justify-center">
                  <canvas ref={qrCanvasRef} className="mx-auto" />
                  <p className="text-xs text-gray-400 mt-2 font-mono break-all">
                    {currentPassager?.qrCode || 'XXXX-XXXX-XXXX'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer du ticket */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Présentez-vous 30 minutes avant le départ
              </p>
            </div>
          </motion.div>

          {/* Récapitulatif du paiement et bagages */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            >
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                Récapitulatif du paiement
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total payé</span>
                  <span className="font-bold text-gray-800">{paiementData?.montant?.toLocaleString() || 0} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Méthode</span>
                  <span className="font-medium text-gray-800">{paiementData?.methodePaiement || 'CARTE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction</span>
                  <span className="text-xs font-mono text-gray-500 break-all max-w-[200px] text-right">
                    {paiementData?.transactionId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-sm text-gray-600">
                    {paiementData?.datePaiement ? new Date(paiementData.datePaiement).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Nombre de billets</span>
                  <span className="font-medium text-gray-800">{tousLesPassagers.length}</span>
                </div>
              </div>
            </motion.div>

            {/* Récapitulatif Bagages */}
            {confirmationData?.bagages && confirmationData.bagages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-orange-50/50 rounded-2xl border border-orange-100 p-5 shadow-sm"
              >
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-orange-500" />
                  Bagages déclarés
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="text-xs text-gray-500 mb-2">Ces bagages sont associés à votre réservation. Présentez-vous au chauffeur pour qu'il les étiquette (QR Code généré au dépôt).</p>
                  {confirmationData.bagages.map((b: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-1 pb-2 border-b border-orange-100 last:border-0 last:pb-0">
                      <div className="flex justify-between font-medium text-gray-800">
                        <span>Bagage {idx + 1} ({b.typeBagage || 'STANDARD'})</span>
                        <span className={b.surplusPrix > 0 ? "text-orange-600" : "text-green-600"}>
                          {b.surplusPrix > 0 ? `+${b.surplusPrix} DH` : 'Gratuit'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Poids: {b.poidsKg} kg</span>
                        <span>Dimensions: {b.dimensionCm}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-blue-50 rounded-xl p-4 text-center"
          >
            <p className="text-sm text-blue-700">
              📧 Un email de confirmation vous a été envoyé avec vos tickets.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Présentez-vous à la gare 30 minutes avant le départ.
            </p>
          </motion.div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pb-8">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition"
            >
              <Printer size={16} /> Imprimer
            </button>
            <button
              onClick={() => router.push(`/fr/voyageur/dashboard`)}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-orange-200"
            >
              <Home size={16} /> Mes voyages
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
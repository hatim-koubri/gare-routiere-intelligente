'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Home, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedTicket } from '@/components/ui/ticket-confirmation-card';

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

export default function ConfirmationPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string ?? 'fr';
  const reservationId = searchParams.get('reservationId');

  const [paiementData, setPaiementData] = useState<TicketData | null>(null);
  const [reservationTemp, setReservationTemp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedPaiement = sessionStorage.getItem('paiement_response');
    const storedTemp = sessionStorage.getItem('reservation_data_backup');

    if (storedPaiement) setPaiementData(JSON.parse(storedPaiement));
    if (storedTemp) setReservationTemp(JSON.parse(storedTemp));
    setLoading(false);
  }, []);

  const handlePrint = () => window.print();

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

  const trajetInfo = reservationTemp || {};

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-lg mx-auto px-4 space-y-6">

          {/* Ticket animé */}
          <div className="flex justify-center">
            <AnimatedTicket
              ticketId={reservationId || 'N/A'}
              amount={paiementData?.montant || 0}
              date={paiementData?.datePaiement ? new Date(paiementData.datePaiement) : new Date()}
              cardHolder={`${user?.prenom || ''} ${user?.nom || ''}`}
              last4Digits={paiementData?.transactionId?.slice(-4) || '0000'}
              barcodeValue={paiementData?.transactionId || 'N/A'}
              showAnimation={true}
            />
          </div>

          {/* Infos supplémentaires */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Réservation</span>
              <span className="font-bold text-gray-800">#{reservationId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Trajet</span>
              <span className="font-medium text-gray-800">
                {trajetInfo.villeDepart || '?'} → {trajetInfo.villeArrivee || '?'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Méthode</span>
              <span className="font-medium text-gray-800">{paiementData?.methodePaiement || 'CARTE'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{user?.email}</span>
            </div>
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
              onClick={() => router.push(`/${locale}/recherche`)}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-orange-200"
            >
              <Home size={16} /> Accueil
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
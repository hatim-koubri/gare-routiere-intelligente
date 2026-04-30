'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { paiementApi } from '@/lib/api/voyageur/paiement';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CreditCard, Lock, ChevronLeft, Wallet, ShieldCheck, Clock } from 'lucide-react';
import { SignaturePadComponent } from '@/components/ui/signature-pad';
import { SlideButton } from '@/components/ui/slide-button';

export default function PaiementPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string ?? 'fr';
  const reservationId = searchParams.get('reservationId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [methode, setMethode] = useState<'CARTE' | 'PAYPAL'>('CARTE');
  const [prixTotal, setPrixTotal] = useState<number | null>(null);
  const [nbPassagers, setNbPassagers] = useState<number>(1);
  const [countdown, setCountdown] = useState(600);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    console.log('=== PAGE PAIEMENT CHARGÉE ===');
    console.log('reservationId depuis URL:', reservationId);
    
    const storedPrix = sessionStorage.getItem('prix_total');
    const storedNbPassagers = sessionStorage.getItem('nb_passagers');
    const storedReservationId = sessionStorage.getItem('reservation_id');
    
    console.log('prix_total stocké:', storedPrix);
    console.log('nb_passagers stocké:', storedNbPassagers);
    console.log('reservation_id stocké:', storedReservationId);
    
    if (storedPrix) {
      setPrixTotal(parseFloat(storedPrix));
    }
    
    if (storedNbPassagers) {
      setNbPassagers(parseInt(storedNbPassagers));
    }
    
    if (!reservationId) {
      console.warn('Aucun reservationId, redirection vers recherche');
      router.push(`/${locale}/recherche`);
      return;
    }
    
    if (!storedPrix) {
      console.warn('Aucun prix_total, tentative de récupération depuis l\'API');
      fetchPrixDepuisAPI(parseInt(reservationId));
    }
    
    setDataLoaded(true);
  }, [reservationId, locale, router]);

  const fetchPrixDepuisAPI = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/voyageur/reservations/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      if (data.prixTotal) {
        setPrixTotal(data.prixTotal);
        sessionStorage.setItem('prix_total', data.prixTotal.toString());
      }
    } catch (error) {
      console.error('Erreur récupération prix:', error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          router.push(`/${locale}/recherche`);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [locale, router]);

  const formatCountdown = () => {
    const min = Math.floor(countdown / 60).toString().padStart(2, '0');
    const sec = (countdown % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handlePaiement = async () => {
    if (!reservationId) {
      setError('ID de réservation manquant');
      return;
    }
    
    if (!isSigned) {
      setError('Veuillez signer pour accepter les conditions');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const requestData = {
        reservationId: parseInt(reservationId),
        methodePaiement: methode,
      };
      console.log('Requête envoyée:', requestData);
      
      const response = await paiementApi.simuler(requestData);
      console.log('Réponse backend:', response);
      
      if (response.confirme || response.statutReservation === 'CONFIRMEE') {
        console.log('✅ Paiement réussi !');
        sessionStorage.setItem('paiement_response', JSON.stringify(response));
        sessionStorage.removeItem('prix_total');
        sessionStorage.removeItem('reservation_id');
        sessionStorage.removeItem('nb_passagers');
        router.push(`/${locale}/confirmation?reservationId=${reservationId}`);
      } else {
        setError('Le paiement a échoué. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Erreur paiement:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du paiement';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!dataLoaded || prixTotal === null) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
            <p className="text-gray-500 text-sm">Chargement de votre paiement...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-lg mx-auto px-4 space-y-5">

          {/* Étapes */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
              <span className="text-gray-400 hidden sm:block">Passagers</span>
            </div>
            <div className="h-px bg-green-300 flex-1" />
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
              <span className="text-gray-400 hidden sm:block">Sièges</span>
            </div>
            <div className="h-px bg-orange-300 flex-1" />
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span className="font-semibold text-orange-600 hidden sm:block">Paiement</span>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
            ${countdown < 120 ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            <Clock size={16} />
            <span>Sièges réservés pour encore</span>
            <span className="font-black tabular-nums ml-auto">{formatCountdown()}</span>
          </div>

          <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
            <ChevronLeft size={16} /> Retour
          </button>

          {/* Récapitulatif */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Récapitulatif de commande</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Réservation #{reservationId}</span>
                <span className="font-medium">{nbPassagers} passager(s)</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-800">Total à payer</span>
                <span className="text-2xl font-black text-orange-500">{prixTotal} DH</span>
              </div>
            </div>
          </div>

          {/* Méthodes de paiement */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Choisissez votre méthode</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethode('CARTE')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${methode === 'CARTE' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <CreditCard size={24} className={methode === 'CARTE' ? 'text-orange-500' : 'text-gray-400'} />
                <p className={`font-bold text-sm ${methode === 'CARTE' ? 'text-orange-600' : 'text-gray-600'}`}>Carte bancaire</p>
                <p className="text-xs text-gray-400">Visa • Mastercard</p>
                {methode === 'CARTE' && <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
              </button>

              <button
                onClick={() => setMethode('PAYPAL')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${methode === 'PAYPAL' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Wallet size={24} className={methode === 'PAYPAL' ? 'text-orange-500' : 'text-gray-400'} />
                <p className={`font-bold text-sm ${methode === 'PAYPAL' ? 'text-orange-600' : 'text-gray-600'}`}>PayPal</p>
                <p className="text-xs text-gray-400">Paiement en ligne</p>
                {methode === 'PAYPAL' && <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
              </button>
            </div>
          </div>

          {/* Formulaire carte */}
          {methode === 'CARTE' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Informations de carte</h2>
              <div className="relative">
                <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Numéro de carte" className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none text-sm font-medium" defaultValue="4111 1111 1111 1111" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="MM/AA" className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none text-sm font-medium" defaultValue="12/28" />
                <input type="text" placeholder="CVV" className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none text-sm font-medium" defaultValue="123" />
              </div>
              <input type="text" placeholder="Nom du titulaire" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none text-sm font-medium" defaultValue={`${user?.nom || ''} ${user?.prenom || ''}`} />
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1"><ShieldCheck size={14} className="text-green-500" /><span>Vos données sont chiffrées et sécurisées</span></div>
            </div>
          )}

          {methode === 'PAYPAL' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <Wallet size={40} className="mx-auto text-orange-400 mb-3" />
              <p className="text-sm text-gray-600 font-medium">Vous serez redirigé vers PayPal pour finaliser le paiement</p>
              <p className="text-xs text-gray-400 mt-1">Simulation — aucune redirection réelle</p>
            </div>
          )}

          {/* Signature électronique */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-500 text-sm">✍️</span>
              </div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Conditions de vente
              </h2>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2">
              <p>En signant électroniquement, j'accepte les conditions générales de vente et reconnais avoir pris connaissance des informations relatives au voyage.</p>
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck size={14} />
                <span>Paiement sécurisé - Conformité RGPD</span>
              </div>
            </div>
            
            <SignaturePadComponent onSign={setIsSigned} />
            
            {!isSigned && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                ⚠️ La signature est requise pour valider le paiement
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          {/* Bouton de paiement glissé */}
          <div className="pt-2 pb-6">
            <SlideButton 
              onSuccess={handlePaiement}
              disabled={!isSigned}
              buttonText={isSigned ? "Glissez pour payer" : "Veuillez signer d'abord"}
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pb-6">
            <span className="flex items-center gap-1">🔒 SSL 256-bit</span><span>•</span>
            <span className="flex items-center gap-1">✅ Paiement sécurisé</span><span>•</span>
            <span className="flex items-center gap-1">💳 PCI DSS</span>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
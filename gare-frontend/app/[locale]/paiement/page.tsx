// app/[locale]/paiement/page.tsx - Version corrigée
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { paiementApi } from '@/lib/api/voyageur/paiement';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CreditCard, Lock, ChevronLeft, Wallet, ShieldCheck, Clock, FileText, ExternalLink, CheckCircle, Receipt } from 'lucide-react';
import { SlideButton } from '@/components/ui/slide-button';
import { CreditCardForm, type CardState, type CardValidity } from '@/components/ui/credit-card-form';

export default function PaiementPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = 'fr';
  const reservationId = searchParams.get('reservationId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [methode, setMethode] = useState<'CARTE' | 'PAYPAL'>('CARTE');
  const [prixTotal, setPrixTotal] = useState<number | null>(null);
  const [nbPassagers, setNbPassagers] = useState<number>(1);
  const [countdown, setCountdown] = useState(600);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [showCgvModal, setShowCgvModal] = useState(false);
  const [cardValid, setCardValid] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [trajetInfo, setTrajetInfo] = useState<any>(null);
  const [reservationInfo, setReservationInfo] = useState<any>(null);
  
  // Utiliser useRef pour éviter les rendus infinis
  const countdownRef = useRef(countdown);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Éviter les appels de setState pendant le rendu
  const handleCardChange = useCallback((state: CardState, validity: CardValidity) => {
    setCardValid(validity.allValid);
  }, []);

  useEffect(() => {
    console.log('=== PAGE PAIEMENT CHARGÉE ===');
    console.log('reservationId depuis URL:', reservationId);
    
    const storedPrix = sessionStorage.getItem('prix_total');
    const storedNbPassagers = sessionStorage.getItem('nb_passagers');
    const storedReservation = sessionStorage.getItem('reservation_info');
    
    if (storedPrix) setPrixTotal(parseFloat(storedPrix));
    if (storedNbPassagers) setNbPassagers(parseInt(storedNbPassagers));
    if (storedReservation) {
      const parsed = JSON.parse(storedReservation);
      setReservationInfo(parsed);
      setTrajetInfo(parsed.trajet);
    }
    
    if (!reservationId) {
      router.push(`/fr/recherche`);
      return;
    }
    
    if (!storedPrix) {
      fetchPrixDepuisAPI(parseInt(reservationId));
    }
    
    if (!storedReservation) {
      fetchTrajetInfo(parseInt(reservationId));
    }
    
    setDataLoaded(true);
  }, [reservationId, locale, router]);

  const fetchPrixDepuisAPI = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/voyageur/reservations/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
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

  const fetchTrajetInfo = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/voyageur/reservations/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      if (data) {
        setReservationInfo(data);
        setTrajetInfo(data.trajet);
        sessionStorage.setItem('reservation_info', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Erreur récupération trajet:', error);
    }
  };

  // Gérer le countdown avec useRef pour éviter les rendus infinis
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      countdownRef.current = countdownRef.current - 1;
      setCountdown(countdownRef.current);
      
      if (countdownRef.current <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        router.push(`/fr/recherche`);
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [locale, router]);

  const formatCountdown = () => {
    const min = Math.floor(countdown / 60).toString().padStart(2, '0');
    const sec = (countdown % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handleOpenReview = () => {
    if (!acceptConditions) {
      setError('Veuillez accepter les conditions générales de vente');
      return;
    }
    
    if (!cardValid && methode === 'CARTE') {
      setError('Veuillez remplir correctement les informations de la carte');
      return;
    }
    
    setError('');
    setShowReviewModal(true);
  };

  const handleConfirmPaiement = async () => {
    setShowReviewModal(false);
    setLoading(true);
    setError('');
    
    try {
      const requestData = {
        reservationId: parseInt(reservationId!),
        methodePaiement: methode,
      };
      
      const response = await paiementApi.simuler(requestData);
      
      if (response.confirme || response.statutReservation === 'CONFIRMEE') {
        sessionStorage.setItem('paiement_response', JSON.stringify(response));
        sessionStorage.removeItem('prix_total');
        sessionStorage.removeItem('reservation_id');
        sessionStorage.removeItem('nb_passagers');
        sessionStorage.removeItem('trajet_info');
        router.push(`/fr/confirmation?reservationId=${reservationId}`);
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
        <div className="max-w-5xl mx-auto px-4 space-y-5">

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

          {/* Formulaire carte avec CreditCardForm */}
          {methode === 'CARTE' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Informations de carte</h2>
              <CreditCardForm
                defaultHolder={`${user?.prenom || 'JEAN'} ${user?.nom || 'DUPONT'}`}
                maskMiddle={true}
                ring1="#f97316"
                ring2="#ea580c"
                onChange={handleCardChange}
              />
            </div>
          )}

          {methode === 'PAYPAL' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <Wallet size={40} className="mx-auto text-orange-400 mb-3" />
              <p className="text-sm text-gray-600 font-medium">Vous serez redirigé vers PayPal pour finaliser le paiement</p>
              <p className="text-xs text-gray-400 mt-1">Simulation — aucune redirection réelle</p>
            </div>
          )}

          {/* Checkbox Conditions Générales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText size={16} className="text-orange-500" />
              </div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Conditions de vente
              </h2>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-3">
              <p>En cochant cette case, j'accepte les 
                <button onClick={() => setShowCgvModal(true)} className="text-orange-500 font-medium hover:underline inline-flex items-center gap-1 mx-1">
                  conditions générales de vente <ExternalLink size={12} />
                </button> 
                et reconnais avoir pris connaissance des informations relatives au voyage.
              </p>
              
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck size={14} />
                <span>Paiement sécurisé - Conformité RGPD</span>
              </div>
            </div>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={acceptConditions}
                  onChange={(e) => setAcceptConditions(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                  ${acceptConditions 
                    ? 'bg-orange-500 border-orange-500' 
                    : 'border-gray-300 bg-white group-hover:border-orange-400'
                  }`}
                >
                  {acceptConditions && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  J'accepte les conditions générales de vente
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Obligatoire pour finaliser la réservation
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          {/* Bouton de paiement */}
          <div className="pt-2 pb-6">
            <SlideButton 
              onSuccess={handleOpenReview}
              disabled={!acceptConditions || (methode === 'CARTE' && !cardValid)}
              buttonText={acceptConditions && (methode !== 'CARTE' || cardValid) ? "Glissez pour vérifier" : "Acceptez les conditions et remplissez la carte"}
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pb-6">
            <span className="flex items-center gap-1">🔒 SSL 256-bit</span><span>•</span>
            <span className="flex items-center gap-1">✅ Paiement sécurisé</span><span>•</span>
            <span className="flex items-center gap-1">💳 PCI DSS</span>
          </div>

        </div>
      </main>

      {/* Modal de révision */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6" />
                <h2 className="text-xl font-bold">Révision de votre commande</h2>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-white/80 hover:text-white text-2xl">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-700">Vérifiez bien vos informations</p>
                  <p className="text-sm text-green-600">Avant de confirmer votre paiement</p>
                </div>
              </div>

              {trajetInfo && (
                <div className="border rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                    Détails du voyage
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-500">Trajet</p><p className="font-semibold">{trajetInfo.villeDepart} → {trajetInfo.villeArrivee}</p></div>
                    <div><p className="text-gray-500">Compagnie</p><p className="font-semibold">{trajetInfo.compagnieNom}</p></div>
                    <div><p className="text-gray-500">Date départ</p><p className="font-semibold">{new Date(trajetInfo.dateDepart).toLocaleDateString('fr-FR')}</p></div>
                    <div><p className="text-gray-500">Heure départ</p><p className="font-semibold">{new Date(trajetInfo.dateDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                  </div>
                </div>
              )}

              <div className="border rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  Passagers
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Nombre de passagers</span><span className="font-semibold">{nbPassagers}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Prix unitaire</span><span className="font-semibold">{trajetInfo?.prixBase} DH</span></div>
                </div>
              </div>

              {reservationInfo?.bagages && reservationInfo.bagages.length > 0 && (
                <div className="border rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                    Bagages
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Nombre de bagages</span><span className="font-semibold">{reservationInfo.bagages.length}</span></div>
                    {reservationInfo.bagages.map((b: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-1 mt-1">
                        <span>Bagage {idx + 1} ({b.typeBagage || 'STANDARD'})</span>
                        <span className={b.surplusPrix > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                          {b.surplusPrix > 0 ? `+${b.surplusPrix} DH` : 'Gratuit'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total à payer</span>
                  <span className="text-2xl font-black text-orange-500">{prixTotal} DH</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowReviewModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-medium">
                Retour
              </button>
              <button onClick={handleConfirmPaiement} disabled={loading} className="flex-1 bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2">
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <>Confirmer le paiement</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CGV */}
      {showCgvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCgvModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-bold">Conditions Générales de Vente</h2>
              <button onClick={() => setShowCgvModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-gray-600 text-sm">
              <h3 className="font-bold text-gray-800">1. Objet</h3>
              <p>Les présentes conditions générales de vente régissent les relations contractuelles entre la Gare Routière et ses clients dans le cadre de la réservation et de l'achat de billets de voyage.</p>
              <h3 className="font-bold text-gray-800">2. Réservation</h3>
              <p>La réservation est considérée comme ferme et définitive après validation du paiement. Un email de confirmation sera envoyé à l'adresse renseignée.</p>
              <h3 className="font-bold text-gray-800">3. Prix et paiement</h3>
              <p>Les prix affichés sont en Dirhams Marocain (MAD) toutes taxes comprises. Le paiement s'effectue en ligne par carte bancaire ou PayPal.</p>
              <h3 className="font-bold text-gray-800">8. Litiges</h3>
              <p>En cas de litige, une solution amiable sera recherchée avant toute procédure judiciaire.</p>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => { setAcceptConditions(true); setShowCgvModal(false); }} className="w-full bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 transition">
                J'accepte les conditions
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
}
'use client';

import { CreditCard, AlertCircle, Shield } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  description?: string;
  onSubmit: (data: PaymentData) => void;
  loading?: boolean;
  error?: string | null;
}

export interface PaymentData {
  numeroCarte: string;
  dateExpiration: string;
  cvv: string;
  nomTitulaire: string;
}

export function PaymentForm({
  amount,
  description,
  onSubmit,
  loading = false,
  error = null,
}: PaymentFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const numeroCarte = (formData.get('numeroCarte') as string || '').replace(/\s/g, '');
    const dateExpiration = formData.get('dateExpiration') as string || '';
    const cvv = formData.get('cvv') as string || '';
    const nomTitulaire = formData.get('nomTitulaire') as string || '';

    // Validations simples
    if (numeroCarte.length < 13 || numeroCarte.length > 19) {
      alert('Numéro de carte invalide');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(dateExpiration)) {
      alert('Format de date invalide (MM/YY)');
      return;
    }
    if (cvv.length < 3 || cvv.length > 4) {
      alert('CVV invalide');
      return;
    }
    if (!nomTitulaire.trim()) {
      alert('Veuillez entrer le nom du titulaire');
      return;
    }

    onSubmit({ numeroCarte, dateExpiration, cvv, nomTitulaire });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Info sécurité */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-blue-700 text-xs">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Votre paiement est sécurisé avec le chiffrement SSL 256-bit</p>
      </div>

      {/* Nom du titulaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom du titulaire
        </label>
        <input
          type="text"
          name="nomTitulaire"
          placeholder="JEAN DUPONT"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Numéro de carte */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <CreditCard className="w-4 h-4 inline mr-1" />
          Numéro de carte
        </label>
        <input
          type="text"
          name="numeroCarte"
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex acceptées</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Date d'expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration
          </label>
          <input
            type="text"
            name="dateExpiration"
            placeholder="MM/YY"
            maxLength={5}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* CVV */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            name="cvv"
            placeholder="123"
            maxLength={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Montant */}
      {description && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
        <p className="text-2xl font-bold text-blue-600">{amount} MAD</p>
      </div>

      {/* Bouton submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Payer {amount} MAD
          </>
        )}
      </button>
    </form>
  );
}

'use client';

import { Info, Percent, Baby, GraduationCap, Shield, User } from 'lucide-react';

interface SimulationTarifaireProps {
  prixBase: number;
  nombrePassagers: number;
  categories: {
    type: 'NORMAL' | 'ETUDIANT' | 'ENFANT' | 'MILITAIRE' | 'SENIOR';
    label: string;
    quantite: number;
    reduction: number;
    enfantSurGenoux?: boolean;
  }[];
  codePromo?: { code: string; reduction: number } | null;
  supplements?: { label: string; montant: number }[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  ETUDIANT: GraduationCap,
  ENFANT: Baby,
  MILITAIRE: Shield,
  SENIOR: User,
  NORMAL: User,
};

export function SimulationTarifaire({
  prixBase,
  nombrePassagers,
  categories,
  codePromo,
  supplements = [],
}: SimulationTarifaireProps) {
  const enfantsSurGenoux = categories.filter(c => c.enfantSurGenoux).reduce((s, c) => s + c.quantite, 0);
  const totalAvantReduction = categories.reduce((sum, c) => sum + (c.enfantSurGenoux ? 0 : prixBase * c.quantite), 0);
  const reductions = categories.reduce((sum, c) => sum + (c.enfantSurGenoux ? 0 : prixBase * c.quantite * (c.reduction / 100)), 0);
  const totalSupplements = supplements.reduce((s, sup) => s + sup.montant, 0);
  const promoReduction = codePromo ? (totalAvantReduction - reductions) * (codePromo.reduction / 100) : 0;
  const totalFinal = totalAvantReduction - reductions - promoReduction + totalSupplements;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Info size={20} className="text-violet-500" />
        Simulation tarifaire
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Prix unitaire</span>
          <span className="font-medium">{prixBase.toFixed(0)} DH</span>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Détail par passager</p>
          {categories.map((cat, idx) => {
            const Icon = CATEGORY_ICONS[cat.type] || User;
            const montant = cat.enfantSurGenoux ? 0 : prixBase * cat.quantite;
            return (
              <div key={idx} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {cat.label} {cat.quantite > 1 ? `x${cat.quantite}` : ''}
                  </span>
                  {cat.enfantSurGenoux && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      Gratuit
                    </span>
                  )}
                  {!cat.enfantSurGenoux && cat.reduction > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      -{cat.reduction}%
                    </span>
                  )}
                </div>
                <span className="text-sm">{montant.toFixed(0)} DH</span>
              </div>
            );
          })}
        </div>

        {reductions > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              <Percent size={14} /> Réductions catégorielles
            </span>
            <span className="font-medium">-{reductions.toFixed(0)} DH</span>
          </div>
        )}

        {totalSupplements > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Suppléments</p>
            {supplements.map((sup, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{sup.label}</span>
                <span className="font-medium text-orange-600">+{sup.montant.toFixed(0)} DH</span>
              </div>
            ))}
          </div>
        )}

        {codePromo && (
          <div className="flex justify-between text-sm text-violet-600 bg-violet-50 -mx-6 px-6 py-2">
            <span className="flex items-center gap-1 font-medium">
              <Percent size={14} /> Code promo {codePromo.code}
            </span>
            <span className="font-bold">-{promoReduction.toFixed(0)} DH</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-800">Total</span>
            <span className="text-xl font-black text-violet-600">{totalFinal.toFixed(0)} DH</span>
          </div>
          {enfantsSurGenoux > 0 && (
            <p className="text-xs text-emerald-600 mt-1">👶 {enfantsSurGenoux} enfant(s) sur genoux gratuit(s)</p>
          )}
          <p className="text-xs text-gray-400 mt-1 text-right">Pour {nombrePassagers} passager{nombrePassagers > 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}

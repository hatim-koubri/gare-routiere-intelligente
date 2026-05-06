// components/ui/credit-debit-card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface FlippableCreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

const FlippableCreditCard = React.forwardRef<HTMLDivElement, FlippableCreditCardProps>(
  ({ className, cardholderName, cardNumber, expiryDate, cvv, ...props }, ref) => {
    return (
      <div
        className={cn("group h-48 w-80 [perspective:1000px]", className)}
        ref={ref}
        {...props}
      >
        <div className="relative h-full w-full rounded-xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
          
          {/* CARD FRONT */}
          <div className="absolute h-full w-full rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-white [backface-visibility:hidden]">
            <div className="relative flex h-full flex-col justify-between p-5">
              {/* Logo et type de carte */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="1" fill="none" />
                    <circle cx="17" cy="12" r="2" fill="white" />
                  </svg>
                </div>
                <p className="font-bold tracking-wider text-sm text-white/80">MASTERCARD</p>
              </div>
              
              {/* Puce électronique */}
              <div className="mt-2">
                <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md" />
              </div>
              
              {/* Numéro de carte */}
              <div className="text-center font-mono text-xl tracking-wider">
                {cardNumber}
              </div>

              {/* Footer */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-white/60">Titulaire</p>
                  <p className="font-mono text-sm font-medium uppercase">{cardholderName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-white/60">Valable jusqu'à</p>
                  <p className="font-mono text-sm font-medium">{expiryDate}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* CARD BACK */}
          <div className="absolute h-full w-full rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col">
              {/* Bande magnétique */}
              <div className="mt-6 h-10 w-full bg-neutral-800" />
              
              {/* CVV */}
              <div className="mx-4 mt-4">
                <div className="flex h-10 w-full items-center justify-end rounded-md bg-neutral-200 px-4">
                  <p className="font-mono text-sm text-gray-900">{cvv}</p>
                </div>
                <p className="mt-1 text-right text-xs font-semibold uppercase text-white/60">CVV</p>
              </div>

              {/* Logo */}
              <div className="mt-auto p-4 text-right">
                <svg className="h-10 w-10 ml-auto" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#f97316" />
                  <circle cx="24" cy="24" r="14" fill="white" fillOpacity="0.2" />
                  <text x="24" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">●</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FlippableCreditCard.displayName = "FlippableCreditCard";

export { FlippableCreditCard };
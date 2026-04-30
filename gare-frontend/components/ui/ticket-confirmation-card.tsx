import * as React from "react";
import { cn } from "@/lib/utils";

// --- SVG Icons ---

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const BusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 6v6" />
    <path d="M15 6v6" />
    <path d="M2 12h19.6" />
    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
    <circle cx="7" cy="18" r="2" />
    <path d="M9 18h5" />
    <circle cx="16" cy="18" r="2" />
  </svg>
);

const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SeatIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6H5Z" />
    <path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    <path d="M5 17h14" />
  </svg>
);

const MastercardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="36"
    height="24"
  >
    <circle cx="8" cy="12" r="7" fill="#EA001B" />
    <circle cx="16" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8" />
  </svg>
);

// --- Helper Components ---

const DashedLine = () => (
  <div className="w-full border-t-2 border-dashed border-border" aria-hidden="true" />
);

const Barcode = ({ value }: { value: string }) => {
  const hashCode = (s: string) => s.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  const seed = hashCode(value);
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const bars = Array.from({ length: 60 }).map((_, index) => {
    const rand = random(seed + index);
    const width = rand > 0.7 ? 2.5 : 1.5;
    return { width };
  });

  const spacing = 1.5;
  const totalWidth = bars.reduce((acc, bar) => acc + bar.width + spacing, 0) - spacing;
  const svgWidth = 250;
  const svgHeight = 70;
  let currentX = (svgWidth - totalWidth) / 2;

  return (
    <div className="flex flex-col items-center py-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-label={`Barcode for value ${value}`}
        className="fill-current text-foreground"
      >
        {bars.map((bar, index) => {
          const x = currentX;
          currentX += bar.width + spacing;
          return <rect key={index} x={x} y="10" width={bar.width} height="50" />;
        })}
      </svg>
      <p className="text-sm text-muted-foreground tracking-[0.3em] mt-2">{value}</p>
    </div>
  );
};

const ConfettiExplosion = () => {
  const confettiCount = 80;
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#f97316"];

  return (
    <>
      <style>
        {`
          @keyframes fall {
            0% {
              transform: translateY(-10vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(110vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-4"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 + Math.random() * 10}%`,
              backgroundColor: colors[i % colors.length],
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `fall ${2 + Math.random() * 2}s ${Math.random() * 2}s linear forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
};

// --- Main Ticket Component ---

export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> {
  ticketId: string;
  amount: number;
  date: Date;
  cardHolder: string;
  last4Digits: string;
  barcodeValue: string;
  // Nouvelles props pour les infos trajet
  villeDepart?: string;
  villeArrivee?: string;
  dateDepart?: string;
  heureDepart?: string;
  compagnie?: string;
  siege?: string;
  passagerName?: string;
  passengerCount?: number;
  showAnimation?: boolean;
}

const AnimatedTicket = React.forwardRef<HTMLDivElement, TicketProps>(
  (
    {
      className,
      ticketId,
      amount,
      date,
      cardHolder,
      last4Digits,
      barcodeValue,
      villeDepart = "Casablanca",
      villeArrivee = "Marrakech",
      dateDepart = "",
      heureDepart = "",
      compagnie = "Gare Routière",
      siege = "12A",
      passagerName = "",
      passengerCount = 1,
      showAnimation = true,
      ...props
    },
    ref
  ) => {
    const [showConfetti, setShowConfetti] = React.useState(false);

    React.useEffect(() => {
      if (showAnimation) {
        const mountTimer = setTimeout(() => setShowConfetti(true), 100);
        const unmountTimer = setTimeout(() => setShowConfetti(false), 6000);
        return () => {
          clearTimeout(mountTimer);
          clearTimeout(unmountTimer);
        };
      }
    }, [showAnimation]);

    const formattedAmount = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
    }).format(amount);

    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(',', ' • ');

    const formattedDateDepart = dateDepart
      ? new Date(dateDepart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'N/A';

    const formattedHeureDepart = heureDepart || (dateDepart ? new Date(dateDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A');

    return (
      <>
        {showConfetti && <ConfettiExplosion />}
        <div
          ref={ref}
          className={cn(
            "relative w-full max-w-sm bg-gradient-to-br from-orange-50 to-white text-gray-800 rounded-2xl shadow-xl font-sans z-10",
            "animate-in slide-in-from-top duration-500",
            className
          )}
          {...props}
        >
          {/* Ticket cut-out effect */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 shadow-inner" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-50 shadow-inner" />

          {/* Header */}
          <div className="p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-orange-100 rounded-full animate-in zoom-in-50 delay-300 duration-500">
              <CheckCircleIcon className="w-10 h-10 text-orange-500 animate-in zoom-in-75 delay-500 duration-500" />
            </div>
            <h1 className="text-2xl font-bold mt-4 text-gray-800">Merci !</h1>
            <p className="text-gray-500 mt-1">Votre billet a été émis avec succès</p>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <DashedLine />

            {/* Infos trajet */}
            <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BusIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{compagnie}</span>
                </div>
                <span className="text-xs text-gray-400">Billet numérique</span>
              </div>

              {/* Ville départ/arrivée */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xl font-black text-gray-800">{villeDepart.substring(0, 3).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{villeDepart}</p>
                </div>
                <div className="flex-1 flex flex-col items-center px-4">
                  <div className="w-full flex items-center gap-1">
                    <div className="h-px bg-gray-300 flex-1" />
                    <span className="text-orange-500 text-xs">→</span>
                    <div className="h-px bg-gray-300 flex-1" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Direct</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-gray-800">{villeArrivee.substring(0, 3).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{villeArrivee}</p>
                </div>
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Date</p>
                    <p className="text-xs font-medium text-gray-700">{formattedDateDepart}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Heure</p>
                    <p className="text-xs font-medium text-gray-700">{formattedHeureDepart}</p>
                  </div>
                </div>
              </div>
            </div>

            <DashedLine />

            {/* Passager et siège */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Passager</p>
                <p className="font-bold text-gray-800 text-sm">{passagerName || cardHolder}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <SeatIcon className="w-3 h-3 text-orange-500" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Siège</p>
                </div>
                <p className="font-black text-xl text-orange-600">{siege}</p>
              </div>
            </div>

            {/* Prix et paiement */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Montant</p>
                  <p className="font-bold text-lg text-orange-600">{formattedAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Transaction</p>
                  <p className="font-mono text-[10px] text-gray-500">{barcodeValue.substring(0, 16)}...</p>
                </div>
              </div>
            </div>

            <DashedLine />

            {/* Barcode */}
            <Barcode value={barcodeValue} />

            {/* Footer */}
            <p className="text-center text-[10px] text-gray-400">
              Présentez ce QR code au chauffeur avant l'embarquement
            </p>
          </div>
        </div>
      </>
    );
  }
);

AnimatedTicket.displayName = "AnimatedTicket";

export { AnimatedTicket };
// components/ui/ticket-confirmation-card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

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

const MastercardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="36"
        height="24"
    >
        <circle cx="8" cy="12" r="7" fill="#EA001B"></circle>
        <circle cx="16" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8"></circle>
    </svg>
);


// --- Helper Components ---

const DashedLine = () => (
  <div
    className="w-full border-t-2 border-dashed border-slate-200 dark:border-slate-800"
    aria-hidden="true"
  />
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
                className="fill-current text-slate-800 dark:text-slate-200"
            >
                {bars.map((bar, index) => {
                    const x = currentX;
                    currentX += bar.width + spacing;
                    return (
                        <rect
                            key={index}
                            x={x}
                            y="10"
                            width={bar.width}
                            height="50"
                        />
                    );
                })}
            </svg>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] mt-2 font-mono">{value}</p>
        </div>
    );
};

const ConfettiExplosion = () => {
  const confettiCount = 100;
  const colors = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#f97316"];

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
      <div className="fixed inset-0 z-[100] pointer-events-none" aria-hidden="true">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-4"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 + Math.random() * 10}%`,
              backgroundColor: colors[i % colors.length],
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `fall ${2.5 + Math.random() * 2.5}s ${Math.random() * 2}s linear forwards`,
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
  villeDepart?: string;
  villeArrivee?: string;
  numeroSiege?: string;
  compagnieNom?: string;
  quai?: string;
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
      villeDepart,
      villeArrivee,
      numeroSiege,
      compagnieNom,
      quai,
      ...props
    },
    ref
  ) => {
    const [showConfetti, setShowConfetti] = React.useState(false);

    React.useEffect(() => {
      const mountTimer = setTimeout(() => setShowConfetti(true), 100);
      const unmountTimer = setTimeout(() => setShowConfetti(false), 6000);
      return () => {
        clearTimeout(mountTimer);
        clearTimeout(unmountTimer);
      };
    }, []);

    const formattedAmount = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
    }).format(amount);

    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);

    return (
      <>
        {showConfetti && <ConfettiExplosion />}
        <div
          ref={ref}
          className={cn(
            "relative w-full max-w-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-[2.5rem] shadow-2xl font-sans z-10 border border-slate-100 dark:border-slate-800",
            "animate-in fade-in-0 zoom-in-95 duration-500",
            className
          )}
          {...props}
        >
          {/* Ticket cut-out effect */}
          <div className="absolute -left-4 top-[55%] -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
          <div className="absolute -right-4 top-[55%] -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800" />

          <div className="p-10 flex flex-col items-center text-center">
              <div className="p-4 bg-emerald-500/10 rounded-full animate-in zoom-in-50 delay-300 duration-500">
                  <CheckCircleIcon className="w-12 h-12 text-emerald-500 animate-in zoom-in-75 delay-500 duration-500" />
              </div>
              <h1 className="text-3xl font-black mt-6 uppercase italic tracking-tighter">Merci !</h1>
              <p className="text-slate-400 text-sm font-medium mt-2">
                Votre réservation a été confirmée avec succès
              </p>
          </div>

          <div className="px-10 pb-10 space-y-8">
              <DashedLine />

              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Trajet</p>
                      <p className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-xl leading-none">
                        {villeDepart} <span className="text-emerald-500">→</span> {villeArrivee}
                      </p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant</p>
                      <p className="font-black text-2xl text-emerald-500 italic tracking-tighter leading-none">{formattedAmount}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Heure</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{formattedDate}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Siège</p>
                      <p className="font-black text-xl text-emerald-500 italic leading-none">{numeroSiege}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Compagnie</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase">{compagnieNom}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quai</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase">NO. {quai}</p>
                  </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl flex items-center space-x-6 border border-slate-100 dark:border-slate-800">
                  <MastercardIcon className="w-12 h-12" />
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Titulaire</p>
                      <p className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{cardHolder}</p>
                      <p className="text-slate-400 font-mono text-xs tracking-widest mt-1">•••• {last4Digits}</p>
                  </div>
              </div>

              <DashedLine />

              <Barcode value={barcodeValue} />
          </div>
        </div>
      </>
    );
  }
);

AnimatedTicket.displayName = "AnimatedTicket";

export { AnimatedTicket };
// components/ui/flight-card.tsx
import * as React from "react";
import { motion } from "framer-motion";
import { Bus, Clock, MapPin, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlightCardProps {
  imageUrl?: string;
  airline: string;
  flightCode: string;
  flightClass?: string;
  departureCode: string;
  departureCity: string;
  departureTime: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  onSelect?: () => void;
  className?: string;
}

// Images aléatoires pour les bus
const busImages = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570125909232-263c3b7e1799?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519003722824-482d2a1b1f89?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
];

export const FlightCard = React.forwardRef<HTMLDivElement, FlightCardProps>(
  (
    {
      imageUrl,
      airline,
      flightCode,
      flightClass,
      departureCode,
      departureCity,
      departureTime,
      arrivalCode,
      arrivalCity,
      arrivalTime,
      duration,
      price,
      availableSeats,
      onSelect,
      className,
    },
    ref
  ) => {
    // Choisir une image aléatoire si non fournie
    const randomImage = React.useMemo(() => {
      if (imageUrl) return imageUrl;
      const randomIndex = Math.floor(Math.random() * busImages.length);
      return busImages[randomIndex];
    }, [imageUrl]);

    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, staggerChildren: 0.05 },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    const getSeatColor = () => {
      if (availableSeats > 10) return "text-green-600";
      if (availableSeats > 3) return "text-orange-500";
      return "text-red-500";
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "max-w-md w-full font-sans rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300",
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        onClick={onSelect}
      >
        {/* Image du bus */}
        <div className="relative h-36">
          <img
            src={randomImage}
            alt={airline}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-medium">
            {airline}
          </div>
        </div>

        {/* Détails du trajet */}
        <div className="p-5">
          {/* Route principale */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-gray-500">{departureTime}</p>
              <p className="text-2xl font-bold text-gray-800">{departureCode}</p>
              <p className="text-xs text-gray-500">{departureCity}</p>
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-gray-400">{flightCode}</p>
              <div className="flex items-center gap-2 my-1">
                <div className="h-px w-12 bg-gray-300" />
                <Bus className="h-4 w-4 text-orange-500" />
                <div className="h-px w-12 bg-gray-300" />
              </div>
              <p className="text-xs text-gray-500">{duration}</p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">{arrivalTime}</p>
              <p className="text-2xl font-bold text-gray-800">{arrivalCode}</p>
              <p className="text-xs text-gray-500">{arrivalCity}</p>
            </div>
          </motion.div>

          {/* Séparateur */}
          <motion.div variants={itemVariants} className="border-t border-dashed border-gray-200 my-4" />

          {/* Informations supplémentaires */}
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Prix</span>
              <span className="font-bold text-orange-500 text-lg">{price} MAD</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Places</span>
              <span className={`font-semibold ${getSeatColor()}`}>{availableSeats}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Classe</span>
              <span className="font-semibold text-gray-700">{flightClass || "Standard"}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md"
            >
              Choisir →
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }
);

FlightCard.displayName = "FlightCard";
'use client';
import { motion } from 'framer-motion';

export const PremiumLoader = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => {
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Outer Glow / Halo */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-md"
            />

            {/* 3D Rotating Ring */}
            <motion.svg
                viewBox="0 0 100 100"
                className="w-full h-full relative z-10"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <defs>
                    <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color === "currentColor" ? "white" : color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color === "currentColor" ? "white" : color} stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#loader-gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="180 60"
                />
            </motion.svg>
            
            {/* Inner Depth / Shadow */}
            <div className="absolute inset-2 rounded-full border border-black/5" />
        </div>
    );
};

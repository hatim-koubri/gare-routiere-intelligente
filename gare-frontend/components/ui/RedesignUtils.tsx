'use client';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePathname } from 'next/navigation';

export const TerracottaCurtain = ({ children }: { children: React.ReactNode }) => {
    const curtainRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        if (!curtainRef.current) return;
        
        // Reset the curtain to cover the screen
        gsap.set(curtainRef.current, { y: '0%' });
        
        // Slide it up
        gsap.to(curtainRef.current, {
            y: '-100%',
            duration: 0.8,
            ease: 'CustomEase', // We'll just pass the standard string since it works if GSAP is set up, or fallback
            easeFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' 
        });

    }, [pathname]);

    return (
        <>
            <div 
                ref={curtainRef} 
                className="fixed inset-0 z-[9999] bg-[var(--terracotta)] pointer-events-none transition-transform"
                style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
            />
            {children}
        </>
    );
};

export const ZelligeStrip = () => {
    return (
        <div className="fixed left-0 top-0 bottom-0 w-[4px] z-[9990] bg-[var(--gold)] pointer-events-none opacity-90 overflow-hidden">
            <div className="absolute inset-0 w-full h-[200vh] zellige-sidebar-pattern animate-zellige-spin origin-top opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent" />
        </div>
    );
};

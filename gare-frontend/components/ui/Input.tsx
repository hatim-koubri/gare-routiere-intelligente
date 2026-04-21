'use client';
import React, { InputHTMLAttributes, useState } from 'react';
import { motion } from 'framer-motion';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, value, ...props }, ref) => {
        const [focused, setFocused] = useState(false);
        const isActive = focused || (value && value.toString().length > 0);

        return (
            <div className={`relative w-full group ${className}`}>
                <div 
                    className={`
                        relative w-full rounded-xl transition-all duration-500 ease-out
                        bg-background/20 backdrop-blur-md border
                        ${focused 
                            ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20 bg-background/40' 
                            : 'border-border hover:border-orange-300 bg-background/10'}
                    `}
                >
                    <label 
                        className={`
                            absolute left-4 transition-all duration-300 pointer-events-none select-none font-medium tracking-wide
                            ${isActive 
                                ? '-top-2.5 left-3 px-2 text-[11px] text-orange-500 bg-background dark:bg-zinc-950 rounded-md font-bold' 
                                : 'top-4 text-[15px] text-muted-foreground'}
                        `}
                    >
                        {label}
                    </label>
                    <input
                        ref={ref}
                        value={value}
                        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
                        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
                        className="w-full bg-transparent rounded-xl px-4 py-4 font-sans text-[15px] text-foreground placeholder:text-transparent focus:outline-none focus:ring-0 transition-all duration-300"
                        {...props}
                    />
                </div>
                <motion.div 
                    initial={false}
                    animate={{ scaleX: focused ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="absolute -bottom-px left-4 right-4 h-0.5 bg-orange-500 rounded-full z-10 pointer-events-none"
                />
            </div>
        );
    }
);

Input.displayName = 'Input';
'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check } from 'lucide-react';

interface ModernCheckboxProps {
    label: React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id: string;
}

export const ModernCheckbox = ({ label, checked, onChange, id }: ModernCheckboxProps) => {
    return (
        <div className="flex items-start gap-3 group cursor-pointer" onClick={() => onChange(!checked)}>
            <div className="relative mt-0.5">
                {/* Checkbox Background */}
                <motion.div
                    animate={{
                        backgroundColor: checked ? "rgb(249 115 22)" : "transparent",
                        borderColor: checked ? "rgb(249 115 22)" : "rgb(212 212 216 / 0.3)",
                    }}
                    className={`
                        w-5 h-5 rounded-md border-2 transition-colors duration-200
                        flex items-center justify-center
                        group-hover:border-primary/50
                    `}
                >
                    <AnimatePresence>
                        {checked && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Focus/Hover Glow */}
                <motion.div
                    className="absolute inset-0 rounded-md bg-primary/20 blur-sm pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: checked ? 0.3 : 0.1 }}
                    animate={{ opacity: checked ? 0.2 : 0 }}
                />
            </div>
            
            <label 
                htmlFor={id} 
                className="text-sm text-muted-foreground select-none cursor-pointer group-hover:text-foreground transition-colors"
            >
                {label}
            </label>
        </div>
    );
};

import { AnimatePresence } from 'framer-motion';

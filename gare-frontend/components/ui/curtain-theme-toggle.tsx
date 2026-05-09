// components/ui/curtain-theme-toggle.tsx
"use client";

import {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from 'framer-motion';

export type Theme = "light" | "dark";

export interface ThemeToggleProps {
  variant?: "default" | "icon";
  defaultTheme?: Theme;
  buttonSize?: number;
  onThemeChange?: (theme: Theme) => void;
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64"  y2="18.36" /><line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" /></svg>
  );
}

export function ThemeToggle({
  variant      = "icon",
  defaultTheme = "light",
  buttonSize   = 40,
  onThemeChange,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    onThemeChange?.(next);
    
    if (typeof document !== "undefined") {
      if (next === "dark") {
        document.documentElement.classList.add("dark");
        // Apply custom dark gray to body if needed, but Tailwind classes should handle it
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, onThemeChange]);

  if (!mounted) return <div style={{ width: buttonSize, height: buttonSize }} />;

  return (
    <button
      onClick={toggle}
      className={
        "relative flex items-center justify-center rounded-full transition-all duration-300 " +
        "hover:bg-orange-500/10 dark:hover:bg-white/10 group overflow-hidden"
      }
      style={{ width: buttonSize, height: buttonSize }}
      aria-label="Changer le thème"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-slate-900 dark:text-white"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

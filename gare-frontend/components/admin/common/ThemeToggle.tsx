'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 bg-secondary/50 dark:bg-zinc-800/50 p-1 rounded-full border border-border/50">
      <button
        onClick={() => setTheme('light')}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          theme === 'light' 
            ? 'text-orange-500 bg-white shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          theme === 'dark' 
            ? 'text-orange-500 bg-zinc-900 shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Moon size={18} />
      </button>
    </div>
  );
}

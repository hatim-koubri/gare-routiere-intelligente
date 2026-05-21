// components/layout/Header.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { Bus, Sun, Moon, ChevronDown, History, FileText, HelpCircle, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle as CurtainThemeToggle } from '@/components/ui/curtain-theme-toggle';

export default function Header() {
  const [open, setOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const scrolled = useScroll(10);
  const { user, logout } = useAuth();
  const router = useRouter();
  const locale = 'fr';

  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const mainLinks = [
    { title: 'Accueil', href: '/' },
    { title: 'Réservation', href: '/fr/recherche' },
    { title: 'Compagnies', href: '/fr/compagnies' },
    { title: 'Annonces', href: '/fr/annonces' },
  ];

  const aboutLinks = [
    { title: 'Qui sommes-nous ?', href: '/fr/apropos', icon: <Building2 size={16} /> },
    { title: 'Conditions Générales', href: '/fr/conditions', icon: <FileText size={16} /> },
    { title: 'Comment ça marche', href: '/fr/comment-ca-marche', icon: <HelpCircle size={16} /> },
  ];

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    router.push('/fr/auth/login');
  };

  const handleDashboardClick = () => {
    if (!user) return;
    switch (user.role) {
      case 'ADMIN': router.push('/fr/admin'); break;
      case 'CHAUFFEUR': router.push('/fr/chauffeur/dashboard'); break;
      case 'VOYAGEUR': router.push('/fr/voyageur/dashboard'); break;
      default: router.push('/fr/auth/login');
    }
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  if (!mounted) {
    return null;
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 mx-auto w-full max-w-6xl transition-all duration-300 md:px-4 mt-6',
        {
          'md:top-6': scrolled && !open,
        },
      )}
    >
      <nav
        className={cn(
          'flex items-center justify-between transition-all duration-300 py-3 px-6 md:px-8 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur-xl border border-border shadow-sm',
          'rounded-none md:rounded-full'
        )}
      >
        {/* Brand */}
        <button 
          onClick={handleHomeClick} 
          className="relative group flex items-center shrink-0 cursor-pointer outline-none"
        >
          <motion.div
            initial="initial"
            whileHover="hover"
            className="flex items-center"
          >
            {"RIHLA".split("").map((letter, index) => (
              <motion.span
                key={index}
                variants={{
                  initial: { y: 0, filter: "blur(0px)" },
                  hover: { 
                    y: -3, 
                    filter: "blur(0.2px)",
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                      delay: index * 0.03
                    }
                  }
                }}
                className={cn(
                  "text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-orange-600 to-red-600",
                  "drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)] select-none"
                )}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
          
          {/* Decorative elements for 'WOW' effect */}
          <motion.div 
            className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            layoutId="brand-underline"
          />
          
          {/* Subtle glow behind the logo */}
          <div className="absolute -inset-x-4 -inset-y-2 bg-orange-500/0 group-hover:bg-orange-500/[0.03] rounded-2xl transition-all duration-500 blur-xl -z-10" />
        </button>
          
        {/* Navigation Menu Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {mainLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold text-muted-foreground hover:text-orange-500 hover:bg-orange-50 transition-colors duration-200"
              )}
            >
              {link.title}
            </Link>
          ))}

          {/* Dropdown À propos */}
          <div 
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold text-muted-foreground hover:text-orange-500 hover:bg-orange-50 transition-colors duration-200 flex items-center gap-1",
                dropdownOpen && "text-orange-500 bg-orange-50"
            )}>
                À propos <ChevronDown size={14} className={cn("transition-transform", dropdownOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
                {dropdownOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-2 overflow-hidden"
                    >
                        {aboutLinks.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            >
                                <span className="text-orange-500/50">{link.icon}</span>
                                {link.title}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 md:flex shrink-0">
          <CurtainThemeToggle variant="icon" />
          
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleDashboardClick}
                className="rounded-full font-bold hover:text-orange-500 hover:bg-orange-50"
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-full font-bold border-orange-200 text-orange-500 hover:bg-orange-50 hover:border-orange-300"
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/fr/auth/login')}
                className="rounded-full font-bold hover:text-orange-500 hover:bg-orange-50"
              >
                Connexion
              </Button>
              <Button
                onClick={() => router.push('/fr/auth/register')}
                className="rounded-full font-bold shadow-md bg-orange-500 hover:bg-orange-600 text-white border-0"
              >
                S'inscrire
              </Button>
            </div>
          )}
        </div>
        
        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <CurtainThemeToggle variant="icon" />
          <Button
            size="icon"
            variant="outline"
            onClick={() => setOpen(!open)}
            className="rounded-xl border-orange-200 text-orange-500 hover:bg-orange-50"
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur-xl fixed top-[88px] right-0 bottom-0 left-0 z-50 flex flex-col overflow-y-auto border-t md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div
          data-slot={open ? 'open' : 'closed'}
          className={cn(
            'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
            'flex h-full w-full flex-col justify-between p-6',
          )}
        >
          <div className="flex w-full flex-col gap-2">
            {mainLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                onClick={() => setOpen(false)}
                className="w-full flex p-4 rounded-xl font-bold border border-transparent hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-colors"
              >
                {link.title}
              </Link>
            ))}
            
            {/* Mobile About Dropdown (Accordion style) */}
            <div className="flex flex-col">
                <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between p-4 rounded-xl font-bold border border-transparent hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-colors"
                >
                    À propos <ChevronDown size={16} className={cn("transition-transform", dropdownOpen && "rotate-180")} />
                </button>
                {dropdownOpen && (
                    <div className="pl-6 space-y-1 mt-1">
                        {aboutLinks.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            >
                                {link.icon}
                                {link.title}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-8">
            {user ? (
              <>
                <Button
                  className="w-full rounded-xl h-12 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => { setOpen(false); handleDashboardClick(); }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-12 border-orange-200 text-orange-500 hover:bg-orange-50"
                  onClick={() => { setOpen(false); handleLogout(); }}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full bg-transparent rounded-xl h-12 font-bold border-orange-200 text-orange-500 hover:bg-orange-50"
                  onClick={() => { setOpen(false); router.push('/fr/auth/login'); }}
                >
                  Connexion
                </Button>
                <Button
                  className="w-full rounded-xl h-12 font-bold shadow-md bg-orange-500 hover:bg-orange-600 text-white border-0"
                  onClick={() => { setOpen(false); router.push('/fr/auth/register'); }}
                >
                  S'inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
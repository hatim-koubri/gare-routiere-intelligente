'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  QrCode, 
  Luggage, 
  AlertTriangle,
  LogOut,
  Bus
} from 'lucide-react';

export default function ChauffeurSidebar() {
  const { locale } = useParams();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const menuItems = [
    { 
      name: 'Tableau de bord', 
      href: `/chauffeur/dashboard`, 
      icon: LayoutDashboard 
    },
    { 
      name: 'Mes trajets', 
      href: `/chauffeur/trajets`, 
      icon: Calendar 
    },
    { 
      name: 'Scanner ticket', 
      href: `/chauffeur/scanner/ticket`, 
      icon: QrCode 
    },
    { 
      name: 'Scanner bagage', 
      href: `/chauffeur/scanner/bagage`, 
      icon: Luggage 
    },
    { 
      name: 'Signaler incident', 
      href: `/chauffeur/incidents`, 
      icon: AlertTriangle 
    },
  ];

  const isActive = (href: string) => {
    return pathname === `/${locale}${href}`;
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex-shrink-0">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Bus className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold">Chauffeur</h2>
        </div>
        {user && (
          <p className="text-sm text-gray-400 mt-2">
            {user.prenom} {user.nom}
          </p>
        )}
      </div>
      
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                active
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-gray-300 hover:bg-gray-800 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
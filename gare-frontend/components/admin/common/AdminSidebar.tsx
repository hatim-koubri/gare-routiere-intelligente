'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  LayoutGrid,
  Bus,
  Building2,
  SquareStack,
  Megaphone,
  Tag,
  LogOut,
  Users
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { locale } = useParams();
  const { logout } = useAuth();

  const menu = [
    { name: 'Dashboard', icon: LayoutGrid, href: '/admin' },
    { name: 'Compagnies', icon: Building2, href: '/admin/compagnies' },
    { name: 'Bus', icon: Bus, href: '/admin/bus' },
    { name: 'Quais', icon: SquareStack, href: '/admin/quais' },
    { name: 'Annonces', icon: Megaphone, href: '/admin/annonces' },
    { name: 'Promotions', icon: Tag, href: '/admin/promotions' },
  ];

  return (
    <div className="w-64 min-w-[256px] h-screen bg-white border-r border-gray-200 flex flex-col p-6 z-50">
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Bus size={22} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-gray-800">GareAdmin</span>
          <p className="text-xs text-gray-400">Panneau de contrôle</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {menu.map((item) => {
          const href = `/${locale}${item.href}`;
          const active = pathname === href;
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
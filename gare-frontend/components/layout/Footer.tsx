'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const { locale } = useParams();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Section 1: À propos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Gare Maroc</h3>
            <p className="text-gray-300 text-sm">
              Plateforme de réservation de bus au Maroc. Voyagez facilement et en toute sécurité.
            </p>
          </div>

          {/* Section 2: Liens utiles */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}`} className="text-gray-300 hover:text-white transition">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/auth/login`} className="text-gray-300 hover:text-white transition">
                  Connexion
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/auth/register`} className="text-gray-300 hover:text-white transition">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Email: contact@garemaroc.ma</li>
              <li>Tél: +212 5XX XXX XXX</li>
              <li>Adresse: Casablanca, Maroc</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Gare Maroc. Tous droits réservés.</p>
          <p className="mt-1">Version 1.0 - Sprint 1</p>
        </div>
      </div>
    </footer>
  );
}
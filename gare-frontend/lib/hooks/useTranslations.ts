'use client';

import { useParams } from 'next/navigation';
import fr from '@/lib/i18n/messages/fr.json';
import ar from '@/lib/i18n/messages/ar.json';

const translations = {
  fr,
  ar,
};

export function useTranslations() {
  const { locale } = useParams();
  const currentLocale = (locale as string) || 'fr';
  
  return translations[currentLocale as keyof typeof translations] || translations.fr;
}
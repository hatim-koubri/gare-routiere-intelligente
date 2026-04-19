'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { locales } from '@/lib/i18n/config';

export default function LanguageSwitcher() {
  const { locale } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchLanguage('fr')}
        className={`px-3 py-1 rounded ${locale === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
      >
        FR
      </button>
      <button
        onClick={() => switchLanguage('ar')}
        className={`px-3 py-1 rounded ${locale === 'ar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
      >
        AR
      </button>
    </div>
  );
}
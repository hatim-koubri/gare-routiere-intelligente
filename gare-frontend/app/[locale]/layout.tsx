'use client';

import { useParams } from 'next/navigation';
import { setDocumentDirection } from '@/lib/utils/rtl';
import { useEffect } from 'react';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useParams();
  
  useEffect(() => {
    setDocumentDirection(locale as string);
  }, [locale]);

  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  );
}
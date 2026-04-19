'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { setDocumentDirection } from '@/lib/utils/rtl';
import { useEffect } from 'react';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useParams();
  const isRTL = locale === 'ar';
  
  useEffect(() => {
    setDocumentDirection(locale as string);
  }, [locale]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
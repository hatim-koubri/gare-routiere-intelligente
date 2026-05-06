// app/[locale]/admin/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminDashboardRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = 'fr';

  useEffect(() => {
    router.push(`/fr/admin`);
  }, [router, locale]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}
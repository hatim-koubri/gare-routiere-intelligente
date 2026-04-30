'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslations } from '@/lib/hooks/useTranslations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PremiumLoader } from '@/components/ui/PremiumLoader';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push(returnUrl ? decodeURIComponent(returnUrl) : `/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && <Badge variant="danger" className="w-full text-center py-2 mb-6">{error}</Badge>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          type="email"
          label={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          type="password"
          label={t.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <div className="mt-4">
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            className="relative overflow-hidden group"
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${loading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              {t.common.login}
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <PremiumLoader color="white" size={24} />
              </div>
            )}
          </Button>
        </div>
      </form>
      
      <div className="mt-12 pt-8 border-t border-[var(--ink)]/10 font-body text-[15px] text-[var(--muted)] text-center">
        {t.common.noAccount}{' '}
        <Link href={`/${locale}/auth/register`} className="text-[var(--terracotta)] font-semibold hover:text-[var(--ink)] transition-colors">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ModernCheckbox } from '@/components/ui/ModernCheckbox';
import { PremiumLoader } from '@/components/ui/PremiumLoader';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    sexe: 'HOMME',
    role: Role.VOYAGEUR,
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      router.push('/fr/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && <Badge variant="danger" className="w-full text-center py-2 mb-6">{error}</Badge>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Input type="text" label="Nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
          <Input type="text" label="Prénom" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} required />
        </div>

        <Input type="email" label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        <Input type="tel" label="Téléphone" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />

        <input type="hidden" name="role" value={Role.VOYAGEUR} />

        <div className="relative w-full group">
          <div className="relative w-full rounded-xl transition-all duration-500 ease-out bg-background/20 backdrop-blur-md border border-border hover:border-orange-300 bg-background/10">
            <label className="absolute -top-2.5 left-3 px-2 text-[11px] text-orange-500 bg-background dark:bg-zinc-950 rounded-md font-bold tracking-wide pointer-events-none select-none">
              Sexe
            </label>
            <select
              value={formData.sexe}
              onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
              className="w-full bg-transparent rounded-xl px-4 py-4 font-sans text-[15px] text-foreground focus:outline-none focus:ring-0 transition-all duration-300 appearance-none cursor-pointer"
            >
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
          </div>
        </div>

        <Input type="password" label="Mot de passe" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
        <Input type="password" label="Confirmer" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />

        {/* Modern Styled Checkbox */}
        <div className="mt-2">
          <ModernCheckbox
            id="terms"
            checked={acceptTerms}
            onChange={setAcceptTerms}
            label={
              <>
                J'accepte les <Link href="#" className="text-primary font-semibold hover:underline">conditions d'utilisation</Link>
              </>
            }
          />
        </div>

        <div className="mt-4">
          <Button
            type="submit"
            disabled={loading}
            fullwidth
            className="relative overflow-hidden group bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md"
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${loading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              S'inscrire
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
        Déjà un compte ?{' '}
        <Link href="/fr/auth/login" className="text-[var(--terracotta)] font-semibold hover:text-[var(--ink)] transition-colors">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
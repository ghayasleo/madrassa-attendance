import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { BookOpenCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { t } = useTranslation();
  const { session, signIn, loading } = useAuth();
  const location = useLocation();
  const [authError, setAuthError] = useState('');

  const schema = z.object({
    email: z.string().email(t('errors.invalidEmail')),
    password: z.string().min(1, t('errors.required')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!loading && session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: FormValues) {
    setAuthError('');
    try {
      await signIn(values.email, values.password);
    } catch {
      setAuthError(t('auth.invalidCredentials'));
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <BookOpenCheck className="size-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('common.appName')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('auth.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

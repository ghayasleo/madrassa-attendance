import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useUpdateOwnProfile, useChangePassword } from './api';

const profileSchema = z.object({
  full_name: z.string().min(1, 'errors.required'),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(6, 'errors.minPassword'),
    confirmPassword: z.string().min(1, 'errors.required'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'errors.passwordMismatch',
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export function SettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { profile, isAdmin, refreshProfile } = useAuth();
  const updateProfile = useUpdateOwnProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSaveProfile(values: ProfileValues) {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        full_name: values.full_name,
        phone: values.phone || null,
      });
      await refreshProfile();
      toast.success(t('settings.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    }
  }

  async function onChangePassword(values: PasswordValues) {
    try {
      await changePassword.mutateAsync(values.password);
      toast.success(t('settings.passwordChanged'));
      passwordForm.reset({ password: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('settings.title')} />

      <Card>
        <CardHeader title={t('settings.profile')} />
        <CardBody>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <Input
              label={t('settings.fullName')}
              error={profileForm.formState.errors.full_name && t(profileForm.formState.errors.full_name.message!)}
              {...profileForm.register('full_name')}
            />
            <Input label={t('settings.email')} value={profile?.email ?? ''} disabled readOnly />
            <Input label={t('settings.phone')} type="tel" {...profileForm.register('phone')} />
            <Input
              label={t('settings.role')}
              value={t(`roles.${profile?.role ?? 'teacher'}`)}
              disabled
              readOnly
            />
            <Button type="submit" loading={updateProfile.isPending}>
              {t('common.save')}
            </Button>
          </form>
        </CardBody>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader title={t('settings.changePassword')} />
          <CardBody>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <Input
                label={t('settings.newPassword')}
                type="password"
                error={
                  passwordForm.formState.errors.password &&
                  t(passwordForm.formState.errors.password.message!)
                }
                {...passwordForm.register('password')}
              />
              <Input
                label={t('settings.confirmPassword')}
                type="password"
                error={
                  passwordForm.formState.errors.confirmPassword &&
                  t(passwordForm.formState.errors.confirmPassword.message!)
                }
                {...passwordForm.register('confirmPassword')}
              />
              <Button type="submit" loading={changePassword.isPending}>
                {t('settings.changePassword')}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {!isAdmin && <p className="px-1 text-sm text-gray-500">{t('settings.passwordHint')}</p>}
    </div>
  );
}

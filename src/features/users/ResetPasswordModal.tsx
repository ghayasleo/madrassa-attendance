import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useSetUserPassword, type UserWithMadrassa } from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  user: UserWithMadrassa | null;
};

export function ResetPasswordModal({ open, onClose, user }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const setPassword = useSetUserPassword();

  const schema = z
    .object({
      password: z.string().min(6, t('errors.minPassword')),
      confirmPassword: z.string().min(1, t('errors.required')),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: t('errors.passwordMismatch'),
    });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    try {
      await setPassword.mutateAsync({ id: user.id, password: values.password });
      toast.success(t('users.passwordChanged'));
      reset();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={user ? t('users.resetPasswordFor', { name: user.full_name }) : t('users.resetPassword')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={setPassword.isPending}>
            {t('common.cancel')}
          </Button>
          <Button form="reset-password-form" type="submit" loading={setPassword.isPending}>
            {t('users.resetPassword')}
          </Button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('users.newPassword')}
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label={t('users.confirmPassword')}
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </form>
    </Modal>
  );
}

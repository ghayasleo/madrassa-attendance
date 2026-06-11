import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useMadrassas } from '@/features/madrassas/api';
import type { Role } from '@/types/database';
import { useCreateUser, useUpdateUser, type UserWithMadrassa } from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  user?: UserWithMadrassa | null;
};

export function UserFormModal({ open, onClose, user }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const isEdit = !!user;
  const { data: madrassas } = useMadrassas();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const schema = z.object({
    full_name: z.string().min(1, t('errors.required')),
    email: z.string().email(t('errors.invalidEmail')),
    phone: z.string().optional(),
    role: z.enum(['admin', 'teacher']),
    madrassa_id: z.string().min(1, t('errors.required')),
    password: isEdit ? z.string().optional() : z.string().min(6, t('errors.minPassword')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      role: (user?.role as 'admin' | 'teacher') ?? 'teacher',
      madrassa_id: user?.madrassa_id ?? '',
      password: '',
    },
  });

  const submitting = createUser.isPending || updateUser.isPending;

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && user) {
        await updateUser.mutateAsync({
          id: user.id,
          full_name: values.full_name,
          phone: values.phone || null,
          role: values.role as Exclude<Role, 'super_admin'>,
          madrassa_id: values.madrassa_id,
        });
        toast.success(t('users.updated'));
      } else {
        await createUser.mutateAsync({
          full_name: values.full_name,
          email: values.email,
          password: values.password ?? '',
          phone: values.phone || null,
          role: values.role as Exclude<Role, 'super_admin'>,
          madrassa_id: values.madrassa_id,
        });
        toast.success(t('users.created'));
      }
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
      title={isEdit ? t('users.edit') : t('users.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button form="user-form" type="submit" loading={submitting}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('users.fullName')} error={errors.full_name?.message} {...register('full_name')} />
        <Input
          label={t('users.email')}
          type="email"
          disabled={isEdit}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input label={t('users.phone')} type="tel" {...register('phone')} />
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select
              label={t('users.role')}
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { value: 'admin', label: t('roles.admin') },
                { value: 'teacher', label: t('roles.teacher') },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="madrassa_id"
          render={({ field }) => (
            <Select
              label={t('users.madrassa')}
              placeholder={`${t('common.select')}…`}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.madrassa_id?.message}
              options={(madrassas ?? []).map((m) => ({ value: m.id, label: m.name }))}
            />
          )}
        />
        {!isEdit && (
          <Input
            label={t('users.password')}
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
        )}
      </form>
    </Modal>
  );
}

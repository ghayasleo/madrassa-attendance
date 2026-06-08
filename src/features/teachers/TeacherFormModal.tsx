import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import type { Profile } from '@/types/database';
import { useCreateTeacher, useUpdateTeacher } from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  teacher?: Profile | null;
};

export function TeacherFormModal({ open, onClose, teacher }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const isEdit = !!teacher;
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();

  const schema = z.object({
    full_name: z.string().min(1, t('errors.required')),
    email: z.string().email(t('errors.invalidEmail')),
    phone: z.string().optional(),
    password: isEdit
      ? z.string().optional()
      : z.string().min(6, t('errors.minPassword')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      full_name: teacher?.full_name ?? '',
      email: teacher?.email ?? '',
      phone: teacher?.phone ?? '',
      password: '',
    },
  });

  const submitting = createTeacher.isPending || updateTeacher.isPending;

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && teacher) {
        await updateTeacher.mutateAsync({
          id: teacher.id,
          full_name: values.full_name,
          phone: values.phone || null,
        });
        toast.success(t('teachers.updated'));
      } else {
        await createTeacher.mutateAsync({
          full_name: values.full_name,
          email: values.email,
          password: values.password ?? '',
          phone: values.phone || null,
        });
        toast.success(t('teachers.created'));
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
      title={isEdit ? t('teachers.edit') : t('teachers.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button form="teacher-form" type="submit" loading={submitting}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="teacher-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('teachers.fullName')} error={errors.full_name?.message} {...register('full_name')} />
        <Input
          label={t('teachers.email')}
          type="email"
          disabled={isEdit}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input label={t('teachers.phone')} type="tel" error={errors.phone?.message} {...register('phone')} />
        {!isEdit && (
          <Input
            label={t('teachers.password')}
            type="password"
            hint={t('teachers.passwordHint')}
            error={errors.password?.message}
            {...register('password')}
          />
        )}
      </form>
    </Modal>
  );
}

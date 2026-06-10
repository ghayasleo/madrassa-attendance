import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useSubjects } from '@/features/subjects/api';
import { useTeachers } from '@/features/teachers/api';
import { toTimeInput, toTimeValue } from '@/lib/utils';
import type { ClassWithMeta } from '@/types/app';
import { useCreateClass, useUpdateClass } from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  classItem?: ClassWithMeta | null;
};

export function ClassFormModal({ open, onClose, classItem }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { profile, isAdmin } = useAuth();
  const isEdit = !!classItem;
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();

  const schema = z
    .object({
      name: z.string().min(1, t('errors.required')),
      subject_id: z.string().optional(),
      teacher_id: z.string().optional(),
      start_time: z.string().min(1, t('errors.required')),
      end_time: z.string().min(1, t('errors.required')),
    })
    .refine((v) => v.start_time < v.end_time, {
      path: ['end_time'],
      message: t('classes.endAfterStart'),
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
      name: classItem?.name ?? '',
      subject_id: classItem?.subject_id ?? '',
      teacher_id: classItem?.teacher_id ?? (isAdmin ? '' : (profile?.id ?? '')),
      start_time: toTimeInput(classItem?.start_time) || '08:00',
      end_time: toTimeInput(classItem?.end_time) || '10:00',
    },
  });

  const submitting = createClass.isPending || updateClass.isPending;

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      subject_id: values.subject_id || null,
      teacher_id: values.teacher_id || profile?.id || null,
      start_time: toTimeValue(values.start_time),
      end_time: toTimeValue(values.end_time),
    };
    try {
      if (isEdit && classItem) {
        await updateClass.mutateAsync({ id: classItem.id, ...payload });
        toast.success(t('classes.updated'));
      } else {
        await createClass.mutateAsync(payload);
        toast.success(t('classes.created'));
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
      title={isEdit ? t('classes.edit') : t('classes.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button form="class-form" type="submit" loading={submitting}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('classes.name')} error={errors.name?.message} {...register('name')} />
        <Controller
          control={control}
          name="subject_id"
          render={({ field }) => (
            <Select
              label={t('classes.subject')}
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { value: '', label: t('common.none') },
                ...(subjects ?? []).map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          )}
        />
        {isAdmin && (
          <Controller
            control={control}
            name="teacher_id"
            render={({ field }) => (
              <Select
                label={t('classes.teacher')}
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: '', label: t('common.none') },
                  ...(teachers ?? []).map((teacher) => ({ value: teacher.id, label: teacher.full_name })),
                ]}
              />
            )}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('classes.startTime')}
            type="time"
            error={errors.start_time?.message}
            {...register('start_time')}
          />
          <Input
            label={t('classes.endTime')}
            type="time"
            error={errors.end_time?.message}
            {...register('end_time')}
          />
        </div>
      </form>
    </Modal>
  );
}

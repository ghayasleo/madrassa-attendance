import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useSubjects } from '@/features/subjects/api';
import type { StudentWithSubject } from '@/types/app';
import { useCreateStudent, useUpdateStudent } from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  student?: StudentWithSubject | null;
};

export function StudentFormModal({ open, onClose, student }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const isEdit = !!student;
  const { data: subjects } = useSubjects();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();

  const schema = z.object({
    full_name: z.string().min(1, t('errors.required')),
    guardian_name: z.string().optional(),
    phone: z.string().optional(),
    subject_id: z.string().optional(),
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
      full_name: student?.full_name ?? '',
      guardian_name: student?.guardian_name ?? '',
      phone: student?.phone ?? '',
      subject_id: student?.subject_id ?? '',
    },
  });

  const submitting = createStudent.isPending || updateStudent.isPending;

  async function onSubmit(values: FormValues) {
    const payload = {
      full_name: values.full_name,
      guardian_name: values.guardian_name || null,
      phone: values.phone || null,
      subject_id: values.subject_id || null,
    };
    try {
      if (isEdit && student) {
        await updateStudent.mutateAsync({ id: student.id, ...payload });
        toast.success(t('students.updated'));
      } else {
        await createStudent.mutateAsync(payload);
        toast.success(t('students.created'));
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
      title={isEdit ? t('students.edit') : t('students.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button form="student-form" type="submit" loading={submitting}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('students.fullName')} error={errors.full_name?.message} {...register('full_name')} />
        <Input label={t('students.guardianName')} {...register('guardian_name')} />
        <Input label={t('students.phone')} type="tel" {...register('phone')} />
        <Select label={t('students.subject')} {...register('subject_id')}>
          <option value="">{t('common.none')}</option>
          {subjects?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}

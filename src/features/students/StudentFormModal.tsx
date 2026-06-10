import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubjects } from '@/features/subjects/api';
import {
  useClasses,
  useStudentClasses,
  useEnrollStudent,
  useUnenrollStudent,
  ClassOverlapError,
} from '@/features/classes/api';
import { formatTime } from '@/lib/utils';
import type { StudentWithSubject } from '@/types/app';
import { useCreateStudent, useUpdateStudent } from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  student?: StudentWithSubject | null;
};

export function StudentFormModal({ open, onClose, student }: Props) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const toast = useToast();
  const isEdit = !!student;
  const { data: subjects } = useSubjects();
  const { data: classes } = useClasses();
  const { data: enrolledClasses } = useStudentClasses(student?.id ?? null);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const enrollStudent = useEnrollStudent();
  const unenrollStudent = useUnenrollStudent();

  const [classIds, setClassIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setClassIds((enrolledClasses ?? []).map((c) => c.id));
    }
  }, [open, enrolledClasses]);

  const schema = z.object({
    full_name: z.string().min(1, t('errors.required')),
    guardian_name: z.string().optional(),
    phone: z.string().optional(),
    subject_id: z.string().optional(),
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
      let studentId: string;
      if (isEdit && student) {
        await updateStudent.mutateAsync({ id: student.id, ...payload });
        studentId = student.id;
        toast.success(t('students.updated'));
      } else {
        const created = await createStudent.mutateAsync(payload);
        studentId = created.id;
        toast.success(t('students.created'));
      }

      const originalIds = new Set((enrolledClasses ?? []).map((c) => c.id));
      const nextIds = new Set(classIds);
      const toAdd = [...nextIds].filter((id) => !originalIds.has(id));
      const toRemove = [...originalIds].filter((id) => !nextIds.has(id));

      for (const classId of toRemove) {
        await unenrollStudent.mutateAsync({ classId, studentId });
      }
      for (const classId of toAdd) {
        try {
          await enrollStudent.mutateAsync({ classId, studentId });
        } catch (e) {
          if (e instanceof ClassOverlapError) {
            toast.error(t('errors.classOverlap', { name: e.conflictName }));
          } else {
            throw e;
          }
        }
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
        <Controller
          control={control}
          name="subject_id"
          render={({ field }) => (
            <Select
              label={t('students.subject')}
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { value: '', label: t('common.none') },
                ...(subjects ?? []).map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          )}
        />
        <MultiSelect
          label={t('students.enrolledClasses')}
          placeholder={t('common.select') + '…'}
          emptyText={t('common.noData')}
          values={classIds}
          onChange={setClassIds}
          options={(classes ?? []).map((c) => ({
            value: c.id,
            label: c.name,
            description: `${formatTime(c.start_time, language)} – ${formatTime(c.end_time, language)}`,
          }))}
        />
      </form>
    </Modal>
  );
}

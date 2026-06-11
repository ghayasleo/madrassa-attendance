import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import type { Madrassa } from '@/types/database';
import { useCreateMadrassa, useUpdateMadrassa } from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  madrassa?: Madrassa | null;
};

export function MadrassaFormModal({ open, onClose, madrassa }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const isEdit = !!madrassa;
  const createMadrassa = useCreateMadrassa();
  const updateMadrassa = useUpdateMadrassa();

  const schema = z.object({
    name: z.string().min(1, t('errors.required')),
    address: z.string().optional(),
    phone: z.string().optional(),
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
      name: madrassa?.name ?? '',
      address: madrassa?.address ?? '',
      phone: madrassa?.phone ?? '',
    },
  });

  const submitting = createMadrassa.isPending || updateMadrassa.isPending;

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      address: values.address || null,
      phone: values.phone || null,
    };
    try {
      if (isEdit && madrassa) {
        await updateMadrassa.mutateAsync({ id: madrassa.id, ...payload });
        toast.success(t('madrassas.updated'));
      } else {
        await createMadrassa.mutateAsync(payload);
        toast.success(t('madrassas.created'));
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
      title={isEdit ? t('madrassas.edit') : t('madrassas.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button form="madrassa-form" type="submit" loading={submitting}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="madrassa-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('madrassas.name')} error={errors.name?.message} {...register('name')} />
        <Input label={t('madrassas.address')} {...register('address')} />
        <Input label={t('madrassas.phone')} type="tel" {...register('phone')} />
      </form>
    </Modal>
  );
}

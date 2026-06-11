import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Pencil, Trash2, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { useActiveMadrassa } from '@/context/ActiveMadrassaContext';
import type { Madrassa } from '@/types/database';
import { useMadrassas, useDeleteMadrassa, type MadrassaWithCounts } from './api';
import { MadrassaFormModal } from './MadrassaFormModal';

export function MadrassasPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { setActiveMadrassaId } = useActiveMadrassa();
  const { data: madrassas, isLoading } = useMadrassas();
  const deleteMadrassa = useDeleteMadrassa();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Madrassa | null>(null);
  const [deleting, setDeleting] = useState<Madrassa | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(m: Madrassa) {
    setEditing(m);
    setFormOpen(true);
  }
  function open(m: Madrassa) {
    setActiveMadrassaId(m.id);
    navigate('/dashboard');
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteMadrassa.mutateAsync(deleting.id);
      toast.success(t('madrassas.deleted'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('madrassas.title')}
        action={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
            <span className="hidden sm:inline">{t('madrassas.add')}</span>
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : !madrassas || madrassas.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-10" />}
          title={t('madrassas.empty')}
          action={
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              {t('madrassas.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {madrassas.map((m) => (
            <MadrassaCard
              key={m.id}
              madrassa={m}
              onOpen={() => open(m)}
              onEdit={() => openEdit(m)}
              onDelete={() => setDeleting(m)}
            />
          ))}
        </div>
      )}

      <MadrassaFormModal open={formOpen} onClose={() => setFormOpen(false)} madrassa={editing} />

      <ConfirmDialog
        open={!!deleting}
        message={t('madrassas.confirmDelete')}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteMadrassa.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function MadrassaCard({
  madrassa,
  onOpen,
  onEdit,
  onDelete,
}: {
  madrassa: MadrassaWithCounts;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const members = madrassa.members?.[0]?.count ?? 0;
  const students = madrassa.students?.[0]?.count ?? 0;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{madrassa.name}</p>
          {madrassa.address && (
            <p className="truncate text-sm text-gray-500">{madrassa.address}</p>
          )}
          {madrassa.phone && <p className="text-sm text-gray-500">{madrassa.phone}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label={t('common.edit')}
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label={t('common.delete')}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Users className="size-4" />
          {t('madrassas.memberCount', { count: members })}
        </span>
        <span className="flex items-center gap-1.5">
          <GraduationCap className="size-4" />
          {t('madrassas.studentCount', { count: students })}
        </span>
      </div>

      <Button variant="secondary" fullWidth onClick={onOpen} leftIcon={<ArrowRight className="size-4 rtl:rotate-180" />}>
        {t('madrassas.open')}
      </Button>
    </Card>
  );
}

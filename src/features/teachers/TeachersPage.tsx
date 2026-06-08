import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Phone, Mail, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import type { Profile } from '@/types/database';
import { useTeachers, useUpdateTeacher } from './api';
import { TeacherFormModal } from './TeacherFormModal';

export function TeachersPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: teachers, isLoading } = useTeachers();
  const updateTeacher = useUpdateTeacher();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [toggling, setToggling] = useState<Profile | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(teacher: Profile) {
    setEditing(teacher);
    setFormOpen(true);
  }

  async function confirmToggle() {
    if (!toggling) return;
    try {
      await updateTeacher.mutateAsync({ id: toggling.id, is_active: !toggling.is_active });
      toast.success(t('teachers.updated'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setToggling(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('teachers.title')}
        action={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
            {t('teachers.add')}
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : !teachers || teachers.length === 0 ? (
        <EmptyState
          icon={<UserCog className="size-10" />}
          title={t('teachers.empty')}
          action={
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              {t('teachers.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{teacher.full_name}</p>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-gray-500">
                    <Mail className="size-3.5 shrink-0" /> {teacher.email}
                  </p>
                  {teacher.phone && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                      <Phone className="size-3.5 shrink-0" /> {teacher.phone}
                    </p>
                  )}
                </div>
                <Badge tone={teacher.is_active ? 'green' : 'gray'}>
                  {teacher.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(teacher)}>
                  {t('common.edit')}
                </Button>
                <Button
                  size="sm"
                  variant={teacher.is_active ? 'ghost' : 'secondary'}
                  onClick={() => setToggling(teacher)}
                >
                  {teacher.is_active ? t('teachers.deactivate') : t('teachers.activate')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TeacherFormModal open={formOpen} onClose={() => setFormOpen(false)} teacher={editing} />

      <ConfirmDialog
        open={!!toggling}
        message={
          toggling?.is_active ? t('teachers.confirmDeactivate') : t('teachers.activate')
        }
        confirmLabel={toggling?.is_active ? t('teachers.deactivate') : t('teachers.activate')}
        destructive={toggling?.is_active}
        loading={updateTeacher.isPending}
        onConfirm={confirmToggle}
        onClose={() => setToggling(null)}
      />
    </div>
  );
}

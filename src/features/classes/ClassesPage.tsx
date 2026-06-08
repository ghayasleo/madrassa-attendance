import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, Users, Pencil, Trash2, BookOpen, UserSquare } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatTime } from '@/lib/utils';
import type { ClassWithMeta } from '@/types/app';
import { useClasses, useDeleteClass } from './api';
import { ClassFormModal } from './ClassFormModal';
import { ManageStudentsModal } from './ManageStudentsModal';

export function ClassesPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const toast = useToast();
  const { data: classes, isLoading } = useClasses();
  const deleteClass = useDeleteClass();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassWithMeta | null>(null);
  const [managing, setManaging] = useState<ClassWithMeta | null>(null);
  const [deleting, setDeleting] = useState<ClassWithMeta | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteClass.mutateAsync(deleting.id);
      toast.success(t('common.delete'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('classes.title')}
        action={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
            <span className="hidden sm:inline">{t('classes.add')}</span>
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : !classes || classes.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-10" />}
          title={t('classes.empty')}
          action={
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              {t('classes.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => {
            const count = c.enrollment?.[0]?.count ?? 0;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{c.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="size-3.5 shrink-0" />
                      {formatTime(c.start_time, language)} – {formatTime(c.end_time, language)}
                    </p>
                    {c.teacher && (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-gray-500">
                        <UserSquare className="size-3.5 shrink-0" /> {c.teacher.full_name}
                      </p>
                    )}
                  </div>
                  {c.subject && <Badge tone="blue">{c.subject.name}</Badge>}
                </div>

                <button
                  onClick={() => setManaging(c)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                >
                  <Users className="size-4" />
                  {t('classes.enrolled', { count })}
                </button>

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setManaging(c)}>
                    {t('classes.manageStudents')}
                  </Button>
                  <button
                    onClick={() => {
                      setEditing(c);
                      setFormOpen(true);
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ClassFormModal open={formOpen} onClose={() => setFormOpen(false)} classItem={editing} />
      <ManageStudentsModal
        open={!!managing}
        onClose={() => setManaging(null)}
        classItem={managing}
      />
      <ConfirmDialog
        open={!!deleting}
        message={t('classes.confirmDelete')}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteClass.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

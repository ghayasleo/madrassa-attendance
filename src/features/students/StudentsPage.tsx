import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Users, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import type { StudentWithSubject } from '@/types/app';
import { useStudents, useDeleteStudent } from './api';
import { StudentFormModal } from './StudentFormModal';

export function StudentsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: students, isLoading } = useStudents();
  const deleteStudent = useDeleteStudent();

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentWithSubject | null>(null);
  const [deleting, setDeleting] = useState<StudentWithSubject | null>(null);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.guardian_name?.toLowerCase().includes(q) ||
        s.phone?.includes(q),
    );
  }, [students, query]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(student: StudentWithSubject) {
    setEditing(student);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteStudent.mutateAsync(deleting.id);
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
        title={t('students.title')}
        action={
          <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
            <span className="hidden sm:inline">{t('students.add')}</span>
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 text-gray-400 start-3" />
        <Input
          placeholder={t('common.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="ps-10"
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-10" />}
          title={t('students.empty')}
          action={
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              {t('students.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((student) => (
            <Card key={student.id} className="flex items-start justify-between gap-2 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{student.full_name}</p>
                {student.guardian_name && (
                  <p className="truncate text-sm text-gray-500">{student.guardian_name}</p>
                )}
                {student.phone && <p className="text-sm text-gray-500">{student.phone}</p>}
                {(student.subject || student.classes.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {student.subject && <Badge tone="blue">{student.subject.name}</Badge>}
                    {student.classes
                      .map((c) => c.class)
                      .filter((c): c is { id: string; name: string } => !!c)
                      .map((c) => (
                        <Badge key={c.id} tone="green">
                          {c.name}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() => openEdit(student)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={t('common.edit')}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setDeleting(student)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <StudentFormModal open={formOpen} onClose={() => setFormOpen(false)} student={editing} />

      <ConfirmDialog
        open={!!deleting}
        message={t('students.confirmDelete')}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteStudent.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

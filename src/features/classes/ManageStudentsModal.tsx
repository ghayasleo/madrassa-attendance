import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';
import { useStudents } from '@/features/students/api';
import type { ClassWithMeta } from '@/types/app';
import { formatTime } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import {
  useClassStudents,
  useEnrollStudent,
  useUnenrollStudent,
  ClassOverlapError,
} from './api';

type Props = {
  open: boolean;
  onClose: () => void;
  classItem: ClassWithMeta | null;
};

export function ManageStudentsModal({ open, onClose, classItem }: Props) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const toast = useToast();
  const [query, setQuery] = useState('');

  const classId = classItem?.id ?? null;
  const { data: allStudents } = useStudents();
  const { data: enrolled, isLoading } = useClassStudents(classId);
  const enroll = useEnrollStudent();
  const unenroll = useUnenrollStudent();

  const enrolledIds = useMemo(() => new Set((enrolled ?? []).map((s) => s.id)), [enrolled]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (allStudents ?? [])
      .filter((s) => !enrolledIds.has(s.id))
      .filter((s) => !q || s.full_name.toLowerCase().includes(q));
  }, [allStudents, enrolledIds, query]);

  async function add(studentId: string) {
    if (!classId) return;
    try {
      await enroll.mutateAsync({ classId, studentId });
    } catch (e) {
      if (e instanceof ClassOverlapError) {
        toast.error(t('errors.classOverlap', { name: e.conflictName }));
      } else {
        toast.error(e instanceof Error ? e.message : t('errors.generic'));
      }
    }
  }

  async function remove(studentId: string) {
    if (!classId) return;
    try {
      await unenroll.mutateAsync({ classId, studentId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        classItem
          ? `${classItem.name} · ${formatTime(classItem.start_time, language)}–${formatTime(classItem.end_time, language)}`
          : t('classes.manageStudents')
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Enrolled */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              {t('classes.students')} ({enrolled?.length ?? 0})
            </h3>
            {enrolled && enrolled.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {enrolled.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 ps-3 pe-1.5 text-sm text-brand-800"
                  >
                    {s.full_name}
                    <button
                      onClick={() => remove(s.id)}
                      className="rounded-full p-0.5 text-brand-600 hover:bg-brand-200"
                      aria-label={t('classes.removeFromClass')}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('classes.noStudents')}</p>
            )}
          </section>

          {/* Add */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              {t('classes.assignStudents')}
            </h3>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 text-gray-400 start-3" />
              <Input
                placeholder={t('common.search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {candidates.map((s) => (
                <button
                  key={s.id}
                  onClick={() => add(s.id)}
                  disabled={enroll.isPending}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="text-sm text-gray-800">{s.full_name}</span>
                  <Plus className="size-4 text-brand-600" />
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="px-1 py-2 text-sm text-gray-500">{t('common.noData')}</p>
              )}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}

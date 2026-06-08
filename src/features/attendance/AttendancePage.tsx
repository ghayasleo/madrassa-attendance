import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { CheckCheck, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';
import { useClasses, useClassStudents } from '@/features/classes/api';
import { toDateKey } from '@/lib/utils';
import type { AttendanceStatus } from '@/types/database';
import { StatusSegment } from './StatusSegment';
import { useAttendanceForDate, useSaveAttendance } from './api';

export function AttendancePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: classes } = useClasses();
  const [classId, setClassId] = useState<string>(searchParams.get('class') ?? '');
  const [date, setDate] = useState<string>(toDateKey(new Date()));

  const { data: students, isLoading: studentsLoading } = useClassStudents(classId || null);
  const { data: existing, isLoading: existingLoading } = useAttendanceForDate(
    classId || null,
    date,
  );
  const saveAttendance = useSaveAttendance();

  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  // Initialise statuses whenever the class, date, students or existing rows change.
  useEffect(() => {
    if (!students) return;
    const existingMap = new Map((existing ?? []).map((a) => [a.student_id, a.status]));
    const next: Record<string, AttendanceStatus> = {};
    for (const s of students) {
      next[s.id] = existingMap.get(s.id) ?? 'present';
    }
    setStatuses(next);
  }, [students, existing]);

  function setClass(id: string) {
    setClassId(id);
    setSearchParams(id ? { class: id } : {});
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    if (!students) return;
    setStatuses(Object.fromEntries(students.map((s) => [s.id, 'present' as AttendanceStatus])));
  }

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const status of Object.values(statuses)) counts[status] += 1;
    return counts;
  }, [statuses]);

  async function save() {
    if (!classId || !students) return;
    try {
      await saveAttendance.mutateAsync({
        classId,
        date,
        entries: students.map((s) => ({ student_id: s.id, status: statuses[s.id] ?? 'present' })),
      });
      toast.success(t('attendance.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errors.generic'));
    }
  }

  const loading = studentsLoading || existingLoading;

  return (
    <div>
      <PageHeader title={t('attendance.title')} />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label={t('attendance.selectClass')}
            value={classId}
            onChange={(e) => setClass(e.target.value)}
          >
            <option value="">{t('common.select')}…</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label={t('common.date')}
            type="date"
            value={date}
            max={toDateKey(new Date())}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </Card>

      {!classId ? (
        <EmptyState icon={<ClipboardCheck className="size-10" />} title={t('attendance.pickClassPrompt')} />
      ) : loading ? (
        <PageLoader />
      ) : !students || students.length === 0 ? (
        <EmptyState title={t('attendance.noStudents')} />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t('attendance.summary', summary)}
            </p>
            <Button size="sm" variant="outline" leftIcon={<CheckCheck className="size-4" />} onClick={markAllPresent}>
              {t('attendance.markAll')}
            </Button>
          </div>

          <div className="space-y-2 pb-4">
            {students.map((s, i) => (
              <Card key={s.id} className="p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-900">{s.full_name}</span>
                </div>
                <StatusSegment value={statuses[s.id] ?? 'present'} onChange={(st) => setStatus(s.id, st)} />
              </Card>
            ))}
          </div>

          <div className="sticky bottom-16 z-10 md:bottom-2">
            <Button fullWidth size="lg" loading={saveAttendance.isPending} onClick={save}>
              {t('attendance.save')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

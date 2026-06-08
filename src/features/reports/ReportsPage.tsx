import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/context/LanguageContext';
import { useClasses } from '@/features/classes/api';
import { useStudents } from '@/features/students/api';
import { toDateKey } from '@/lib/utils';
import type { AttendanceStatus } from '@/types/database';
import { useAttendanceReport, type ReportFilters, type ReportScope } from './api';

type Period = 'day' | 'week' | 'month' | 'custom';

const STATUS_TONES: Record<AttendanceStatus, 'green' | 'red' | 'amber' | 'blue'> = {
  present: 'green',
  absent: 'red',
  late: 'amber',
  excused: 'blue',
};

function rangeForPeriod(period: Period, custom: { from: string; to: string }) {
  const today = new Date();
  switch (period) {
    case 'day':
      return { from: toDateKey(today), to: toDateKey(today) };
    case 'week':
      return {
        from: toDateKey(startOfWeek(today, { weekStartsOn: 1 })),
        to: toDateKey(endOfWeek(today, { weekStartsOn: 1 })),
      };
    case 'month':
      return { from: toDateKey(startOfMonth(today)), to: toDateKey(endOfMonth(today)) };
    case 'custom':
      return custom;
  }
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { data: classes } = useClasses();
  const { data: students } = useStudents();

  const [scope, setScope] = useState<ReportScope>('class');
  const [targetId, setTargetId] = useState('');
  const [period, setPeriod] = useState<Period>('week');
  const [custom, setCustom] = useState({ from: toDateKey(new Date()), to: toDateKey(new Date()) });
  const [filters, setFilters] = useState<ReportFilters | null>(null);

  const { data: rows, isLoading, isFetching } = useAttendanceReport(filters);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', { dateStyle: 'medium' }),
    [language],
  );

  const stats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const r of rows ?? []) counts[r.status] += 1;
    const total = (rows ?? []).length;
    const attended = counts.present + counts.late;
    const rate = total ? Math.round((attended / total) * 100) : 0;
    return { ...counts, total, rate };
  }, [rows]);

  function generate() {
    if (!targetId) return;
    const range = rangeForPeriod(period, custom);
    setFilters({ scope, targetId, ...range });
  }

  return (
    <div>
      <PageHeader title={t('reports.title')} />

      <Card className="mb-4">
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={t('reports.scope')}
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as ReportScope);
                setTargetId('');
              }}
            >
              <option value="class">{t('reports.byClass')}</option>
              <option value="student">{t('reports.byStudent')}</option>
            </Select>

            <Select
              label={scope === 'class' ? t('reports.class') : t('reports.student')}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">{t('common.select')}…</option>
              {scope === 'class'
                ? classes?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                : students?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
            </Select>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('reports.period')}
            </span>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1">
              {(['day', 'week', 'month', 'custom'] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={
                    'rounded-lg py-1.5 text-sm font-medium transition-colors ' +
                    (period === p ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600')
                  }
                >
                  {t(`reports.${p}`)}
                </button>
              ))}
            </div>
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('reports.from')}
                type="date"
                value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              />
              <Input
                label={t('reports.to')}
                type="date"
                value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              />
            </div>
          )}

          <Button fullWidth onClick={generate} disabled={!targetId}>
            {t('reports.generate')}
          </Button>
        </CardBody>
      </Card>

      {!filters ? (
        <EmptyState icon={<BarChart3 className="size-10" />} title={t('reports.selectPrompt')} />
      ) : isLoading || isFetching ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-7" />
        </div>
      ) : !rows || rows.length === 0 ? (
        <EmptyState title={t('reports.noData')} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label={t('reports.rate')} value={`${stats.rate}%`} highlight />
            <StatCard label={t('reports.sessions')} value={stats.total} />
            <StatCard label={t('reports.present')} value={stats.present} />
            <StatCard label={t('reports.absent')} value={stats.absent} />
            <StatCard label={t('reports.late')} value={stats.late} />
            <StatCard label={t('reports.excused')} value={stats.excused} />
          </div>

          <Card>
            <div className="divide-y divide-gray-100">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{r.label}</p>
                    <p className="text-sm text-gray-500">{dateFmt.format(new Date(r.date))}</p>
                  </div>
                  <Badge tone={STATUS_TONES[r.status]}>{t(`attendance.${r.status}`)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-brand-200 bg-brand-50' : ''}>
      <CardBody>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={'mt-1 text-2xl font-bold ' + (highlight ? 'text-brand-700' : 'text-gray-900')}>
          {value}
        </p>
      </CardBody>
    </Card>
  );
}

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Clock, ClipboardCheck, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useClasses } from '@/features/classes/api';
import { formatTime } from '@/lib/utils';
import { useDashboardStats } from './api';

export function DashboardPage() {
  const { t } = useTranslation();
  const { profile, isAdmin } = useAuth();
  const { language } = useLanguage();
  const { data: stats } = useDashboardStats(isAdmin);
  const { data: classes } = useClasses();

  return (
    <div>
      <PageHeader title={t('dashboard.welcome', { name: profile?.full_name ?? '' })} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile icon={<Users className="size-5" />} label={t('dashboard.totalStudents')} value={stats?.students} />
        <StatTile icon={<BookOpen className="size-5" />} label={t('dashboard.totalClasses')} value={stats?.classes} />
        {isAdmin && (
          <StatTile
            icon={<GraduationCap className="size-5" />}
            label={t('dashboard.totalTeachers')}
            value={stats?.teachers}
          />
        )}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('dashboard.todaysClasses')}</h2>
      {!classes || classes.length === 0 ? (
        <EmptyState title={t('dashboard.noClassesToday')} />
      ) : (
        <div className="space-y-2">
          {classes.map((c) => (
            <Link key={c.id} to={`/attendance?class=${c.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <ClipboardCheck className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="size-3.5" />
                      {formatTime(c.start_time, language)} – {formatTime(c.end_time, language)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-gray-400 rtl:rotate-180" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

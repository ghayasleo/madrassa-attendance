import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Building2, Users, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useMadrassas } from '@/features/madrassas/api';
import { useUsers } from '@/features/users/api';

export function SuperAdminDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: madrassas } = useMadrassas();
  const { data: users } = useUsers();

  return (
    <div>
      <PageHeader title={t('superAdmin.welcome', { name: profile?.full_name ?? '' })} />

      <div className="space-y-3">
        <NavCard
          to="/admin/madrassas"
          icon={<Building2 className="size-5" />}
          title={t('madrassas.title')}
          subtitle={t('madrassas.count', { count: madrassas?.length ?? 0 })}
        />
        <NavCard
          to="/admin/users"
          icon={<Users className="size-5" />}
          title={t('users.title')}
          subtitle={t('users.count', { count: users?.length ?? 0 })}
        />
      </div>
    </div>
  );
}

function NavCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </div>
          <div>
            <p className="font-medium text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="size-5 text-gray-400 rtl:rotate-180" />
      </Card>
    </Link>
  );
}

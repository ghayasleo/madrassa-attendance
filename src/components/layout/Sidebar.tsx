import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { visibleNavItems } from './navItems';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { canInstall, install } = usePwaInstall();
  const items = visibleNavItems(isAdmin);

  return (
    <aside className="hidden w-60 shrink-0 border-e border-gray-200 bg-white md:block">
      <div className="flex h-full min-h-[calc(100dvh-3.5rem)] flex-col">
        <div className="border-b border-gray-100 px-4 py-4">
          <img src="/brand/logo-wordmark.svg" alt={t('common.appName')} className="h-12 w-auto" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <Icon className="size-5" />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
        {canInstall && (
          <div className="border-t border-gray-100 p-3">
            <button
              type="button"
              onClick={() => void install()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Download className="size-5" />
              Install app
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

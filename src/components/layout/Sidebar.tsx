import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InstallAppButton } from './InstallAppButton';
import { visibleNavItems } from './navItems';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { t } = useTranslation();
  const { isAdmin, signOut } = useAuth();
  const items = visibleNavItems(isAdmin);

  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="fixed inset-y-0 start-0 top-14 flex h-[calc(100dvh-3.5rem)] w-60 flex-col border-e border-gray-200 bg-white">
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
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
        <div className="border-t border-gray-100 p-3">
          <InstallAppButton />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            <Settings className="size-5" />
            {t('nav.settings')}
          </NavLink>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
          >
            <LogOut className="size-5" />
            {t('common.signOut')}
          </button>
        </div>
      </div>
    </aside>
  );
}

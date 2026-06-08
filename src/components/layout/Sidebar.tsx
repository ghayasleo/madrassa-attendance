import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { visibleNavItems } from './navItems';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const items = visibleNavItems(isAdmin);

  return (
    <aside className="hidden w-60 shrink-0 border-e border-gray-200 bg-white md:block">
      <nav className="flex flex-col gap-1 p-3">
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
    </aside>
  );
}

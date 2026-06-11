import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useActiveMadrassa } from '@/context/ActiveMadrassaContext';
import { visibleNavItems } from './navItems';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { isImpersonating } = useActiveMadrassa();
  const items = visibleNavItems({ isAdmin, isSuperAdmin, isImpersonating }).filter(
    (item) => item.primary,
  );

  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-gray-200 bg-white md:hidden">
      <div className="flex items-stretch justify-around">
        {items.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                isActive ? 'text-brand-700' : 'text-gray-500',
              )
            }
          >
            <Icon className="size-5" />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

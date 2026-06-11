import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useActiveMadrassa } from '@/context/ActiveMadrassaContext';
import { Modal } from '@/components/ui/Modal';
import { visibleNavItems } from './navItems';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin, signOut } = useAuth();
  const { isImpersonating } = useActiveMadrassa();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = visibleNavItems({ isAdmin, isSuperAdmin, isImpersonating });
  const primary = items.filter((item) => item.primary);
  const overflow = items.filter((item) => !item.primary);
  const hasMore = overflow.length > 0;

  // Highlight "More" when the current route lives in the overflow sheet.
  const moreActive = overflow.some((item) => pathname.startsWith(item.to)) || pathname === '/settings';

  const tabClass = (isActive: boolean) =>
    cn(
      'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
      isActive ? 'text-brand-700' : 'text-gray-500',
    );

  return (
    <>
      <nav className="safe-bottom sticky bottom-0 z-30 border-t border-gray-200 bg-white md:hidden">
        <div className="flex items-stretch justify-around">
          {primary.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
              <Icon className="size-5" />
              <span className="truncate">{t(labelKey)}</span>
            </NavLink>
          ))}
          {hasMore && (
            <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(moreActive)}>
              <MoreHorizontal className="size-5" />
              <span className="truncate">{t('nav.more')}</span>
            </button>
          )}
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title={t('nav.more')}>
        <div className="flex flex-col gap-1">
          {overflow.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMoreOpen(false)}
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
          <NavLink
            to="/settings"
            onClick={() => setMoreOpen(false)}
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
            onClick={() => {
              setMoreOpen(false);
              void signOut();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
          >
            <LogOut className="size-5" />
            {t('common.signOut')}
          </button>
        </div>
      </Modal>
    </>
  );
}

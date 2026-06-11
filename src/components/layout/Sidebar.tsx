import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useActiveMadrassa } from '@/context/ActiveMadrassaContext';
import { InstallAppButton } from './InstallAppButton';
import { visibleNavItems } from './navItems';
import { cn } from '@/lib/utils';

type SidebarProps = {
  /** Whether the mobile drawer is open. */
  mobileOpen: boolean;
  /** Close the mobile drawer (also called after navigating). */
  onClose: () => void;
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  );

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin, signOut } = useAuth();
  const { isImpersonating } = useActiveMadrassa();
  const items = visibleNavItems({ isAdmin, isSuperAdmin, isImpersonating });

  // Lock scroll + close on Escape while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, onClose]);

  // `onNavigate` closes the drawer on mobile; on desktop it's a no-op.
  const content = (onNavigate?: () => void) => (
    <>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={linkClass}>
            <Icon className="size-5" />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3">
        <InstallAppButton />
        <NavLink to="/settings" onClick={onNavigate} className={linkClass}>
          <Settings className="size-5" />
          {t('nav.settings')}
        </NavLink>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void signOut();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
        >
          <LogOut className="size-5" />
          {t('common.signOut')}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden w-60 shrink-0 md:block">
        <div className="fixed inset-y-0 start-0 top-14 flex h-[calc(100dvh-3.5rem)] w-60 flex-col border-e border-gray-200 bg-white">
          {content()}
        </div>
      </aside>

      {/* Mobile: off-canvas drawer */}
      {mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              className="absolute inset-y-0 start-0 flex w-72 max-w-[80%] flex-col bg-white shadow-xl"
            >
              <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
                <div className="flex items-center gap-2">
                  <img src="/brand/logo-mark.svg" alt="" className="size-8 rounded-lg" />
                  <span className="font-semibold text-gray-900">{t('common.appName')}</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('common.close')}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="size-5" />
                </button>
              </div>
              {content(onClose)}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

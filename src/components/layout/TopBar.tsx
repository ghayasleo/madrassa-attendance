import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from './LanguageToggle';

type TopBarProps = {
  onMenuClick: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t('nav.menu')}
          className="-ms-1 rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden"
        >
          <Menu className="size-5" />
        </button>
        {/* Brand shows on desktop; mobile uses the hamburger instead. */}
        <div className="hidden items-center gap-2 md:flex">
          <img src="/brand/logo-mark.svg" alt="" className="size-8 rounded-lg" />
          <span className="font-semibold text-gray-900">{t('common.appName')}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        {profile && (
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-lg py-1 ps-1.5 pe-2 transition-colors hover:bg-gray-100"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials}
            </span>
            <span className="hidden text-start sm:block">
              <span className="block text-sm font-medium leading-tight text-gray-900">
                {profile.full_name}
              </span>
              <span className="block text-xs leading-tight text-gray-500">
                {t(`roles.${profile.role}`)}
              </span>
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}

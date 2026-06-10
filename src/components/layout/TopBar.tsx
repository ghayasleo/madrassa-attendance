import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from './LanguageToggle';

export function TopBar() {
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
        <img src="/brand/logo-mark.svg" alt="" className="size-8 rounded-lg" />
        <span className="font-semibold text-gray-900">{t('common.appName')}</span>
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

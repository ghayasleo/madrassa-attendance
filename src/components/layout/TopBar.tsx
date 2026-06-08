import { useTranslation } from 'react-i18next';
import { LogOut, BookOpenCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from './LanguageToggle';

export function TopBar() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <BookOpenCheck className="size-6 text-brand-600" />
        <span className="font-semibold text-gray-900">{t('common.appName')}</span>
      </div>
      <div className="flex items-center gap-1">
        <LanguageToggle />
        {profile && (
          <span className="hidden text-sm text-gray-500 sm:inline">
            {profile.full_name} · {t(`roles.${profile.role}`)}
          </span>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600"
          aria-label={t('common.signOut')}
          title={t('common.signOut')}
        >
          <LogOut className="size-5" />
        </button>
      </div>
    </header>
  );
}

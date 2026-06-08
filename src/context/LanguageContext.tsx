import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl, type Language } from '@/i18n';

type LanguageContextValue = {
  language: Language;
  dir: 'ltr' | 'rtl';
  setLanguage: (lng: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(
    (i18n.resolvedLanguage as Language) ?? 'en',
  );

  const dir: 'ltr' | 'rtl' = isRtl(language) ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', dir);
  }, [language, dir]);

  const setLanguage = useCallback(
    (lng: Language) => {
      void i18n.changeLanguage(lng);
      setLanguageState(lng);
    },
    [i18n],
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  }, [language, setLanguage]);

  const value = useMemo(
    () => ({ language, dir, setLanguage, toggleLanguage }),
    [language, dir, setLanguage, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

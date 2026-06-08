import { Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
      aria-label="Toggle language"
    >
      <Languages className="size-4" />
      <span>{language === 'en' ? 'اردو' : 'EN'}</span>
    </button>
  );
}

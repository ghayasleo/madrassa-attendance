import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, X } from 'lucide-react';
import { useActiveMadrassa } from '@/context/ActiveMadrassaContext';
import { useMadrassas } from '@/features/madrassas/api';

/** Shown to a super-admin while browsing inside a specific madrassa. */
export function MadrassaBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isImpersonating, activeMadrassaId, clearActiveMadrassa } = useActiveMadrassa();
  const { data: madrassas } = useMadrassas();

  if (!isImpersonating) return null;

  const name = madrassas?.find((m) => m.id === activeMadrassaId)?.name ?? '';

  function exit() {
    clearActiveMadrassa();
    navigate('/admin');
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span className="flex min-w-0 items-center gap-2">
        <Building2 className="size-4 shrink-0" />
        <span className="truncate">{t('madrassas.viewing', { name })}</span>
      </span>
      <button
        type="button"
        onClick={exit}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-medium hover:bg-amber-100"
      >
        <X className="size-4" />
        {t('madrassas.exit')}
      </button>
    </div>
  );
}

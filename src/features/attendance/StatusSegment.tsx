import { useTranslation } from 'react-i18next';
import type { AttendanceStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const OPTIONS: { value: AttendanceStatus; activeClass: string }[] = [
  { value: 'present', activeClass: 'bg-brand-600 text-white' },
  { value: 'absent', activeClass: 'bg-red-600 text-white' },
  { value: 'late', activeClass: 'bg-amber-500 text-white' },
  { value: 'excused', activeClass: 'bg-blue-600 text-white' },
];

export function StatusSegment({
  value,
  onChange,
}: {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg py-1.5 text-xs font-medium transition-colors',
            value === opt.value ? opt.activeClass : 'text-gray-600 hover:bg-gray-200',
          )}
        >
          {t(`attendance.${opt.value}`)}
        </button>
      ))}
    </div>
  );
}

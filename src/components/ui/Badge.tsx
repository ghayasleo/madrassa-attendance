import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'gray' | 'green' | 'red' | 'amber' | 'blue';

const tones: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-brand-100 text-brand-800',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-700',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

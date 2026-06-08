import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** "08:00:00" | "08:00" -> "08:00" for <input type="time"> */
export function toTimeInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 5);
}

/** "08:00" -> "08:00:00" for Postgres `time` columns */
export function toTimeValue(value: string): string {
  if (!value) return '';
  return value.length === 5 ? `${value}:00` : value;
}

/** Format a "HH:MM[:SS]" time for display, e.g. "8:00 AM". */
export function formatTime(value: string | null | undefined, locale = 'en'): string {
  if (!value) return '';
  const [h, m] = value.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** True if two daily [start,end) time ranges overlap. */
export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Returns YYYY-MM-DD for a Date in local time. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

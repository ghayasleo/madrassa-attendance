import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Attendance } from '@/types/database';

export type ReportScope = 'class' | 'student';

export type ReportFilters = {
  scope: ReportScope;
  targetId: string;
  from: string;
  to: string;
};

export type ReportRow = Attendance & {
  label: string; // student name (class scope) or class name (student scope)
};

export const reportKeys = {
  result: (f: ReportFilters) => ['reports', f.scope, f.targetId, f.from, f.to] as const,
};

export function useAttendanceReport(filters: ReportFilters | null) {
  return useQuery({
    queryKey: filters ? reportKeys.result(filters) : ['reports', 'none'],
    enabled: !!filters && !!filters.targetId,
    queryFn: async (): Promise<ReportRow[]> => {
      const f = filters!;
      const column = f.scope === 'class' ? 'class_id' : 'student_id';
      const join =
        f.scope === 'class' ? 'student:students(full_name)' : 'class:classes(name)';

      const { data, error } = await supabase
        .from('attendance')
        .select(`*, ${join}`)
        .eq(column, f.targetId)
        .gte('date', f.from)
        .lte('date', f.to)
        .order('date', { ascending: false });
      if (error) throw error;

      return (data ?? []).map((row) => {
        const r = row as unknown as Attendance & {
          student?: { full_name: string } | null;
          class?: { name: string } | null;
        };
        return {
          ...r,
          label: f.scope === 'class' ? (r.student?.full_name ?? '—') : (r.class?.name ?? '—'),
        };
      });
    },
  });
}

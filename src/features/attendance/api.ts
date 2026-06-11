import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useActiveMadrassaId } from '@/context/ActiveMadrassaContext';
import type { Attendance, AttendanceStatus } from '@/types/database';

export const attendanceKeys = {
  forDate: (classId: string, date: string) => ['attendance', classId, date] as const,
};

export function useAttendanceForDate(classId: string | null, date: string) {
  return useQuery({
    queryKey: classId ? attendanceKeys.forDate(classId, date) : ['attendance', 'none'],
    enabled: !!classId,
    queryFn: async (): Promise<Attendance[]> => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classId!)
        .eq('date', date);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type AttendanceEntry = {
  student_id: string;
  status: AttendanceStatus;
};

export function useSaveAttendance() {
  const qc = useQueryClient();
  const madrassaId = useActiveMadrassaId();
  return useMutation({
    mutationFn: async ({
      classId,
      date,
      entries,
    }: {
      classId: string;
      date: string;
      entries: AttendanceEntry[];
    }) => {
      if (!madrassaId) throw new Error('No active madrassa');
      const { data: auth } = await supabase.auth.getUser();
      const rows = entries.map((e) => ({
        class_id: classId,
        student_id: e.student_id,
        date,
        status: e.status,
        marked_by: auth.user?.id ?? null,
        madrassa_id: madrassaId,
      }));
      const { error } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'class_id,student_id,date' });
      if (error) throw error;
    },
    onSuccess: (_data, { classId, date }) => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.forDate(classId, date) });
    },
  });
}

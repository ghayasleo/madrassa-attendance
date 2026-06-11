import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useActiveMadrassaId } from '@/context/ActiveMadrassaContext';

export const dashboardKeys = {
  stats: (madrassaId: string | null) => ['dashboard', 'stats', madrassaId] as const,
};

export type DashboardStats = {
  students: number;
  classes: number;
  teachers: number;
};

async function countOf(
  table: 'students' | 'classes',
  madrassaId: string,
  filterActive = true,
): Promise<number> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('madrassa_id', madrassaId);
  if (filterActive) query = query.eq('is_active', true);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function useDashboardStats(isAdmin: boolean) {
  const madrassaId = useActiveMadrassaId();
  return useQuery({
    queryKey: dashboardKeys.stats(madrassaId),
    enabled: !!madrassaId,
    queryFn: async (): Promise<DashboardStats> => {
      const mid = madrassaId!;
      const [students, classes] = await Promise.all([
        countOf('students', mid),
        countOf('classes', mid),
      ]);
      let teachers = 0;
      if (isAdmin) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'teacher')
          .eq('madrassa_id', mid);
        teachers = count ?? 0;
      }
      return { students, classes, teachers };
    },
  });
}

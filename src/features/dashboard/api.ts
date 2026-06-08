import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
};

export type DashboardStats = {
  students: number;
  classes: number;
  teachers: number;
};

async function countOf(table: 'students' | 'classes', filterActive = true): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filterActive) query = query.eq('is_active', true);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function useDashboardStats(isAdmin: boolean) {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: async (): Promise<DashboardStats> => {
      const [students, classes] = await Promise.all([countOf('students'), countOf('classes')]);
      let teachers = 0;
      if (isAdmin) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'teacher');
        teachers = count ?? 0;
      }
      return { students, classes, teachers };
    },
  });
}

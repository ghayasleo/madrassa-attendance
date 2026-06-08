import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Subject } from '@/types/database';

export const subjectKeys = {
  all: ['subjects'] as const,
};

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.all,
    queryFn: async (): Promise<Subject[]> => {
      const { data, error } = await supabase.from('subjects').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

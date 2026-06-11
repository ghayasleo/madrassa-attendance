import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useActiveMadrassaId } from '@/context/ActiveMadrassaContext';
import type { Subject } from '@/types/database';

export const subjectKeys = {
  all: ['subjects'] as const,
  list: (madrassaId: string | null) => ['subjects', madrassaId] as const,
};

export function useSubjects() {
  const madrassaId = useActiveMadrassaId();
  return useQuery({
    queryKey: subjectKeys.list(madrassaId),
    enabled: !!madrassaId,
    queryFn: async (): Promise<Subject[]> => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('madrassa_id', madrassaId!)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

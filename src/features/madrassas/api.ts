import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database, Madrassa } from '@/types/database';

type MadrassaUpdate = Database['public']['Tables']['madrassas']['Update'];

export type MadrassaWithCounts = Madrassa & {
  members: { count: number }[];
  students: { count: number }[];
};

export const madrassaKeys = {
  all: ['madrassas'] as const,
};

/** All madrassas with member + student counts (super_admin only). */
export function useMadrassas() {
  return useQuery({
    queryKey: madrassaKeys.all,
    queryFn: async (): Promise<MadrassaWithCounts[]> => {
      const { data, error } = await supabase
        .from('madrassas')
        .select('*, members:profiles(count), students:students(count)')
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as MadrassaWithCounts[];
    },
  });
}

export type MadrassaInput = {
  name: string;
  address?: string | null;
  phone?: string | null;
};

export function useCreateMadrassa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MadrassaInput) => {
      const { error } = await supabase.from('madrassas').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: madrassaKeys.all }),
  });
}

export function useUpdateMadrassa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & MadrassaUpdate) => {
      const { error } = await supabase.from('madrassas').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: madrassaKeys.all }),
  });
}

export function useDeleteMadrassa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('madrassas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: madrassaKeys.all }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { StudentWithSubject } from '@/types/app';

type StudentUpdate = Database['public']['Tables']['students']['Update'];

export const studentKeys = {
  all: ['students'] as const,
  detail: (id: string) => ['students', id] as const,
};

export function useStudents() {
  return useQuery({
    queryKey: studentKeys.all,
    queryFn: async (): Promise<StudentWithSubject[]> => {
      const { data, error } = await supabase
        .from('students')
        .select('*, subject:subjects(name)')
        .order('full_name');
      if (error) throw error;
      return (data ?? []) as unknown as StudentWithSubject[];
    },
  });
}

export type StudentInput = {
  full_name: string;
  guardian_name?: string | null;
  phone?: string | null;
  subject_id?: string | null;
};

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('students')
        .insert({ ...input, created_by: auth.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & StudentUpdate) => {
      const { error } = await supabase.from('students').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

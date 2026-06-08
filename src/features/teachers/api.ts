import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export const teacherKeys = {
  all: ['teachers'] as const,
};

export function useTeachers() {
  return useQuery({
    queryKey: teacherKeys.all,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type CreateTeacherInput = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
};

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTeacherInput) => {
      const { data, error } = await supabase.functions.invoke('create-teacher', {
        body: input,
      });
      // Edge function returns { error } in body for handled failures.
      if (error) {
        // Try to surface the function's JSON error message.
        const ctx = error as { context?: { body?: string } };
        let message = error.message;
        try {
          if (ctx.context?.body) {
            const parsed = JSON.parse(ctx.context.body);
            if (parsed?.error) message = parsed.error;
          }
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.all }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<Profile, 'full_name' | 'phone' | 'is_active'>>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.all }),
  });
}

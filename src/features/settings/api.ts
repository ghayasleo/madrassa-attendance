import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type ProfileUpdateInput = {
  full_name: string;
  phone?: string | null;
};

export function useUpdateOwnProfile() {
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & ProfileUpdateInput) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id);
      if (error) throw error;
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile, Role } from '@/types/database';

export type UserWithMadrassa = Profile & {
  madrassa: { name: string } | null;
};

export const userKeys = {
  all: ['users'] as const,
};

/** Invoke the super-admin manage-user edge function, surfacing its JSON error. */
async function invokeManageUser(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('manage-user', { body });
  if (error) {
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
}

/** All managed users (admins + teachers) with their madrassa name. */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: async (): Promise<UserWithMadrassa[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, madrassa:madrassas(name)')
        .neq('role', 'super_admin')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as UserWithMadrassa[];
    },
  });
}

export type CreateUserInput = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: Exclude<Role, 'super_admin'>;
  madrassa_id: string;
};

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => invokeManageUser({ action: 'create', ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export type UpdateUserInput = {
  id: string;
  full_name?: string;
  phone?: string | null;
  is_active?: boolean;
  role?: Exclude<Role, 'super_admin'>;
  madrassa_id?: string | null;
};

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => invokeManageUser({ action: 'update', ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      invokeManageUser({ action: 'setPassword', id, password }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invokeManageUser({ action: 'delete', id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

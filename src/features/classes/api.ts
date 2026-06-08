import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database, Student } from '@/types/database';
import type { ClassWithMeta } from '@/types/app';

type ClassUpdate = Database['public']['Tables']['classes']['Update'];

export const classKeys = {
  all: ['classes'] as const,
  students: (classId: string) => ['classes', classId, 'students'] as const,
};

export function useClasses() {
  return useQuery({
    queryKey: classKeys.all,
    queryFn: async (): Promise<ClassWithMeta[]> => {
      const { data, error } = await supabase
        .from('classes')
        .select('*, subject:subjects(name), teacher:profiles(full_name), enrollment:class_students(count)')
        .order('start_time');
      if (error) throw error;
      return (data ?? []) as unknown as ClassWithMeta[];
    },
  });
}

export type ClassInput = {
  name: string;
  subject_id?: string | null;
  teacher_id?: string | null;
  start_time: string;
  end_time: string;
};

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassInput) => {
      const { error } = await supabase.from('classes').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & ClassUpdate) => {
      const { error } = await supabase.from('classes').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
}

/** Students enrolled in a class. */
export function useClassStudents(classId: string | null) {
  return useQuery({
    queryKey: classId ? classKeys.students(classId) : ['classes', 'none', 'students'],
    enabled: !!classId,
    queryFn: async (): Promise<Student[]> => {
      const { data, error } = await supabase
        .from('class_students')
        .select('student:students(*)')
        .eq('class_id', classId!);
      if (error) throw error;
      return (data ?? [])
        .map((row) => (row as unknown as { student: Student | null }).student)
        .filter((s): s is Student => !!s)
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
  });
}

/** Raised when the DB overlap trigger rejects an enrolment. */
export class ClassOverlapError extends Error {
  conflictName: string;
  constructor(conflictName: string) {
    super('CLASS_TIME_OVERLAP');
    this.name = 'ClassOverlapError';
    this.conflictName = conflictName;
  }
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      const { error } = await supabase
        .from('class_students')
        .insert({ class_id: classId, student_id: studentId });
      if (error) {
        const match = /CLASS_TIME_OVERLAP:\s*(.*)$/.exec(error.message);
        if (match) throw new ClassOverlapError(match[1].trim());
        throw error;
      }
    },
    onSuccess: (_data, { classId }) => {
      void qc.invalidateQueries({ queryKey: classKeys.students(classId) });
      void qc.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);
      if (error) throw error;
    },
    onSuccess: (_data, { classId }) => {
      void qc.invalidateQueries({ queryKey: classKeys.students(classId) });
      void qc.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

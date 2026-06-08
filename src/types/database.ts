// Hand-written DB types mirroring supabase/migrations.
// Keep in sync with the SQL, or regenerate with:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts

export type Role = 'admin' | 'teacher';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string;
          email: string;
          phone: string | null;
          is_active: boolean;
        } & Timestamps;
        Insert: {
          id: string;
          role?: Role;
          full_name: string;
          email: string;
          phone?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      subjects: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: Partial<{ id: string; name: string }>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          guardian_name: string | null;
          phone: string | null;
          subject_id: string | null;
          is_active: boolean;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          full_name: string;
          guardian_name?: string | null;
          phone?: string | null;
          subject_id?: string | null;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          subject_id: string | null;
          teacher_id: string | null;
          start_time: string;
          end_time: string;
          is_active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          subject_id?: string | null;
          teacher_id?: string | null;
          start_time: string;
          end_time: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
        Relationships: [];
      };
      class_students: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: { id?: string; class_id: string; student_id: string; created_at?: string };
        Update: Partial<{ class_id: string; student_id: string }>;
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          date: string;
          status: AttendanceStatus;
          note: string | null;
          marked_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          date?: string;
          status?: AttendanceStatus;
          note?: string | null;
          marked_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}

// Convenience row aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type ClassRow = Database['public']['Tables']['classes']['Row'];
export type ClassStudent = Database['public']['Tables']['class_students']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];

import type { Student, ClassRow, Attendance } from './database';

export type StudentWithSubject = Student & {
  subject: { name: string } | null;
  classes: { class: { id: string; name: string } | null }[];
};

export type ClassWithMeta = ClassRow & {
  subject: { name: string } | null;
  teacher: { full_name: string } | null;
  enrollment: { count: number }[];
};

export type AttendanceWithStudent = Attendance & {
  student: { full_name: string } | null;
};

export type AttendanceWithClass = Attendance & {
  class: { name: string } | null;
};

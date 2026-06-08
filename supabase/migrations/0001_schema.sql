-- =====================================================================
-- 0001_schema.sql — Core tables for the Madrassa Attendance System
-- =====================================================================

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles: one row per Supabase Auth user (admins + teachers)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'teacher' check (role in ('admin', 'teacher')),
  full_name   text not null,
  email       text not null,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- subjects: shared list (Hifz, Nazra, Science, ...)
-- ---------------------------------------------------------------------
create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- students: plain records created by teachers (NOT auth users)
-- ---------------------------------------------------------------------
create table if not exists public.students (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  guardian_name text,
  phone         text,
  subject_id    uuid references public.subjects (id) on delete set null,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- classes: a recurring daily time slot taught by a teacher
-- ---------------------------------------------------------------------
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  subject_id  uuid references public.subjects (id) on delete set null,
  teacher_id  uuid references public.profiles (id) on delete set null,
  start_time  time not null,
  end_time    time not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint classes_time_valid check (end_time > start_time)
);

-- ---------------------------------------------------------------------
-- class_students: many-to-many enrolment (a student may be in many
-- non-overlapping classes)
-- ---------------------------------------------------------------------
create table if not exists public.class_students (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (class_id, student_id)
);

-- ---------------------------------------------------------------------
-- attendance: one row per (class, student, date)
-- ---------------------------------------------------------------------
create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  date        date not null default current_date,
  status      text not null default 'present'
                check (status in ('present', 'absent', 'late', 'excused')),
  note        text,
  marked_by   uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (class_id, student_id, date)
);

-- ---------------------------------------------------------------------
-- Indexes for the common access paths / reports
-- ---------------------------------------------------------------------
create index if not exists idx_students_subject       on public.students (subject_id);
create index if not exists idx_classes_teacher        on public.classes (teacher_id);
create index if not exists idx_classes_subject        on public.classes (subject_id);
create index if not exists idx_class_students_class   on public.class_students (class_id);
create index if not exists idx_class_students_student on public.class_students (student_id);
create index if not exists idx_attendance_class_date  on public.attendance (class_id, date);
create index if not exists idx_attendance_student_date on public.attendance (student_id, date);
create index if not exists idx_attendance_date        on public.attendance (date);

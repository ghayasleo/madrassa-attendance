-- =====================================================================
-- 0007_multitenancy_schema.sql — madrassas + per-tenant columns
--
-- Tenant data tables are empty after 0006, so madrassa_id can be NOT NULL
-- from the start.
-- =====================================================================

-- ---------------------------------------------------------------------
-- madrassas: one row per tenant (school).
-- ---------------------------------------------------------------------
create table if not exists public.madrassas (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_madrassas_updated_at on public.madrassas;
create trigger trg_madrassas_updated_at before update on public.madrassas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- profiles.madrassa_id — NULL for super_admin, set for admin/teacher.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists madrassa_id uuid references public.madrassas (id) on delete set null;

-- ---------------------------------------------------------------------
-- Tenant scoping columns on every data table (NOT NULL; tables are empty).
-- ---------------------------------------------------------------------
alter table public.subjects
  add column if not exists madrassa_id uuid not null references public.madrassas (id) on delete cascade;

alter table public.students
  add column if not exists madrassa_id uuid not null references public.madrassas (id) on delete cascade;

alter table public.classes
  add column if not exists madrassa_id uuid not null references public.madrassas (id) on delete cascade;

alter table public.class_students
  add column if not exists madrassa_id uuid not null references public.madrassas (id) on delete cascade;

alter table public.attendance
  add column if not exists madrassa_id uuid not null references public.madrassas (id) on delete cascade;

-- ---------------------------------------------------------------------
-- subjects: names are unique per-madrassa now, not globally.
-- ---------------------------------------------------------------------
alter table public.subjects drop constraint if exists subjects_name_key;
alter table public.subjects drop constraint if exists subjects_madrassa_name_key;
alter table public.subjects
  add constraint subjects_madrassa_name_key unique (madrassa_id, name);

-- ---------------------------------------------------------------------
-- Indexes for tenant-scoped access paths.
-- ---------------------------------------------------------------------
create index if not exists idx_profiles_madrassa       on public.profiles (madrassa_id);
create index if not exists idx_subjects_madrassa        on public.subjects (madrassa_id);
create index if not exists idx_students_madrassa        on public.students (madrassa_id);
create index if not exists idx_classes_madrassa         on public.classes (madrassa_id);
create index if not exists idx_class_students_madrassa  on public.class_students (madrassa_id);
create index if not exists idx_attendance_madrassa      on public.attendance (madrassa_id);

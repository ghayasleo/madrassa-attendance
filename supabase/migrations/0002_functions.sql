-- =====================================================================
-- 0002_functions.sql — helper functions & triggers
-- =====================================================================

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at before update on public.students
  for each row execute function public.set_updated_at();

drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at before update on public.classes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at before update on public.attendance
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Role helpers — SECURITY DEFINER so they can read profiles without
-- being blocked by (or recursing into) RLS policies.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- ---------------------------------------------------------------------
-- Enforce: a student may not be enrolled in two classes whose daily
-- time ranges overlap. Half-open overlap: a.start < b.end AND b.start < a.end
-- ---------------------------------------------------------------------
create or replace function public.check_student_class_overlap()
returns trigger
language plpgsql
as $$
declare
  v_start time;
  v_end   time;
  v_conflict text;
begin
  select start_time, end_time into v_start, v_end
  from public.classes
  where id = new.class_id;

  select c.name into v_conflict
  from public.class_students cs
  join public.classes c on c.id = cs.class_id
  where cs.student_id = new.student_id
    and cs.class_id <> new.class_id
    and c.start_time < v_end
    and v_start < c.end_time
  limit 1;

  if v_conflict is not null then
    raise exception 'CLASS_TIME_OVERLAP: %', v_conflict
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_class_students_overlap on public.class_students;
create trigger trg_class_students_overlap
  before insert or update on public.class_students
  for each row execute function public.check_student_class_overlap();

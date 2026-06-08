-- =====================================================================
-- 0003_rls.sql — Row Level Security
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.subjects       enable row level security;
alter table public.students       enable row level security;
alter table public.classes        enable row level security;
alter table public.class_students enable row level security;
alter table public.attendance     enable row level security;

-- ---------------------------------------------------------------------
-- profiles
--   * a user can read & update their own row
--   * admins can read / insert / update / delete everything
--   * NOTE: teacher rows are created by the create-teacher edge function
--     using the service role, which bypasses RLS.
-- ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- subjects — staff read, staff write
-- ---------------------------------------------------------------------
drop policy if exists subjects_select on public.subjects;
create policy subjects_select on public.subjects
  for select to authenticated using (public.is_staff());

drop policy if exists subjects_write on public.subjects;
create policy subjects_write on public.subjects
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------
-- students / classes / class_students / attendance
--   any active staff member (teacher or admin) may read & write.
-- ---------------------------------------------------------------------
drop policy if exists students_all on public.students;
create policy students_all on public.students
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists classes_all on public.classes;
create policy classes_all on public.classes
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists class_students_all on public.class_students;
create policy class_students_all on public.class_students
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

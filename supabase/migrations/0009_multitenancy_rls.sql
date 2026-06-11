-- =====================================================================
-- 0009_multitenancy_rls.sql — tenant-scoped Row Level Security
--
-- Model:
--   super_admin  -> full access to everything (all madrassas, all users)
--   admin/teacher-> access limited to their own madrassa_id
-- =====================================================================

alter table public.madrassas enable row level security;

-- ---------------------------------------------------------------------
-- madrassas
--   * super_admin manages all
--   * staff may read their own madrassa
-- ---------------------------------------------------------------------
drop policy if exists madrassas_super on public.madrassas;
create policy madrassas_super on public.madrassas
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists madrassas_read_own on public.madrassas;
create policy madrassas_read_own on public.madrassas
  for select to authenticated
  using (id = public.current_madrassa_id());

-- ---------------------------------------------------------------------
-- profiles
--   * a user reads & updates their own row
--   * super_admin reads/writes everyone
--   * an admin reads profiles within their own madrassa
--   * inserts/deletes are super_admin only; teacher creation uses the
--     create-teacher edge function (service role, bypasses RLS)
-- ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_super_admin()
    or (public.is_admin() and madrassa_id = public.current_madrassa_id())
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------
-- Tenant data tables: super_admin OR (staff within their madrassa).
-- ---------------------------------------------------------------------
drop policy if exists subjects_select on public.subjects;
drop policy if exists subjects_write on public.subjects;
drop policy if exists subjects_all on public.subjects;
create policy subjects_all on public.subjects
  for all to authenticated
  using (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()))
  with check (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()));

drop policy if exists students_all on public.students;
create policy students_all on public.students
  for all to authenticated
  using (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()))
  with check (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()));

drop policy if exists classes_all on public.classes;
create policy classes_all on public.classes
  for all to authenticated
  using (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()))
  with check (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()));

drop policy if exists class_students_all on public.class_students;
create policy class_students_all on public.class_students
  for all to authenticated
  using (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()))
  with check (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()));

drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance
  for all to authenticated
  using (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()))
  with check (public.is_super_admin() or (public.is_staff() and madrassa_id = public.current_madrassa_id()));

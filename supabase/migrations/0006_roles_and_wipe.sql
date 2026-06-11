-- =====================================================================
-- 0006_roles_and_wipe.sql — introduce super_admin + reset all data
--
-- DESTRUCTIVE: removes every student/class/attendance row and every auth
-- user EXCEPT the super-admin (ghayasleo99@gmail.com). Run once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Expand the role check to allow 'super_admin'.
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'teacher'));

-- ---------------------------------------------------------------------
-- 2. Wipe all tenant data (subjects become per-madrassa, so clear them too).
-- ---------------------------------------------------------------------
truncate table
  public.attendance,
  public.class_students,
  public.students,
  public.classes,
  public.subjects
  restart identity cascade;

-- ---------------------------------------------------------------------
-- 3. Remove every auth user except the super-admin. The profiles row is
--    removed automatically via profiles.id -> auth.users(id) ON DELETE CASCADE.
-- ---------------------------------------------------------------------
delete from auth.users
where lower(email) <> 'ghayasleo99@gmail.com';

-- ---------------------------------------------------------------------
-- 4. Promote the remaining account to super_admin.
-- ---------------------------------------------------------------------
update public.profiles
set role = 'super_admin'
where lower(email) = 'ghayasleo99@gmail.com';

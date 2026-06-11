-- =====================================================================
-- 0008_multitenancy_functions.sql — tenant helpers + default subjects
-- =====================================================================

-- ---------------------------------------------------------------------
-- Role / tenant helpers (SECURITY DEFINER so they read profiles without
-- recursing into RLS), mirroring is_admin()/is_staff() in 0002.
-- ---------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and is_active
  );
$$;

-- The caller's madrassa (NULL for super_admin). Used by tenant RLS policies.
create or replace function public.current_madrassa_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select madrassa_id from public.profiles where id = auth.uid();
$$;

-- is_admin() keeps its meaning: an active 'admin'. is_staff() is unchanged
-- (any active profile) and is redefined here only to be explicit.
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

-- ---------------------------------------------------------------------
-- Seed default subjects whenever a madrassa is created.
-- ---------------------------------------------------------------------
create or replace function public.seed_madrassa_subjects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subjects (madrassa_id, name)
  values
    (new.id, 'Hifz'),
    (new.id, 'Nazra'),
    (new.id, 'Tajweed'),
    (new.id, 'Science'),
    (new.id, 'Mathematics'),
    (new.id, 'English')
  on conflict (madrassa_id, name) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_madrassas_seed_subjects on public.madrassas;
create trigger trg_madrassas_seed_subjects
  after insert on public.madrassas
  for each row execute function public.seed_madrassa_subjects();

-- ---------------------------------------------------------------------
-- The anon role never needs these helpers (policies are `to authenticated`).
-- ---------------------------------------------------------------------
revoke execute on function public.is_super_admin() from anon;
revoke execute on function public.current_madrassa_id() from anon;

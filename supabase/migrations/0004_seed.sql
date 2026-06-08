-- =====================================================================
-- 0004_seed.sql — seed data + bootstrap the first admin
-- =====================================================================

-- Common subjects (safe to run repeatedly)
insert into public.subjects (name) values
  ('Hifz'),
  ('Nazra'),
  ('Tajweed'),
  ('Science'),
  ('Mathematics'),
  ('English')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Bootstrap the FIRST ADMIN
-- ---------------------------------------------------------------------
-- Auth users cannot be created from SQL with a hashed password safely,
-- so do this once, manually:
--
--   1. Supabase Dashboard → Authentication → Users → "Add user"
--      Create a user with the admin's email + password.
--   2. Copy that user's UUID.
--   3. Run the snippet below (replace the placeholders) in the SQL editor:
--
-- insert into public.profiles (id, role, full_name, email, phone)
-- values (
--   '00000000-0000-0000-0000-000000000000',  -- <-- auth user UUID
--   'admin',
--   'Madrassa Administrator',
--   'admin@example.com',
--   '+920000000000'
-- )
-- on conflict (id) do update
--   set role = 'admin', is_active = true;
--
-- After that, the admin signs in and creates teachers from the app.

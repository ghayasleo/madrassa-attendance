-- =====================================================================
-- 0005_security.sql — security hardening (addresses Supabase advisors)
-- =====================================================================

-- Pin search_path on the trigger functions (advisor 0011).
alter function public.set_updated_at() set search_path = public;
alter function public.check_student_class_overlap() set search_path = public;

-- is_admin()/is_staff() are SECURITY DEFINER helpers used only inside RLS
-- policies, which are all `to authenticated`. The anon role never needs them,
-- so remove its RPC access (advisor 0028). authenticated keeps EXECUTE because
-- policy evaluation requires it.
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_staff() from anon;

// =====================================================================
// create-teacher — admin-only edge function to provision a teacher.
//
// Flow:
//   1. Verify the caller's JWT belongs to an active ADMIN.
//   2. Use the service role to create the auth user + profile (role=teacher).
//
// Deploy:  supabase functions deploy create-teacher
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//          (the first two are injected automatically by Supabase)
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json(401, { error: 'Missing Authorization header' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Identify the caller.
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await caller.auth.getUser();
    if (!user) {
      return json(401, { error: 'Invalid session' });
    }

    // 2. Confirm the caller is an active admin (service role bypasses RLS).
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, is_active, madrassa_id')
      .eq('id', user.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return json(403, { error: 'Only an admin can create teachers' });
    }
    if (!callerProfile.madrassa_id) {
      return json(400, { error: 'Your account is not assigned to a madrassa' });
    }

    // 3. Validate input.
    const body = await req.json().catch(() => null);
    const full_name = (body?.full_name ?? '').toString().trim();
    const email = (body?.email ?? '').toString().trim().toLowerCase();
    const password = (body?.password ?? '').toString();
    const phone = body?.phone ? body.phone.toString().trim() : null;

    if (!full_name) return json(400, { error: 'full_name is required' });
    if (!email || !email.includes('@')) return json(400, { error: 'A valid email is required' });
    if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters' });

    // 4. Create the auth user.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'teacher' },
    });
    if (createErr || !created.user) {
      return json(400, { error: createErr?.message ?? 'Could not create user' });
    }

    // 5. Create the profile. Roll back the auth user if it fails.
    const { error: profileErr } = await admin.from('profiles').insert({
      id: created.user.id,
      role: 'teacher',
      full_name,
      email,
      phone,
      madrassa_id: callerProfile.madrassa_id,
    });
    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json(400, { error: profileErr.message });
    }

    return json(200, {
      teacher: { id: created.user.id, full_name, email, phone },
    });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Unexpected error' });
  }
});

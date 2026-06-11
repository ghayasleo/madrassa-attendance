// =====================================================================
// manage-user — super-admin-only edge function to manage any user.
//
// Actions (POST JSON { action, ... }):
//   create      { full_name, email, password, phone?, role, madrassa_id? }
//   update      { id, full_name?, phone?, is_active?, role?, madrassa_id? }
//   setPassword { id, password }
//   delete      { id }
//
// Flow: verify the caller's JWT belongs to an active super_admin, then use
// the service role to perform the operation.
//
// Deploy:  supabase functions deploy manage-user
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type Role = 'admin' | 'teacher';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(401, { error: 'Missing Authorization header' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Identify the caller. Pass the bearer token explicitly to getUser():
    //    the no-arg form depends on session storage that doesn't exist in an
    //    edge function, and its header-reading behaviour drifts across
    //    supabase-js patch versions.
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: userErr } = await caller.auth.getUser(token);
    if (userErr || !user) {
      return json(401, { error: `Invalid session${userErr ? `: ${userErr.message}` : ''}` });
    }

    // 2. Confirm the caller is an active super_admin (service role bypasses RLS).
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();
    if (!callerProfile || callerProfile.role !== 'super_admin' || !callerProfile.is_active) {
      return json(403, { error: 'Only a super admin can manage users' });
    }

    // 3. Dispatch.
    const body = await req.json().catch(() => null);
    const action = (body?.action ?? '').toString();

    if (action === 'create') {
      const full_name = (body?.full_name ?? '').toString().trim();
      const email = (body?.email ?? '').toString().trim().toLowerCase();
      const password = (body?.password ?? '').toString();
      const phone = body?.phone ? body.phone.toString().trim() : null;
      const role = (body?.role ?? '').toString() as Role;
      const madrassa_id = body?.madrassa_id ? body.madrassa_id.toString() : null;

      if (!full_name) return json(400, { error: 'full_name is required' });
      if (!email || !email.includes('@')) return json(400, { error: 'A valid email is required' });
      if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters' });
      if (role !== 'admin' && role !== 'teacher') return json(400, { error: 'role must be admin or teacher' });
      if (!madrassa_id) return json(400, { error: 'A madrassa is required' });

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
      });
      if (createErr || !created.user) {
        return json(400, { error: createErr?.message ?? 'Could not create user' });
      }

      const { error: profileErr } = await admin.from('profiles').insert({
        id: created.user.id,
        role,
        full_name,
        email,
        phone,
        madrassa_id,
      });
      if (profileErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json(400, { error: profileErr.message });
      }

      return json(200, { user: { id: created.user.id, full_name, email, phone, role, madrassa_id } });
    }

    if (action === 'update') {
      const id = (body?.id ?? '').toString();
      if (!id) return json(400, { error: 'id is required' });

      const patch: Record<string, unknown> = {};
      if (body?.full_name !== undefined) patch.full_name = body.full_name.toString().trim();
      if (body?.phone !== undefined) patch.phone = body.phone ? body.phone.toString().trim() : null;
      if (body?.is_active !== undefined) patch.is_active = Boolean(body.is_active);
      if (body?.role !== undefined) {
        const role = body.role.toString();
        if (role !== 'admin' && role !== 'teacher') return json(400, { error: 'role must be admin or teacher' });
        patch.role = role;
      }
      if (body?.madrassa_id !== undefined) {
        patch.madrassa_id = body.madrassa_id ? body.madrassa_id.toString() : null;
      }

      if (Object.keys(patch).length === 0) return json(400, { error: 'Nothing to update' });

      const { error } = await admin.from('profiles').update(patch).eq('id', id);
      if (error) return json(400, { error: error.message });
      return json(200, { ok: true });
    }

    if (action === 'setPassword') {
      const id = (body?.id ?? '').toString();
      const password = (body?.password ?? '').toString();
      if (!id) return json(400, { error: 'id is required' });
      if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters' });

      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return json(400, { error: error.message });
      return json(200, { ok: true });
    }

    if (action === 'delete') {
      const id = (body?.id ?? '').toString();
      if (!id) return json(400, { error: 'id is required' });
      if (id === user.id) return json(400, { error: 'You cannot delete your own account' });

      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json(400, { error: error.message });
      return json(200, { ok: true });
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Unexpected error' });
  }
});

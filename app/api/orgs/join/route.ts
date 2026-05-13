import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  // Must use service role: the orgs_select RLS policy only allows users to see orgs
  // they already belong to, so a non-member can't look up an org by invite_code.
  const { data: org, error: orgErr } = await adminClient()
    .from('organizations')
    .select('id, name')
    .eq('invite_code', code.trim().toUpperCase())
    .single();

  if (orgErr || !org) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

  // Check already a member (user can see their own row — safe with user-level client)
  const { data: existing } = await sb
    .from('org_members')
    .select('id')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return NextResponse.json(org);

  const { error: joinErr } = await sb
    .from('org_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'member' });

  if (joinErr) return NextResponse.json({ error: joinErr.message }, { status: 500 });

  return NextResponse.json(org, { status: 201 });
}

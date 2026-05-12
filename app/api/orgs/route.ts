import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

// GET /api/orgs — list orgs the current user belongs to
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data, error } = await sb
    .from('org_members')
    .select('role, joined_at, organizations(id, name, invite_code, created_by, created_at)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orgs = (data ?? []).map((m: any) => ({
    ...m.organizations,
    role: m.role,
    joinedAt: m.joined_at,
  }));

  return NextResponse.json(orgs);
}

// POST /api/orgs — create org
export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const orgId = randomUUID();

  // Step 1: insert org (no .select() — avoids RLS check on orgs_select before member exists)
  const { error: orgErr } = await sb
    .from('organizations')
    .insert({ id: orgId, name: name.trim(), created_by: user.id });

  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });

  // Step 2: add creator as owner
  const { error: memberErr } = await sb
    .from('org_members')
    .insert({ org_id: orgId, user_id: user.id, role: 'owner' });

  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });

  // Step 3: now read org back (member exists → orgs_select policy passes)
  const { data: org, error: readErr } = await sb
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (readErr) {
    // Still return enough for redirect even if read fails
    return NextResponse.json({ id: orgId, name: name.trim() }, { status: 201 });
  }

  return NextResponse.json(org, { status: 201 });
}

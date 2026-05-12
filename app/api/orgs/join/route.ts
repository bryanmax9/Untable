import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const { data: org, error: orgErr } = await sb
    .from('organizations')
    .select('id, name')
    .eq('invite_code', code.trim().toUpperCase())
    .single();

  if (orgErr || !org) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

  // Check already a member
  const { data: existing } = await sb
    .from('org_members')
    .select('id')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return NextResponse.json(org); // already member — just redirect

  const { error: joinErr } = await sb
    .from('org_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'member' });

  if (joinErr) return NextResponse.json({ error: joinErr.message }, { status: 500 });

  return NextResponse.json(org, { status: 201 });
}

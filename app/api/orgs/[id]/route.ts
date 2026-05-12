import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listProjects } from '@/lib/server/storage';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: member, error: memberErr } = await sb
    .from('org_members')
    .select('role')
    .eq('org_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });
  if (!member)   return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  const { data: org, error: orgErr } = await sb
    .from('organizations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });
  if (!org)   return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 });

  const allProjects = await listProjects(id);
  const projects = allProjects.map(p => ({
    id: p.id,
    name: p.name,
    original_filename: p.originalFilename,
    created_at: p.createdAt,
  }));

  return NextResponse.json({ org, projects, myRole: member.role });
}

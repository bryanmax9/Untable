import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// PATCH /api/orgs/[id]/drive — save the Drive folder URL for this org
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  // Only owners/admins can set the folder URL
  const { data: member } = await sb.from('org_members')
    .select('role').eq('org_id', id).eq('user_id', user.id).maybeSingle();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Only owners and admins can set the Drive folder' }, { status: 403 });
  }

  const { drive_folder_url } = await req.json();

  const { error } = await sb.from('organizations')
    .update({ drive_folder_url: drive_folder_url ?? null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

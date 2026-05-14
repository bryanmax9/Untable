import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken, sheetsListTabs } from '@/lib/server/google-api';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: spreadsheetId } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const token = await getValidToken(user.id);
    const tabs   = await sheetsListTabs(token, spreadsheetId);
    return NextResponse.json(tabs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

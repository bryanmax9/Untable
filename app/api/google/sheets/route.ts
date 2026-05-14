import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken, driveListSpreadsheets } from '@/lib/server/google-api';

export const runtime = 'nodejs';

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const token = await getValidToken(user.id);
    const files  = await driveListSpreadsheets(token);
    return NextResponse.json(files);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

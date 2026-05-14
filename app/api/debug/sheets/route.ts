import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getGoogleTokens, isTokenExpired } from '@/lib/server/google-tokens';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Get the project from ?projectId=
  const projectId = req.nextUrl.searchParams.get('projectId');
  const report: Record<string, unknown> = { userId: user.id };

  // 1. Check stored token
  const tokens = await getGoogleTokens(user.id);
  if (!tokens) {
    report.tokenStatus = 'NO TOKEN STORED — user must sign out and sign back in';
    return NextResponse.json(report);
  }
  report.tokenStatus = 'found';
  report.tokenExpired = isTokenExpired(tokens.expires_at);
  report.tokenExpiresAt = tokens.expires_at;
  report.scopes = tokens.scopes;
  report.hasRefreshToken = !!tokens.refresh_token;

  let token = tokens.access_token;
  // Try refresh if expired
  if (isTokenExpired(tokens.expires_at) && tokens.refresh_token) {
    const refRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refresh_token,
        grant_type:    'refresh_token',
      }),
    });
    const refData = await refRes.json();
    if (refRes.ok && refData.access_token) {
      token = refData.access_token;
      report.tokenRefreshed = true;
    } else {
      report.tokenRefreshError = refData.error ?? 'refresh failed';
    }
  }

  // 2. Get project spreadsheet info
  let spreadsheetId: string | null = null;
  let sheetTab: string | null = null;
  if (projectId) {
    const { data: proj } = await admin.from('projects')
      .select('spreadsheet_id, sheet_tab, created_by').eq('id', projectId).maybeSingle();
    report.projectSpreadsheetId = proj?.spreadsheet_id ?? null;
    report.projectSheetTab      = proj?.sheet_tab ?? null;
    report.projectCreatedBy     = proj?.created_by ?? null;
    spreadsheetId = proj?.spreadsheet_id ?? null;
    sheetTab = proj?.sheet_tab ?? null;
  }

  if (!spreadsheetId || !sheetTab) {
    report.note = 'Pass ?projectId=YOUR_PROJECT_ID to test sheet access';
    return NextResponse.json(report);
  }

  // 3. Test READ
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTab)}!A1:B2`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const readData = await readRes.json();
  report.readStatus  = readRes.status;
  report.readOk      = readRes.ok;
  report.readSample  = readRes.ok ? readData.values?.slice(0, 2) : readData?.error;

  // 4. Test WRITE (writes an empty string to cell A1 — harmless)
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: [{ range: `${sheetTab}!ZZ1`, values: [['_test_']] }],
      }),
    },
  );
  const writeData = await writeRes.json();
  report.writeStatus = writeRes.status;
  report.writeOk     = writeRes.ok;
  report.writeError  = writeRes.ok ? null : (writeData?.error?.message ?? writeData);

  // Clean up test cell
  if (writeRes.ok) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueInputOption: 'RAW', data: [{ range: `${sheetTab}!ZZ1`, values: [['']] }] }),
      },
    );
  }

  return NextResponse.json(report, { status: 200 });
}

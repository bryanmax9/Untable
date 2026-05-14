import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getGoogleTokens, isTokenExpired } from '@/lib/server/google-tokens';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const report: Record<string, unknown> = { userId: user.id };

  // 1. Check stored token
  const tokens = await getGoogleTokens(user.id);
  if (!tokens) {
    report.tokenStatus = 'NO TOKEN — sign out and sign back in';
    return NextResponse.json(report);
  }
  report.tokenStatus    = 'found';
  report.tokenExpired   = isTokenExpired(tokens.expires_at);
  report.scopes         = tokens.scopes;
  report.hasRefreshToken = !!tokens.refresh_token;

  let token = tokens.access_token;
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
    if (refRes.ok && refData.access_token) { token = refData.access_token; report.tokenRefreshed = true; }
    else report.tokenRefreshError = refData.error ?? 'refresh failed';
  }

  // 2. Resolve spreadsheetId + sheetTab — from direct params OR project lookup
  let spreadsheetId = req.nextUrl.searchParams.get('spreadsheetId') ?? null;
  let sheetTab      = req.nextUrl.searchParams.get('sheetTab') ?? null;

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (projectId && (!spreadsheetId || !sheetTab)) {
    try {
      const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      );
      const { data: proj, error: projErr } = await admin
        .from('projects')
        .select('spreadsheet_id, sheet_tab, created_by')
        .eq('id', projectId)
        .maybeSingle();
      report.projectLookupError = projErr?.message ?? null;
      report.projectSpreadsheetId = proj?.spreadsheet_id ?? null;
      report.projectSheetTab      = proj?.sheet_tab ?? null;
      report.projectCreatedBy     = proj?.created_by ?? null;
      spreadsheetId = proj?.spreadsheet_id ?? null;
      sheetTab      = proj?.sheet_tab ?? null;
    } catch (e) {
      report.projectLookupException = String(e);
    }
  }

  if (!spreadsheetId || !sheetTab) {
    report.note = 'Pass ?spreadsheetId=SHEET_ID&sheetTab=TAB_NAME (or ?projectId=...) to test sheet access. Get spreadsheetId from the Google Sheets URL.';
    return NextResponse.json(report);
  }

  report.testingSpreadsheetId = spreadsheetId;
  report.testingSheetTab      = sheetTab;

  // 3. Test READ
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTab)}!A1:C2`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const readData = await readRes.json();
  report.readStatus = readRes.status;
  report.readOk     = readRes.ok;
  report.readSample = readRes.ok ? (readData.values ?? []) : readData?.error;

  // 4. Test WRITE (writes to an out-of-range cell, then clears it)
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: [{ range: `${sheetTab}!ZZ1`, values: [['_test_ok_']] }],
      }),
    },
  );
  const writeData = await writeRes.json();
  report.writeStatus = writeRes.status;
  report.writeOk     = writeRes.ok;
  report.writeError  = writeRes.ok ? null : (writeData?.error?.message ?? JSON.stringify(writeData));

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
    report.writeNote = 'Test cell ZZ1 was written then cleared';
  }

  return NextResponse.json(report);
}

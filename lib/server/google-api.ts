import { getGoogleTokens, saveGoogleTokens, isTokenExpired } from './google-tokens';

export async function getValidToken(userId: string): Promise<string> {
  const tokens = await getGoogleTokens(userId);
  if (!tokens) throw new Error('No Google credentials found. Please sign out and sign in again.');

  if (!isTokenExpired(tokens.expires_at)) return tokens.access_token;

  if (!tokens.refresh_token) throw new Error('Session expired. Please sign out and sign in again.');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error('Failed to refresh Google session. Please sign in again.');

  await saveGoogleTokens(userId, data.access_token, tokens.refresh_token, tokens.scopes);
  return data.access_token as string;
}

export async function driveListSpreadsheets(token: string): Promise<{
  id: string; name: string; modifiedTime: string; webViewLink: string;
}[]> {
  const params = new URLSearchParams({
    q:         "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields:    'files(id,name,modifiedTime,webViewLink)',
    orderBy:   'modifiedTime desc',
    pageSize:  '50',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  return data.files ?? [];
}

export async function sheetsListTabs(token: string, spreadsheetId: string): Promise<{
  title: string; sheetId: number; rowCount: number; columnCount: number;
}[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);
  const data = await res.json();
  return (data.sheets ?? []).map((s: any) => ({
    title:       s.properties.title,
    sheetId:     s.properties.sheetId,
    rowCount:    s.properties.gridProperties?.rowCount ?? 0,
    columnCount: s.properties.gridProperties?.columnCount ?? 0,
  }));
}

export async function sheetsGetValues(token: string, spreadsheetId: string, tabName: string): Promise<string[][]> {
  const range = encodeURIComponent(tabName);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Sheets API error reading values: ${res.status}`);
  const data = await res.json();
  return data.values ?? [];
}

export interface SheetFullData {
  values:            string[][];
  hyperlinks:        (string | null)[][];  // per cell — Drive URL embedded in cell
  colValidations:    (string[] | null)[];  // per column — dropdown options from data validation
}

// Fetches values + embedded hyperlinks + data validation rules in one request.
// Used when connecting a sheet so we detect dropdowns and Drive links correctly.
export async function sheetsGetFullData(
  token: string, spreadsheetId: string, tabName: string,
): Promise<SheetFullData> {
  const range  = encodeURIComponent(tabName);
  const fields = 'sheets.data.rowData.values(formattedValue,hyperlink,dataValidation)';
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}` +
    `?includeGridData=true&ranges=${range}&fields=${encodeURIComponent(fields)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Sheets full-data error ${res.status}`);
  }
  const data    = await res.json();
  const rowData = data.sheets?.[0]?.data?.[0]?.rowData ?? [];

  const values:     string[][]           = rowData.map((row: any) =>
    (row.values ?? []).map((cell: any) => cell.formattedValue ?? ''));

  const hyperlinks: (string | null)[][] = rowData.map((row: any) =>
    (row.values ?? []).map((cell: any) => (cell.hyperlink as string | undefined) ?? null));

  // Collect dropdown options per column from data validation
  const maxCols = Math.max(...rowData.map((r: any) => (r.values ?? []).length), 0);
  const colValidations: (string[] | null)[] = new Array(maxCols).fill(null);
  for (const row of rowData) {
    const cells = (row.values ?? []) as any[];
    for (let ci = 0; ci < cells.length; ci++) {
      if (colValidations[ci]) continue;
      const dv = cells[ci]?.dataValidation;
      if (dv?.condition?.type === 'ONE_OF_LIST') {
        const opts = ((dv.condition.values ?? []) as any[])
          .map((v: any) => String(v.userEnteredValue ?? '')).filter(Boolean);
        if (opts.length > 0) colValidations[ci] = opts;
      }
    }
  }

  return { values, hyperlinks, colValidations };
}

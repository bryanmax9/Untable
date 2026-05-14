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

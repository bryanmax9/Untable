import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getValidToken } from '@/lib/server/google-api';

export const runtime = 'nodejs';

function colLetter(idx: number): string {
  let s = ''; let n = idx + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function norm(v: unknown): string {
  if (v == null) return '';
  return String(v).trim().toLowerCase().replace(/\s+/g, ' ');
}

async function findSheetRow(
  token: string, spreadsheetId: string, sheetTab: string,
  rowData: Record<string, unknown>,
  schema: { columns: { id: string; excelHeader: string }[] },
): Promise<number | null> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTab)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const rows: string[][] = data.values ?? [];
  if (rows.length < 2) return null;
  const headers = rows[0];

  // Build map: excelHeader → sheet column index (case-insensitive, trimmed)
  const headerIdx: Record<string, number> = {};
  headers.forEach((h, i) => { headerIdx[h.trim().toLowerCase()] = i; });

  // Collect non-empty stored values for matching
  const nonEmptyCols = schema.columns.filter(col => {
    if (col.id.startsWith('_')) return false;
    const v = rowData[col.id];
    return v != null && String(v).trim() !== '';
  });

  let bestRow: number | null = null;
  let bestScore = -1;

  for (let ri = 1; ri < rows.length; ri++) {
    const row = rows[ri];
    if (!row.some(c => c != null && c !== '')) continue;
    let matched = 0, total = 0;
    for (const col of nonEmptyCols) {
      const ci = headerIdx[col.excelHeader.trim().toLowerCase()];
      if (ci === undefined) continue;
      total++;
      const stored = norm(rowData[col.id]);
      const sheet  = norm(row[ci]);
      if (stored === sheet) matched++;
    }
    if (total > 0) {
      const score = matched / total;
      if (score >= 0.6 && score > bestScore) { bestScore = score; bestRow = ri + 1; }
    }
  }

  if (bestRow) return bestRow;

  // Last-resort: match by first non-empty text value that appears somewhere in a row
  const firstVal = norm(nonEmptyCols[0] ? rowData[nonEmptyCols[0].id] : null);
  if (firstVal.length > 3) {
    for (let ri = 1; ri < rows.length; ri++) {
      if (rows[ri].some(c => norm(c) === firstVal)) return ri + 1;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { projectId, recordId, patch } = await req.json();
  if (!projectId || !recordId || !patch) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: project } = await admin
    .from('projects').select('spreadsheet_id, sheet_tab, created_by').eq('id', projectId).maybeSingle();

  if (!project?.spreadsheet_id || !project?.sheet_tab) return NextResponse.json({ ok: true, skipped: 'not_a_sheet_project' });

  const { data: sections } = await admin
    .from('sections').select('id, schema_json').eq('project_id', projectId).order('section_idx').limit(1);
  const section = sections?.[0];
  if (!section) return NextResponse.json({ ok: true, skipped: 'no_section' });

  const { data: record } = await admin
    .from('records').select('row_data').eq('id', recordId).eq('section_id', section.id).maybeSingle();

  const ownerId = project.created_by ?? user.id;
  const token   = await getValidToken(ownerId);
  const schema  = section.schema_json as { columns: { id: string; excelHeader: string }[] };

  // Find which sheet row this record corresponds to
  let sheetRow: number | null = (record?.row_data as Record<string, unknown>)?._sheet_row as number ?? null;

  if (!sheetRow) {
    // Fallback: scan the sheet and match by content similarity (≥70% field match)
    sheetRow = await findSheetRow(token, project.spreadsheet_id, project.sheet_tab, record?.row_data ?? {}, schema);
  }

  if (!sheetRow) return NextResponse.json({ ok: true, skipped: 'row_not_found' });

  // Get header row to map column names → column letters
  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${project.spreadsheet_id}/values/${encodeURIComponent(project.sheet_tab)}!1:1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!headerRes.ok) return NextResponse.json({ ok: true, skipped: 'header_fetch_failed' });
  const headers: string[] = (await headerRes.json()).values?.[0] ?? [];
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => { headerIndex[h] = i; });

  const data: { range: string; values: string[][] }[] = [];
  for (const [colId, value] of Object.entries(patch)) {
    if (colId.startsWith('_')) continue;
    const col = schema.columns.find(c => c.id === colId);
    if (!col) continue;
    const ci = headerIndex[col.excelHeader];
    if (ci === undefined) continue;
    data.push({ range: `${project.sheet_tab}!${colLetter(ci)}${sheetRow}`, values: [[String(value ?? '')]] });
  }

  if (data.length === 0) return NextResponse.json({ ok: true, skipped: 'nothing_to_update' });

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${project.spreadsheet_id}/values:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
    },
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    return NextResponse.json({ error: err?.error?.message ?? 'Sheets write failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: data.length, sheetRow });
}

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

interface SchemaCol { id: string; excelHeader: string }

// Finds the actual header row in the sheet by matching against known column headers.
// Sheets may have a title row before the real headers — never assume row 0 is the header.
function detectHeaderRow(rows: string[][], schemaHeaders: string[]): { headers: string[]; headerIdx: number } {
  const known = new Set(schemaHeaders.map(h => h.trim().toLowerCase()));
  let bestIdx = 0, bestScore = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const score = (rows[i] ?? []).filter(c => known.has((c ?? '').trim().toLowerCase())).length;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return { headers: rows[bestIdx] ?? [], headerIdx: bestIdx };
}

async function findSheetRow(
  token: string,
  spreadsheetId: string,
  sheetTab: string,
  rowData: Record<string, unknown>,
  columns: SchemaCol[],
  identifierColId?: string,
): Promise<number | null> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTab)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const allRows: string[][] = (await res.json()).values ?? [];
  if (allRows.length < 2) return null;

  // Find the real header row (not necessarily row 0)
  const schemaHeaders = columns.map(c => c.excelHeader);
  const { headers, headerIdx } = detectHeaderRow(allRows, schemaHeaders);

  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => { headerMap[h.trim().toLowerCase()] = i; });

  // Data rows start after the header row
  const dataRows = allRows.slice(headerIdx + 1);

  // Strategy 1: exact match on identifier column
  if (identifierColId) {
    const idVal = norm(rowData[identifierColId]);
    if (idVal) {
      const idCol = columns.find(c => c.id === identifierColId);
      if (idCol) {
        const ci = headerMap[idCol.excelHeader.trim().toLowerCase()];
        if (ci !== undefined) {
          for (let ri = 0; ri < dataRows.length; ri++) {
            if (norm(dataRows[ri][ci]) === idVal) return headerIdx + 1 + ri + 1; // 1-indexed sheet row
          }
        }
      }
    }
  }

  // Strategy 2: best-score content match ≥50%
  const nonEmpty = columns.filter(col => {
    if (col.id.startsWith('_')) return false;
    const v = rowData[col.id];
    return v != null && String(v).trim() !== '';
  });

  let bestRow: number | null = null;
  let bestScore = -1;

  for (let ri = 0; ri < dataRows.length; ri++) {
    const row = dataRows[ri];
    if (!row?.some(c => c != null && c !== '')) continue;
    let matched = 0, total = 0;
    for (const col of nonEmpty) {
      const ci = headerMap[col.excelHeader.trim().toLowerCase()];
      if (ci === undefined) continue;
      total++;
      if (norm(rowData[col.id]) === norm(row[ci])) matched++;
    }
    if (total > 0) {
      const score = matched / total;
      if (score >= 0.5 && score > bestScore) { bestScore = score; bestRow = headerIdx + 1 + ri + 1; }
    }
  }
  if (bestRow) return bestRow;

  // Strategy 3: single field match on first 3 non-empty columns
  for (const col of nonEmpty.slice(0, 3)) {
    const v = norm(rowData[col.id]);
    if (v.length < 3) continue;
    for (let ri = 0; ri < dataRows.length; ri++) {
      if ((dataRows[ri] ?? []).some(c => norm(c) === v)) return headerIdx + 1 + ri + 1;
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

  if (!project?.spreadsheet_id || !project?.sheet_tab) {
    return NextResponse.json({ ok: true, skipped: 'not_a_sheet_project' });
  }

  const { data: sections } = await admin
    .from('sections').select('id, schema_json, bindings_json')
    .eq('project_id', projectId).order('section_idx').limit(1);
  const section = sections?.[0];
  if (!section) return NextResponse.json({ ok: true, skipped: 'no_section' });

  const { data: record } = await admin
    .from('records').select('row_data').eq('id', recordId).eq('section_id', section.id).maybeSingle();

  const ownerId = project.created_by ?? user.id;
  const token   = await getValidToken(ownerId);
  const schema  = section.schema_json as { columns: SchemaCol[] };
  const bindings = (section.bindings_json ?? {}) as Record<string, string>;
  const identifierColId = bindings.identifier;
  const schemaHeaders = schema.columns.map(c => c.excelHeader);

  // Find which sheet row this record maps to
  let sheetRow: number | null = (record?.row_data as Record<string, unknown>)?._sheet_row as number ?? null;

  if (!sheetRow) {
    sheetRow = await findSheetRow(
      token, project.spreadsheet_id, project.sheet_tab,
      (record?.row_data ?? {}) as Record<string, unknown>,
      schema.columns,
      identifierColId,
    );
    // Persist to avoid re-scanning next time
    if (sheetRow && record) {
      await admin.from('records').update({
        row_data: { ...(record.row_data as object), _sheet_row: sheetRow },
      }).eq('id', recordId);
    }
  }

  if (!sheetRow) return NextResponse.json({ ok: true, skipped: 'row_not_found' });

  // Fetch first 10 rows to detect the actual header row
  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${project.spreadsheet_id}/values/${encodeURIComponent(project.sheet_tab)}!1:10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!headerRes.ok) return NextResponse.json({ ok: true, skipped: 'header_fetch_failed' });
  const first10: string[][] = (await headerRes.json()).values ?? [];
  const { headers } = detectHeaderRow(first10, schemaHeaders);

  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => { headerIndex[h.trim().toLowerCase()] = i; });

  const data: { range: string; values: string[][] }[] = [];
  for (const [colId, value] of Object.entries(patch)) {
    if (colId.startsWith('_')) continue;
    const col = schema.columns.find(c => c.id === colId);
    if (!col) continue;
    const ci = headerIndex[col.excelHeader.trim().toLowerCase()];
    if (ci === undefined) continue;
    data.push({ range: `${project.sheet_tab}!${colLetter(ci)}${sheetRow}`, values: [[String(value ?? '')]] });
  }

  if (data.length === 0) return NextResponse.json({ ok: true, skipped: 'nothing_to_update', sheetRow, headers: headers.slice(0, 5) });

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

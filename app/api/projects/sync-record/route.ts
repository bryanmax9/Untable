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
  return String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

interface SchemaCol { id: string; excelHeader: string }

// Finds the header row by checking which row best matches the known column headers.
function findHeaderIdx(rows: string[][], knownHeaders: string[]): number {
  const known = new Set(knownHeaders.map(h => h.trim().toLowerCase()));
  let bestIdx = 0, bestScore = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const score = (rows[i] ?? []).filter(c => known.has(norm(c))).length;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx;
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { projectId, recordId, patch } = await req.json();
  if (!projectId || !recordId || !patch) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

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

  if (!record) return NextResponse.json({ ok: true, skipped: 'record_not_found' });

  const ownerId = project.created_by ?? user.id;
  const token   = await getValidToken(ownerId);
  const schema  = section.schema_json as { columns: SchemaCol[] };
  const bindings = (section.bindings_json ?? {}) as Record<string, string>;
  const rowData  = (record.row_data ?? {}) as Record<string, unknown>;
  const knownHeaders = schema.columns.map(c => c.excelHeader);

  // Read the entire sheet once — used for both header detection and row lookup
  const sheetRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${project.spreadsheet_id}/values/${encodeURIComponent(project.sheet_tab)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!sheetRes.ok) {
    const err = await sheetRes.json().catch(() => ({}));
    return NextResponse.json({ error: `Sheet read failed: ${err?.error?.message ?? sheetRes.status}` }, { status: 500 });
  }
  const allRows: string[][] = (await sheetRes.json()).values ?? [];
  if (allRows.length < 2) return NextResponse.json({ ok: true, skipped: 'sheet_empty' });

  const headerIdx = findHeaderIdx(allRows, knownHeaders);
  const headers   = allRows[headerIdx] ?? [];

  // Build header → column index map (case-insensitive)
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => { headerMap[norm(h)] = i; });

  // ── Find the sheet row that matches this record ─────────────────────────
  let sheetRow: number | null = null;

  // Strategy 1: stored _sheet_row (fastest — skip scan)
  const storedRow = rowData._sheet_row;
  if (storedRow != null && Number(storedRow) > headerIdx + 1) {
    sheetRow = Number(storedRow);
  }

  // Strategy 2: match by identifier column (N°) — exact, reliable
  if (!sheetRow) {
    const idColId = bindings.identifier;
    if (idColId) {
      const idVal = norm(rowData[idColId]);
      if (idVal) {
        const idCol = schema.columns.find(c => c.id === idColId);
        if (idCol) {
          const ci = headerMap[norm(idCol.excelHeader)];
          if (ci !== undefined) {
            for (let ri = headerIdx + 1; ri < allRows.length; ri++) {
              if (norm(allRows[ri][ci]) === idVal) { sheetRow = ri + 1; break; }
            }
          }
        }
      }
    }
  }

  // Strategy 3: best content match across all non-empty fields (≥50%)
  if (!sheetRow) {
    const nonEmpty = schema.columns.filter(col => {
      if (col.id.startsWith('_')) return false;
      const v = rowData[col.id];
      return v != null && String(v).trim() !== '';
    });
    let bestRow = -1, bestScore = -1;
    for (let ri = headerIdx + 1; ri < allRows.length; ri++) {
      const row = allRows[ri];
      if (!row?.some(c => c)) continue;
      let matched = 0, total = 0;
      for (const col of nonEmpty) {
        const ci = headerMap[norm(col.excelHeader)];
        if (ci === undefined) continue;
        total++;
        if (norm(rowData[col.id]) === norm(row[ci])) matched++;
      }
      if (total > 0 && matched / total >= 0.5 && matched > bestScore) {
        bestScore = matched; bestRow = ri;
      }
    }
    if (bestRow >= 0) sheetRow = bestRow + 1;
  }

  if (!sheetRow) {
    return NextResponse.json({ ok: true, skipped: 'row_not_found', rowDataKeys: Object.keys(rowData).join(',') });
  }

  // ── Build batchUpdate ranges ─────────────────────────────────────────────
  const data: { range: string; values: string[][] }[] = [];
  for (const [colId, value] of Object.entries(patch)) {
    if (colId.startsWith('_')) continue;
    const col = schema.columns.find(c => c.id === colId);
    if (!col) continue;
    const ci = headerMap[norm(col.excelHeader)];
    if (ci === undefined) continue;
    data.push({
      range:  `${project.sheet_tab}!${colLetter(ci)}${sheetRow}`,
      values: [[String(value ?? '')]],
    });
  }

  if (data.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'nothing_to_update', sheetRow });
  }

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

  // Cache discovered sheetRow so future edits skip the scan
  if (!storedRow) {
    await admin.from('records').update({
      row_data: { ...rowData, _sheet_row: sheetRow },
    }).eq('id', recordId);
  }

  return NextResponse.json({ ok: true, updated: data.length, sheetRow });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getValidToken } from '@/lib/server/google-api';

export const runtime = 'nodejs';

function colLetter(idx: number): string {
  let s = '';
  let n = idx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// POST /api/projects/sync-record
// Body: { projectId, recordId, patch: Record<columnId, value> }
// Writes patched fields back to the connected Google Sheet using the project owner's token.
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

  // Fetch project metadata (spreadsheet_id, sheet_tab, created_by, schema)
  const { data: project } = await admin
    .from('projects')
    .select('spreadsheet_id, sheet_tab, created_by')
    .eq('id', projectId)
    .maybeSingle();

  if (!project?.spreadsheet_id || !project?.sheet_tab) {
    return NextResponse.json({ ok: true, skipped: 'not_a_sheet_project' });
  }

  // Fetch the record to get _sheet_row and current row_data
  const { data: sections } = await admin
    .from('sections')
    .select('id, schema_json')
    .eq('project_id', projectId)
    .order('section_idx')
    .limit(1);
  const section = sections?.[0];
  if (!section) return NextResponse.json({ ok: true, skipped: 'no_section' });

  const { data: record } = await admin
    .from('records')
    .select('row_data')
    .eq('id', recordId)
    .eq('section_id', section.id)
    .maybeSingle();

  const sheetRow: number | undefined = record?.row_data?._sheet_row;
  if (!sheetRow) return NextResponse.json({ ok: true, skipped: 'no_sheet_row' });

  // Build column header → sheet column index map from the header row
  const ownerId = project.created_by ?? user.id;
  const token = await getValidToken(ownerId);

  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${project.spreadsheet_id}/values/${encodeURIComponent(project.sheet_tab)}!1:1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!headerRes.ok) return NextResponse.json({ ok: true, skipped: 'header_fetch_failed' });
  const headerData = await headerRes.json();
  const headers: string[] = headerData.values?.[0] ?? [];

  // Map schema column excelHeader → sheet column index
  const schema = section.schema_json as { columns: { id: string; excelHeader: string }[] };
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => { headerIndex[h] = i; });

  // Build the batch update data
  const data: { range: string; values: string[][] }[] = [];
  for (const [colId, value] of Object.entries(patch)) {
    if (colId.startsWith('_')) continue; // skip internal fields
    const col = schema.columns.find(c => c.id === colId);
    if (!col) continue;
    const colIdx = headerIndex[col.excelHeader];
    if (colIdx === undefined) continue;
    const a1 = `${project.sheet_tab}!${colLetter(colIdx)}${sheetRow}`;
    data.push({ range: a1, values: [[String(value ?? '')]] });
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

  return NextResponse.json({ ok: true, updated: data.length });
}

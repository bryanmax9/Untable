import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getValidToken, sheetsGetFullData } from '@/lib/server/google-api';
import { parseGoogleSheetValues } from '@/lib/server/google-sheets-reader';
import { classifyDomain } from '@/lib/classifier/domain';
import { bindColumns, buildColorMaps } from '@/lib/binder/binder';

export const runtime = 'nodejs';

function norm(v: unknown): string {
  if (v == null) return '';
  return String(v).trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: project } = await admin
    .from('projects').select('id, spreadsheet_id, sheet_tab').eq('id', projectId).maybeSingle();

  if (!project?.spreadsheet_id || !project?.sheet_tab) {
    return NextResponse.json({ error: 'Not a Google Sheets project' }, { status: 400 });
  }

  try {
    const token = await getValidToken(user.id);
    const { values, hyperlinks, colValidations } = await sheetsGetFullData(
      token, project.spreadsheet_id, project.sheet_tab,
    );
    if (!values.length) return NextResponse.json({ error: 'Sheet appears to be empty' }, { status: 400 });

    const { schema, rows } = parseGoogleSheetValues(values, project.sheet_tab, hyperlinks, colValidations);
    const { domain } = classifyDomain(schema.columns.map(c => c.excelHeader));
    const bindings = bindColumns(schema, domain);
    const colorMaps = buildColorMaps(schema, bindings);

    // Update section schema without touching records
    const { data: sectionData, error: secErr } = await admin.from('sections')
      .update({ domain, schema_json: schema, bindings_json: bindings, color_maps_json: colorMaps })
      .eq('project_id', projectId).eq('section_idx', 0)
      .select('id').single();
    if (secErr) throw new Error(`Section update failed: ${secErr.message}`);

    const sectionId = sectionData.id;

    // Fetch all existing records (keep their UUIDs — do NOT delete/re-insert)
    const { data: existingRecords } = await admin
      .from('records').select('id, row_data').eq('section_id', sectionId);

    // Build index of sheet rows keyed by normalized cell values for fast lookup
    // rows[] from parser already have _sheet_row set to the correct 1-indexed sheet row
    const sheetIndex: Map<string, number> = new Map();
    for (const row of rows) {
      const sheetRow = (row._sheet_row as unknown as number);
      // Index by every non-empty field value so we can match existing records
      for (const [k, v] of Object.entries(row)) {
        if (k.startsWith('_') || !v) continue;
        const key = `${k}::${norm(v)}`;
        if (!sheetIndex.has(key)) sheetIndex.set(key, sheetRow);
      }
    }

    // For each existing record, find its correct _sheet_row by matching field values
    let updated = 0;
    for (const rec of existingRecords ?? []) {
      const rowData = (rec.row_data ?? {}) as Record<string, unknown>;
      let bestSheetRow: number | null = null;
      let bestScore = 0;

      // Count how many field values match each candidate sheet row
      const scores: Map<number, number> = new Map();
      for (const [k, v] of Object.entries(rowData)) {
        if (k.startsWith('_') || !v) continue;
        const key = `${k}::${norm(v)}`;
        const sr = sheetIndex.get(key);
        if (sr) scores.set(sr, (scores.get(sr) ?? 0) + 1);
      }
      for (const [sr, score] of scores) {
        if (score > bestScore) { bestScore = score; bestSheetRow = sr; }
      }

      if (bestSheetRow && bestScore >= 1) {
        await admin.from('records')
          .update({ row_data: { ...rowData, _sheet_row: bestSheetRow } })
          .eq('id', rec.id);
        updated++;
      }
    }

    return NextResponse.json({ ok: true, rowCount: rows.length, updatedRecords: updated, domain });
  } catch (e) {
    console.error('Reconnect error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

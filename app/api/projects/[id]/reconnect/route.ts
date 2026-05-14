import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getValidToken, sheetsGetFullData } from '@/lib/server/google-api';
import { parseGoogleSheetValues } from '@/lib/server/google-sheets-reader';
import { classifyDomain } from '@/lib/classifier/domain';
import { bindColumns, buildColorMaps } from '@/lib/binder/binder';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

function norm(v: unknown): string {
  return String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
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

    // Update section schema
    const { data: sectionData, error: secErr } = await admin.from('sections')
      .update({ domain, schema_json: schema, bindings_json: bindings, color_maps_json: colorMaps })
      .eq('project_id', projectId).eq('section_idx', 0)
      .select('id').single();
    if (secErr) throw new Error(`Section update failed: ${secErr.message}`);

    const sectionId = sectionData.id;
    const identifierColId = (bindings as Record<string, string>).identifier;

    // Fetch all existing DB records
    const { data: existingRecords } = await admin
      .from('records').select('id, row_data').eq('section_id', sectionId);
    const dbRecords = existingRecords ?? [];

    // Build a lookup: identifier value → DB record id
    const dbByIdentifier = new Map<string, { id: string; row_data: Record<string, unknown> }>();
    const dbBySheetRow   = new Map<number, { id: string; row_data: Record<string, unknown> }>();
    for (const rec of dbRecords) {
      const rd = (rec.row_data ?? {}) as Record<string, unknown>;
      if (identifierColId) {
        const idVal = norm(rd[identifierColId]);
        if (idVal) dbByIdentifier.set(idVal, { id: rec.id, row_data: rd });
      }
      const sr = rd._sheet_row as number | undefined;
      if (sr) dbBySheetRow.set(sr, { id: rec.id, row_data: rd });
    }

    const matchedDbIds = new Set<string>();
    const upserts: { id: string; section_id: string; row_data: Record<string, unknown> }[] = [];

    for (const sheetRow of rows) {
      const sheetRowData = { ...sheetRow } as Record<string, unknown>;
      delete sheetRowData._id;

      // Find matching DB record: by identifier → by _sheet_row → no match (new)
      let dbMatch: { id: string; row_data: Record<string, unknown> } | undefined;

      if (identifierColId) {
        const idVal = norm(sheetRow[identifierColId] as unknown);
        if (idVal) dbMatch = dbByIdentifier.get(idVal);
      }
      if (!dbMatch) {
        const sr = sheetRow._sheet_row as unknown as number | undefined;
        if (sr) dbMatch = dbBySheetRow.get(sr);
      }

      const recordId = dbMatch?.id ?? uuidv4();
      if (dbMatch) matchedDbIds.add(dbMatch.id);

      upserts.push({ id: recordId, section_id: sectionId, row_data: sheetRowData });
    }

    // Delete DB records that no longer exist in the sheet
    const toDelete = dbRecords.filter(r => !matchedDbIds.has(r.id)).map(r => r.id);
    if (toDelete.length > 0) {
      await admin.from('records').delete().in('id', toDelete);
    }

    // Upsert all sheet rows in batches of 200
    const BATCH = 200;
    for (let i = 0; i < upserts.length; i += BATCH) {
      const { error } = await admin.from('records')
        .upsert(upserts.slice(i, i + BATCH), { onConflict: 'id' });
      if (error) throw new Error(`Record upsert failed: ${error.message}`);
    }

    return NextResponse.json({
      ok: true,
      rowCount: rows.length,
      inserted: upserts.filter(u => !matchedDbIds.has(u.id) && dbRecords.some(d => d.id === u.id) === false).length,
      deleted: toDelete.length,
      domain,
    });
  } catch (e) {
    console.error('Reconnect error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

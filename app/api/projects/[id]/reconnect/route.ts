import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getValidToken, sheetsGetFullData } from '@/lib/server/google-api';
import { parseGoogleSheetValues } from '@/lib/server/google-sheets-reader';
import { classifyDomain } from '@/lib/classifier/domain';
import { bindColumns, buildColorMaps } from '@/lib/binder/binder';
import { writeRecords } from '@/lib/server/storage';

export const runtime = 'nodejs';

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
    .from('projects')
    .select('id, spreadsheet_id, sheet_tab')
    .eq('id', projectId)
    .maybeSingle();

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

    // Update the section with fresh schema, bindings, and color maps
    const { error: secErr } = await admin.from('sections').update({
      domain,
      schema_json:     schema,
      bindings_json:   bindings,
      color_maps_json: colorMaps,
    }).eq('project_id', projectId).eq('section_idx', 0);
    if (secErr) throw new Error(`Section update failed: ${secErr.message}`);

    // Re-write all records with _sheet_row so write-back is precise going forward
    const rowsWithIdx = rows.map((row, i) => ({ ...row, _sheet_row: i + 2 }));
    await writeRecords(projectId, 0, rowsWithIdx);

    return NextResponse.json({ ok: true, rowCount: rows.length, domain });
  } catch (e) {
    console.error('Reconnect error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

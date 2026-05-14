import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { getValidToken, sheetsGetFullData } from '@/lib/server/google-api';
import { parseGoogleSheetValues } from '@/lib/server/google-sheets-reader';
import { classifyDomain } from '@/lib/classifier/domain';
import { bindColumns, buildColorMaps } from '@/lib/binder/binder';
import { saveProject, writeRecords } from '@/lib/server/storage';
import type { StoredProject, ProjectSection } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { spreadsheetId, tabName, projectName, orgId } = await req.json();
  if (!spreadsheetId || !tabName) {
    return NextResponse.json({ error: 'spreadsheetId and tabName are required' }, { status: 400 });
  }

  try {
    const token = await getValidToken(user.id);

    // Fetch values + embedded hyperlinks + data validation rules in one request
    const { values, hyperlinks, colValidations } = await sheetsGetFullData(token, spreadsheetId, tabName);
    if (!values.length) return NextResponse.json({ error: 'Sheet appears to be empty' }, { status: 400 });

    // Run the same 3-layer pipeline, now with validation/hyperlink metadata
    const { schema, rows } = parseGoogleSheetValues(values, tabName, hyperlinks, colValidations);
    const { domain }       = classifyDomain(schema.columns.map(c => c.excelHeader));
    const bindings         = bindColumns(schema, domain);
    const colorMaps        = buildColorMaps(schema, bindings);

    const section: ProjectSection = { sheetName: tabName, domain, schema, bindings, colorMaps };
    const projectId = uuidv4();
    const name = (projectName?.trim()) || tabName;

    const project: StoredProject = {
      id: projectId,
      orgId: orgId || undefined,
      name,
      originalFilename: '',
      createdAt: new Date().toISOString(),
      sections: [section],
    };

    await saveProject(project, user.id);

    // _sheet_row is already set correctly on each row by parseGoogleSheetValues
    // (origIdx + 1 = 1-indexed sheet row, accounts for title rows before the header)
    await writeRecords(projectId, 0, rows);

    // Store spreadsheet_id + sheet_tab on the project row for Phase 3 sync
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    await admin.from('projects').update({ spreadsheet_id: spreadsheetId, sheet_tab: tabName }).eq('id', projectId);

    return NextResponse.json({ id: projectId, name }, { status: 201 });
  } catch (e) {
    console.error('Connect sheet error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

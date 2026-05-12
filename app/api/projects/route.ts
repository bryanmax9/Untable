import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSheetInfos, parseSheet } from '@/lib/server/excel-reader';
import { classifyDomain } from '@/lib/classifier/domain';
import { bindColumns, buildColorMaps } from '@/lib/binder/binder';
import { listProjects, saveProject, saveExcelBuffer, writeRecords, getTotalRowCount } from '@/lib/server/storage';
import type { StoredProject, ProjectSection } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('org') ?? undefined;
    const projects = await listProjects(orgId);
    const items = await Promise.all(projects.map(async p => ({
      id: p.id,
      orgId: p.orgId,
      name: p.name,
      originalFilename: p.originalFilename,
      createdAt: p.createdAt,
      sectionCount: p.sections.length,
      totalRows: await getTotalRowCount(p.id),
      domains: p.sections.map(s => s.domain),
    })));
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const selectedSheets = (formData.get('sheets') as string | null)?.split(',').filter(Boolean) ?? [];
    const name = (formData.get('name') as string | null)?.trim() || 'Mi proyecto';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (selectedSheets.length === 0) return NextResponse.json({ error: 'No sheets selected' }, { status: 400 });

    const orgId = (formData.get('orgId') as string | null)?.trim() || undefined;
    const buffer = Buffer.from(await file.arrayBuffer());
    const projectId = uuidv4();

    await saveExcelBuffer(projectId, buffer);

    // Parse all sheets first
    const sections: ProjectSection[] = [];
    const allRows: ReturnType<typeof parseSheet>['rows'][] = [];
    for (const sheetName of selectedSheets) {
      const { schema, rows } = parseSheet(buffer, sheetName);
      const { domain } = classifyDomain(schema.columns.map(c => c.excelHeader));
      const bindings = bindColumns(schema, domain);
      const colorMaps = buildColorMaps(schema, bindings);
      sections.push({ sheetName, domain, schema, bindings, colorMaps });
      allRows.push(rows);
    }

    // Save project + sections to DB first so section IDs exist
    const project: StoredProject = {
      id: projectId,
      orgId,
      name,
      originalFilename: file.name,
      createdAt: new Date().toISOString(),
      sections,
    };
    await saveProject(project);

    // Now write records (sections exist in DB)
    for (let i = 0; i < sections.length; i++) {
      await writeRecords(projectId, i, allRows[i]);
    }
    return NextResponse.json({ id: projectId, name }, { status: 201 });
  } catch (e) {
    console.error('Create project error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

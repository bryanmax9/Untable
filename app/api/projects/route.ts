import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSheetInfos, parseSheet } from '@/lib/server/excel-reader';
import { classifyDomain } from '@/lib/classifier/domain';
import { bindColumns, buildColorMaps } from '@/lib/binder/binder';
import { listProjects, saveProject, saveExcelBuffer, writeRecords, getTotalRowCount, readRecords } from '@/lib/server/storage';
import type { StoredProject, ProjectSection } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const projects = listProjects();
    const items = projects.map(p => ({
      id: p.id,
      name: p.name,
      originalFilename: p.originalFilename,
      createdAt: p.createdAt,
      sectionCount: p.sections.length,
      totalRows: getTotalRowCount(p.id, p),
      domains: p.sections.map(s => s.domain),
    }));
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const projectId = uuidv4();

    // Save original Excel
    saveExcelBuffer(projectId, buffer);

    // Parse each selected sheet
    const sections: ProjectSection[] = [];
    for (const sheetName of selectedSheets) {
      const { schema, rows } = parseSheet(buffer, sheetName);
      const { domain } = classifyDomain(schema.columns.map(c => c.excelHeader));
      const bindings = bindColumns(schema, domain);
      const colorMaps = buildColorMaps(schema, bindings);

      sections.push({ sheetName, domain, schema, bindings, colorMaps });
      writeRecords(projectId, sections.length - 1, rows);
    }

    const project: StoredProject = {
      id: projectId,
      name,
      originalFilename: file.name,
      createdAt: new Date().toISOString(),
      sections,
    };

    saveProject(project);
    return NextResponse.json({ id: projectId, name }, { status: 201 });
  } catch (e) {
    console.error('Create project error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

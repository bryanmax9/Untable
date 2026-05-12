import { NextRequest, NextResponse } from 'next/server';
import { getProject, readRecords } from '@/lib/server/storage';
import { generateExcelBuffer } from '@/lib/server/excel-writer';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allRecords = await Promise.all(project.sections.map((_, i) => readRecords(id, i)));
  const buffer = generateExcelBuffer(project, allRecords);

  const filename = project.originalFilename.replace(/\.[^.]+$/, '') + '_updated.xlsx';

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

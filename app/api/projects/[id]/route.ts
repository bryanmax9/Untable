import { NextRequest, NextResponse } from 'next/server';
import { getProject, readRecords, deleteProject } from '@/lib/server/storage';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sections = project.sections.map((section, i) => ({
    ...section,
    records: readRecords(id, i),
  }));

  return NextResponse.json({ ...project, sections });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  deleteProject(id);
  return NextResponse.json({ ok: true });
}

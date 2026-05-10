import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateRecord, deleteRecord } from '@/lib/server/storage';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string; rowId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, rowId } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sectionIdx = Number(req.nextUrl.searchParams.get('section') ?? '0');
  const patch = await req.json() as Record<string, string | number | boolean | null>;

  const updated = updateRecord(id, sectionIdx, rowId, patch);
  if (!updated) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id, rowId } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sectionIdx = Number(req.nextUrl.searchParams.get('section') ?? '0');
  const ok = deleteRecord(id, sectionIdx, rowId);
  if (!ok) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

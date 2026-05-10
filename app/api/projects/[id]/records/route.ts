import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getProject, addRecord, readRecords } from '@/lib/server/storage';
import type { Row } from '@/lib/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sectionIdx = Number(req.nextUrl.searchParams.get('section') ?? '0');
  const records = readRecords(id, sectionIdx);
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sectionIdx = Number(req.nextUrl.searchParams.get('section') ?? '0');
  const body = await req.json() as Record<string, unknown>;

  const row: Row = { _id: uuidv4() };
  for (const [k, v] of Object.entries(body)) {
    if (k !== '_id') row[k] = v as Row[string];
  }

  const saved = addRecord(id, sectionIdx, row);
  return NextResponse.json(saved, { status: 201 });
}

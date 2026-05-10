import { NextRequest, NextResponse } from 'next/server';
import { getSheetInfos } from '@/lib/server/excel-reader';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const sheets = getSheetInfos(buffer);
    return NextResponse.json({ sheets });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getProject, addRecord, readRecords } from '@/lib/server/storage';
import { getValidToken } from '@/lib/server/google-api';
import type { Row } from '@/lib/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };


export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sectionIdx = Number(req.nextUrl.searchParams.get('section') ?? '0');
  const records = await readRecords(id, sectionIdx);
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sectionIdx = Number(req.nextUrl.searchParams.get('section') ?? '0');
  const body = await req.json() as Record<string, unknown>;

  const row: Row = { _id: uuidv4() };
  for (const [k, v] of Object.entries(body)) {
    if (k !== '_id') row[k] = v as Row[string];
  }

  // If this is a Google Sheet project, append the new row there too
  if (project.spreadsheetId && project.sheetTab) {
    try {
      const sb = await createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const admin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } },
        );
        const { data: sections } = await admin
          .from('sections').select('schema_json')
          .eq('project_id', id).eq('section_idx', sectionIdx).limit(1);
        const schema = sections?.[0]?.schema_json as { columns: { id: string; excelHeader: string }[] } | undefined;

        if (schema) {
          const token = await getValidToken(user.id);
          // Fetch first 10 rows to detect the actual header row (sheet may have title rows before headers)
          const headRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${project.spreadsheetId}/values/${encodeURIComponent(project.sheetTab)}!1:10`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (headRes.ok) {
            const first10: string[][] = (await headRes.json()).values ?? [];
            // Find the row whose cells best match schema excelHeaders
            const knownHeaders = new Set(schema.columns.map(c => c.excelHeader.trim().toLowerCase()));
            let bestIdx = 0, bestScore = 0;
            for (let i = 0; i < first10.length; i++) {
              const score = first10[i].filter(c => knownHeaders.has((c ?? '').trim().toLowerCase())).length;
              if (score > bestScore) { bestScore = score; bestIdx = i; }
            }
            const headers: string[] = first10[bestIdx] ?? [];
            const rowValues = headers.map(h => {
              const col = schema.columns.find(c => c.excelHeader.trim().toLowerCase() === h.trim().toLowerCase());
              return col ? String(row[col.id] ?? '') : '';
            });
            const appendRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${project.spreadsheetId}/values/${encodeURIComponent(project.sheetTab)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: [rowValues] }),
              },
            );
            if (appendRes.ok) {
              const appendData = await appendRes.json();
              const range: string = appendData.updates?.updatedRange ?? '';
              const match = range.match(/:.*?(\d+)$/);
              if (match) row._sheet_row = parseInt(match[1], 10) as unknown as string;
            }
          }
        }
      }
    } catch (e) {
      console.error('Sheet append on create error:', e);
    }
  }

  const saved = await addRecord(id, sectionIdx, row);
  return NextResponse.json(saved, { status: 201 });
}

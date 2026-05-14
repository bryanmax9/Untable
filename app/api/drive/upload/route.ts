import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/server/google-api';

export const runtime = 'nodejs';

// Extracts a Drive folderId from a folder URL or returns the raw string as-is.
function extractFolderId(urlOrId: string): string {
  const m = urlOrId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : urlOrId;
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const formData = await req.formData();
  const file     = formData.get('file') as File | null;
  const folderId = formData.get('folderId') as string | null;

  if (!file)     return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!folderId) return NextResponse.json({ error: 'No folderId provided' }, { status: 400 });

  const targetFolder = extractFolderId(folderId);
  const token = await getValidToken(user.id);

  // Build multipart/related body for the Drive Files API
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metadata = JSON.stringify({ name: file.name, parents: [targetFolder] });
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
  const dataPart = `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
  const closing  = `\r\n--${boundary}--`;

  const enc = new TextEncoder();
  const bodyParts = [enc.encode(metaPart), enc.encode(dataPart), fileBytes, enc.encode(closing)];
  const totalLen = bodyParts.reduce((s, p) => s + p.length, 0);
  const body = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of bodyParts) { body.set(part, offset); offset += part.length; }

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    return NextResponse.json({ error: err?.error?.message ?? `Drive upload error ${uploadRes.status}` }, { status: 500 });
  }

  const uploaded = await uploadRes.json();
  return NextResponse.json({
    fileId:      uploaded.id,
    name:        uploaded.name,
    webViewLink: uploaded.webViewLink,
  });
}

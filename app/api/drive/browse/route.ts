import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/server/google-api';

export const runtime = 'nodejs';

const DRIVE_FIELDS = 'files(id,name,mimeType,webViewLink,modifiedTime)';
const ALL_DRIVES   = 'includeItemsFromAllDrives=true&supportsAllDrives=true';

export async function GET(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const folderId = req.nextUrl.searchParams.get('folderId') ?? 'root';
  const source   = req.nextUrl.searchParams.get('source') ?? 'my-drive'; // 'my-drive' | 'shared'

  try {
    const token = await getValidToken(user.id);
    const auth  = { Authorization: `Bearer ${token}` };

    // Fetch folder name for breadcrumb (skip for virtual roots)
    let folderName: string | null = null;
    if (folderId !== 'root' && source !== 'shared') {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&${ALL_DRIVES}`,
        { headers: auth },
      );
      if (metaRes.ok) folderName = (await metaRes.json()).name ?? null;
    }

    let q: string;
    if (source === 'shared') {
      // "Shared with me" — top-level only (no parent filter)
      q = `sharedWithMe=true and trashed=false and mimeType='application/vnd.google-apps.folder'`;
    } else {
      q = `'${folderId}' in parents and trashed=false`;
    }

    const url = `https://www.googleapis.com/drive/v3/files` +
      `?q=${encodeURIComponent(q)}` +
      `&fields=${DRIVE_FIELDS}` +
      `&orderBy=folder,name` +
      `&pageSize=200` +
      `&${ALL_DRIVES}`;

    const res = await fetch(url, { headers: auth });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Drive API error ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ files: data.files ?? [], folderName });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

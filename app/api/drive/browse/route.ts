import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidToken } from '@/lib/server/google-api';

export const runtime = 'nodejs';

// Lists folders (and files) inside a Drive folder using the user's stored OAuth token.
// folderId = Drive folder ID (omit for root)
export async function GET(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const folderId = req.nextUrl.searchParams.get('folderId') ?? 'root';

  try {
    const token = await getValidToken(user.id);

    // Fetch folder metadata (to display name in breadcrumb)
    let folderName: string | null = null;
    if (folderId !== 'root') {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        folderName = meta.name ?? null;
      }
    }

    // List contents: folders first, then files
    const q   = `'${folderId}' in parents and trashed=false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files` +
      `?q=${encodeURIComponent(q)}` +
      `&fields=files(id,name,mimeType,webViewLink,modifiedTime)` +
      `&orderBy=folder,name` +
      `&pageSize=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

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

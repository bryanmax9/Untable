import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url  = request.nextUrl.searchParams.get('url');
  const auth = request.headers.get('Authorization');

  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Prefer Bearer token (OAuth), fall back to server-side API key (public folders)
  const token  = auth?.replace('Bearer ', '');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;

  if (!token && !apiKey) {
    return NextResponse.json({ files: [], error: 'No auth method available' }, { status: 401 });
  }

  const fileId = extractDriveId(url);
  if (!fileId) return NextResponse.json({ files: [], error: 'Could not parse Drive URL' });

  function driveHeaders(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function driveParam() {
    return apiKey && !token ? `&key=${apiKey}` : '';
  }

  try {
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType${driveParam()}`,
      { headers: driveHeaders() },
    );

    if (!metaRes.ok) {
      const errBody = await metaRes.json().catch(() => ({}));
      return NextResponse.json(
        { files: [], error: `Drive API error: ${errBody?.error?.message ?? metaRes.statusText}` },
        { status: metaRes.status },
      );
    }

    const meta = await metaRes.json() as { id: string; name: string; mimeType: string };

    if (meta.mimeType === 'application/vnd.google-apps.folder') {
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files` +
        `?q=${encodeURIComponent(`'${fileId}' in parents and trashed=false`)}` +
        `&fields=files(id,name,mimeType,size,webViewLink,modifiedTime,iconLink)` +
        `&orderBy=name` +
        `&pageSize=200` +
        driveParam(),
        { headers: driveHeaders() },
      );

      if (!listRes.ok) {
        const errBody = await listRes.json().catch(() => ({}));
        return NextResponse.json(
          { files: [], error: `Drive list error: ${errBody?.error?.message ?? listRes.statusText}` },
          { status: listRes.status },
        );
      }

      const data = await listRes.json() as { files?: unknown[] };
      return NextResponse.json({ files: data.files ?? [], folderName: meta.name });
    }

    // Single file
    const webViewLink =
      meta.mimeType.startsWith('application/vnd.google-apps.')
        ? `https://docs.google.com/file/d/${meta.id}/view`
        : `https://drive.google.com/file/d/${meta.id}/view`;

    return NextResponse.json({
      files: [{ id: meta.id, name: meta.name, mimeType: meta.mimeType, webViewLink }],
    });
  } catch (err) {
    return NextResponse.json({ files: [], error: String(err) }, { status: 500 });
  }
}

function extractDriveId(url: string): string | null {
  const patterns: RegExp[] = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

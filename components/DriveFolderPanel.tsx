'use client';
import { useEffect, useState } from 'react';

interface DriveFile {
  id: string; name: string; mimeType: string;
  size?: string; webViewLink?: string; modifiedTime?: string;
}

const MIME_ICONS: Record<string, string> = {
  'application/vnd.google-apps.document':     '📄',
  'application/vnd.google-apps.spreadsheet':  '📊',
  'application/vnd.google-apps.presentation': '📽',
  'application/vnd.google-apps.folder':       '📁',
  'application/pdf':                           '📕',
  'image/':                                    '🖼',
  'video/':                                    '🎬',
};

function mimeIcon(mime: string): string {
  for (const [k, v] of Object.entries(MIME_ICONS)) {
    if (mime.startsWith(k)) return v;
  }
  return '📎';
}

function mimeLabel(mime: string): string {
  if (mime.includes('spreadsheet')) return 'Sheet';
  if (mime.includes('document'))    return 'Doc';
  if (mime.includes('presentation'))return 'Slides';
  if (mime.includes('folder'))      return 'Folder';
  if (mime === 'application/pdf')   return 'PDF';
  const ext = mime.split('/')[1]?.toUpperCase();
  return ext ?? 'File';
}

interface Props {
  folderUrl: string;
  onChangeFolderUrl?: (url: string) => void;
  readOnly?: boolean;
}

export function DriveFolderPanel({ folderUrl, onChangeFolderUrl, readOnly }: Props) {
  const [files, setFiles]     = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState(folderUrl);
  const [editing, setEditing] = useState(!folderUrl);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    if (!folderUrl) return;
    setLoading(true); setError(null);
    fetch(`/api/drive/files?url=${encodeURIComponent(folderUrl)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setFiles(d.files ?? []);
        setFolderName(d.folderName ?? null);
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [folderUrl]);

  const filtered = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  function saveUrl() {
    if (editUrl.trim() && onChangeFolderUrl) {
      onChangeFolderUrl(editUrl.trim());
      setEditing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Folder header */}
      <div className="bg-white rounded-xl border border-black/[0.08] p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-[18px]">📁</div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                  onKeyDown={e => e.key === 'Enter' && saveUrl()}
                  autoFocus
                />
                <button onClick={saveUrl}
                  className="px-3 py-2 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  Link
                </button>
                {folderUrl && <button onClick={() => setEditing(false)}
                  className="px-3 py-2 text-[12px] text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200">
                  Cancel
                </button>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{folderName ?? 'Google Drive folder'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{folderUrl}</div>
                </div>
                <div className="flex gap-1 ml-auto flex-shrink-0">
                  <a href={folderUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium">
                    Open ↗
                  </a>
                  {!readOnly && (
                    <button onClick={() => { setEditUrl(folderUrl); setEditing(true); }}
                      className="text-[11px] px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                      Change
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload hint */}
        {!editing && folderUrl && (
          <div className="mt-3 pt-3 border-t border-black/[0.06] flex items-center gap-2 text-[12px] text-slate-400">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0">
              <path d="M6.5 1v8M3 6l3.5-3.5L10 6M2 11h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            To add files: open the Drive folder above and drag files there — they'll appear here automatically.
          </div>
        )}
      </div>

      {/* Search + file list */}
      {folderUrl && !editing && (
        <>
          {files.length > 5 && (
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full px-3 py-2 text-[13px] rounded-xl border border-black/[0.08] bg-white outline-none focus:border-indigo-400"
            />
          )}

          <div className="bg-white rounded-xl border border-black/[0.08] overflow-hidden">
            {loading && (
              <div className="py-10 text-center text-[13px] text-slate-400">Loading Drive files…</div>
            )}
            {error && (
              <div className="p-4">
                <p className="text-[12px] text-rose-500 mb-1 font-medium">Could not load Drive folder</p>
                <p className="text-[11px] text-slate-400">{error}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Make sure the folder is shared as <strong>"Anyone with the link"</strong> and you have a Google Drive API key set in <code>.env.local</code>.
                </p>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="py-10 text-center text-[13px] text-slate-400">
                {search ? 'No files match your search.' : 'No files in this folder yet.'}
              </div>
            )}
            {!loading && !error && filtered.map((f, i) => (
              <a
                key={f.id}
                href={f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}
              >
                <span className="text-[18px] flex-shrink-0">{mimeIcon(f.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-800 truncate">{f.name}</div>
                  {f.modifiedTime && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(f.modifiedTime).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  {mimeLabel(f.mimeType)}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-slate-300">
                  <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </a>
            ))}
          </div>

          {!loading && !error && files.length > 0 && (
            <p className="text-[11px] text-center text-slate-400">
              {files.length} file{files.length !== 1 ? 's' : ''} · synced from Google Drive
            </p>
          )}
        </>
      )}
    </div>
  );
}

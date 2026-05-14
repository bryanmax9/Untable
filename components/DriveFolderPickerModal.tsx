'use client';
import { useEffect, useState, useCallback } from 'react';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
}

interface BreadcrumbEntry { id: string; name: string; }

interface Props {
  onSelect: (folderUrl: string, folderName: string) => void;
  onClose: () => void;
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function mimeIcon(mime: string): string {
  if (mime === FOLDER_MIME) return '📁';
  if (mime.includes('spreadsheet')) return '📊';
  if (mime.includes('document'))    return '📄';
  if (mime.includes('presentation'))return '📽';
  if (mime === 'application/pdf')   return '📕';
  if (mime.startsWith('image/'))    return '🖼';
  return '📎';
}

export function DriveFolderPickerModal({ onSelect, onClose }: Props) {
  const [crumbs, setCrumbs]     = useState<BreadcrumbEntry[]>([{ id: 'root', name: 'My Drive' }]);
  const [items, setItems]       = useState<DriveItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const currentFolder = crumbs[crumbs.length - 1];

  const load = useCallback((folderId: string) => {
    setLoading(true); setError(null);
    fetch(`/api/drive/browse?folderId=${folderId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setItems(d.files ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(currentFolder.id); }, [currentFolder.id, load]);

  function navigateInto(item: DriveItem) {
    setCrumbs(prev => [...prev, { id: item.id, name: item.name }]);
  }

  function navigateTo(idx: number) {
    setCrumbs(prev => prev.slice(0, idx + 1));
  }

  function selectCurrent() {
    const url = currentFolder.id === 'root'
      ? 'https://drive.google.com/drive/my-drive'
      : `https://drive.google.com/drive/folders/${currentFolder.id}`;
    onSelect(url, currentFolder.name);
  }

  function selectFolder(item: DriveItem) {
    const url = `https://drive.google.com/drive/folders/${item.id}`;
    onSelect(url, item.name);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" fill="#4285F4" opacity=".2"/>
            <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke="#4285F4" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Select a Drive folder</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Navigate to the case folder and click Select</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
        </div>

        {/* Breadcrumb */}
        <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', borderBottom: '0.5px solid rgba(0,0,0,0.06)', background: '#fafafa' }}>
          {crumbs.map((c, i) => (
            <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span style={{ color: '#cbd5e1', fontSize: 12 }}>›</span>}
              <button onClick={() => navigateTo(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: i === crumbs.length - 1 ? 600 : 400, color: i === crumbs.length - 1 ? '#0f172a' : '#6366f1', padding: '2px 4px', borderRadius: 4 }}>
                {c.name}
              </button>
            </span>
          ))}
        </div>

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
          )}
          {error && (
            <div style={{ padding: '16px 20px', color: '#e11d48', fontSize: 13 }}>{error}</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Empty folder</div>
          )}
          {!loading && !error && items.map((item, i) => {
            const isFolder = item.mimeType === FOLDER_MIME;
            return (
              <div key={item.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px', borderBottom: i < items.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', cursor: isFolder ? 'pointer' : 'default' }}
                onClick={() => isFolder && navigateInto(item)}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{mimeIcon(item.mimeType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isFolder ? '#0f172a' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  {item.modifiedTime && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{new Date(item.modifiedTime).toLocaleDateString()}</div>
                  )}
                </div>
                {isFolder && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); selectFolder(item); }}
                      style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Select
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigateInto(item); }}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>
                      Open →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Current: <strong style={{ color: '#0f172a' }}>{currentFolder.name}</strong></span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', cursor: 'pointer', color: '#475569' }}>
              Cancel
            </button>
            <button onClick={selectCurrent}
              style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Select "{currentFolder.name}"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

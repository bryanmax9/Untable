'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { StoredProject, ProjectSection, Row, Bindings, Column } from '@/lib/types';
import { cn, initials, fmtDate, daysUntil, truncate } from '@/lib/utils';
import { DriveFolderPickerModal } from '@/components/DriveFolderPickerModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SectionWithRecords extends ProjectSection { records: Row[] }
interface FullProject extends StoredProject { sections: SectionWithRecords[] }
interface LegalCase {
  _id: string; num: string; client: string; carpeta: string;
  status: string; priority: string; assignee: string; deadline: string;
  description: string; area: string; action: string; link: string;
  notes: string; pm: string; hechos: string; procedimiento: string;
  horario: string; fechaSolicitud: string;
}

type LegalViewId = 'panel' | 'clientes' | 'cliente-detail' | 'casos' | 'detail' | 'plazos' | 'tareas' | 'documentos' | 'contratos' | 'equipo';
type TabId = 'resumen' | 'actuado' | 'tareas' | 'audiencias' | 'documentos' | 'responsables';

// ─── Google GIS ───────────────────────────────────────────────────────────────
declare global { interface Window { google: any } }

interface DriveFile {
  id: string; name: string; mimeType: string;
  size?: string; webViewLink?: string; modifiedTime?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const g = (row: Row, colId: string | undefined): string =>
  colId ? String(row[colId] ?? '') : '';

function rowToCase(row: Row, b: Bindings, section: SectionWithRecords): LegalCase {
  const cols = section.schema.columns;
  // Helper to find value by multiple candidate column IDs
  const gAny = (...ids: (string | undefined)[]) => {
    for (const id of ids) { const v = id ? String(row[id] ?? '') : ''; if (v) return v; }
    return '';
  };
  // Description: try binding first, then search by any description-like column
  const descCol = cols.find(c => c.semanticRole === 'description' || c.id.includes('descripci') || c.id.includes('asunto') || c.id.includes('servicio'));
  const rawDesc = gAny(b.description, descCol?.id);
  // Link: may contain the expediente reference number
  const rawLink = gAny(b.link);
  // The "title" shown for the case: description if available, else link ref, else action
  const title = rawDesc || rawLink || gAny(b.action) || gAny(b.notes);

  return {
    _id:           row._id as string,
    num:           g(row, b.identifier),
    client:        g(row, b.client),
    carpeta:       g(row, cols.find(c => c.id === 'carpeta' || c.id.includes('carpeta'))?.id),
    status:        g(row, b.status),
    priority:      g(row, b.priority),
    assignee:      g(row, b.assignee),
    deadline:      gAny(b.deadline, cols.find(c => c.id.includes('fecha_limite') || c.id.includes('fecha_l'))?.id),
    description:   title,
    area:          g(row, b.area),
    action:        g(row, b.action),
    link:          rawLink,
    notes:         g(row, b.notes),
    pm:            g(row, b.pm),
    hechos:        g(row, cols.find(c => c.id.includes('hechos'))?.id),
    procedimiento: g(row, cols.find(c => c.id.includes('procedimiento'))?.id),
    horario:       g(row, cols.find(c => c.id.includes('horario'))?.id),
    fechaSolicitud: g(row, cols.find(c => c.id.includes('fecha_de_solicitud') || c.id.includes('fecha_solicitud'))?.id),
  };
}

// ─── Status / badge helpers ───────────────────────────────────────────────────
function statusClass(v: string): string {
  const s = (v || '').toLowerCase();
  if (/en progres/.test(s)) return 'la-e-progreso';
  if (/en proce/.test(s))   return 'la-e-proceso';
  if (/pendiente/.test(s))  return 'la-e-pendiente';
  if (/^alta$/.test(s.trim())) return 'la-e-alta';
  if (/urgent/.test(s))     return 'la-e-urgente';
  if (/finaliz|cerrad/.test(s)) return 'la-e-finalizado';
  return 'la-e-proceso';
}

function carpetaClass(v: string): string {
  const s = (v || '').toLowerCase();
  if (/judic|poder/.test(s))    return 'la-badge-judicial';
  if (/laboral/.test(s))        return 'la-badge-laboral';
  if (/penal/.test(s))          return 'la-badge-penal';
  if (/comerci/.test(s))        return 'la-badge-comercial';
  if (/arbitr|sunafil|rnp/.test(s)) return 'la-badge-corporativo';
  return 'la-badge-gray';
}

function priorityBadgeClass(v: string): string {
  const s = (v || '').toLowerCase();
  if (/urgent/.test(s)) return 'la-badge-penal';
  if (/alta/.test(s))   return 'la-badge-comercial';
  if (/media/.test(s))  return 'la-badge-judicial';
  return 'la-badge-gray';
}

function avatarClass(name: string): string {
  const colors = ['la-av-purple', 'la-av-teal', 'la-av-amber', 'la-av-coral', 'la-av-blue'];
  let h = 0;
  for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

const AREA_COLORS = ['#85B7EB', '#AFA9EC', '#F0997B', '#5DCAA5', '#FAC775', '#E24B4A', '#534AB7'];

const STATUS_BAR_COLORS: Record<string, string> = {
  'en progreso': '#534AB7',
  'pendiente':   '#633806',
  'en proceso':  '#085041',
  'alta':        '#3C3489',
  'urgente':     '#A32D2D',
};
function statusBarColor(v: string): string {
  const s = (v || '').toLowerCase();
  for (const [k, c] of Object.entries(STATUS_BAR_COLORS)) {
    if (s.includes(k)) return c;
  }
  return '#9c9a92';
}

function dayLabel(days: number | null): string {
  if (days === null) return '';
  if (days === 0) return 'HOY';
  if (days < 0) return `Venció hace ${Math.abs(days)}d`;
  return `En ${days}d`;
}

function fmtFileSize(bytes: string | null | undefined): string {
  const n = Number(bytes);
  if (!n) return '';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

// ─── Google Drive hook ────────────────────────────────────────────────────────
function useGoogleDrive(driveUrl: string) {
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(() => {
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (r: any) => { if (r.access_token) setToken(r.access_token); },
    });
    client.requestAccessToken();
  }, []);

  useEffect(() => {
    if (!token || !driveUrl) return;
    setLoading(true);
    fetch(`/api/drive/files?url=${encodeURIComponent(driveUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setFiles(d.files ?? []); setError(d.error ?? null); })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [token, driveUrl]);

  return { token, signIn, files, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 1 — PANEL (Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
function PanelView({
  cases, section, onGoRegistros, onGoPlazos, onViewCase,
}: {
  cases: LegalCase[];
  section: SectionWithRecords;
  onGoRegistros: () => void;
  onGoPlazos: () => void;
  onViewCase: (c: LegalCase) => void;
}) {
  // ── KPI counts ────────────────────────────────────────────────────────────
  const total      = cases.length;
  const vencidos   = cases.filter(c => { const d = daysUntil(c.deadline); return d !== null && d < 0; }).length;
  const altaPrio   = cases.filter(c => /urgent|alta|high/i.test(c.priority)).length;
  const estaSemana = cases.filter(c => { const d = daysUntil(c.deadline); return d !== null && d >= 0 && d <= 7; }).length;

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusMap: Record<string, number> = {};
  cases.forEach(c => { const v = c.status || '—'; statusMap[v] = (statusMap[v] ?? 0) + 1; });
  const statusSorted = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const statusMax = Math.max(...Object.values(statusMap), 1);

  // ── Próximos plazos ───────────────────────────────────────────────────────
  const proximos = [...cases]
    .filter(c => c.deadline)
    .map(c => ({ c, d: daysUntil(c.deadline) }))
    .filter(x => x.d !== null)
    .sort((a, b) => (a.d ?? 999) - (b.d ?? 999))
    .slice(0, 6);

  // ── AREA distribution ─────────────────────────────────────────────────────
  const areaMap: Record<string, number> = {};
  cases.forEach(c => { const v = c.area || '—'; areaMap[v] = (areaMap[v] ?? 0) + 1; });
  const areaSorted = Object.entries(areaMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const areaMax = Math.max(...Object.values(areaMap), 1);

  // ── Pendientes urgentes ───────────────────────────────────────────────────
  const urgentes = cases.filter(c => /urgent|alta/i.test(c.priority)).slice(0, 5);

  // ── Tareas de hoy ─────────────────────────────────────────────────────────
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const tareasHoy = cases
    .filter(c => { const d = daysUntil(c.deadline); return d !== null && d <= 0; })
    .slice(0, 6);

  // ── Clientes ──────────────────────────────────────────────────────────────
  const clientMap: Record<string, { count: number; urgent: number }> = {};
  cases.forEach(c => {
    const cl = c.client || '—';
    if (!clientMap[cl]) clientMap[cl] = { count: 0, urgent: 0 };
    clientMap[cl].count++;
    if (/urgent|alta/i.test(c.priority)) clientMap[cl].urgent++;
  });
  const clientsSorted = Object.entries(clientMap).sort((a, b) => b[1].count - a[1].count).slice(0, 8);

  return (
    <>
      {/* Row 1 — KPIs */}
      <div className="la-kpi-grid">
        <div className="la-kpi-card" onClick={onGoRegistros}>
          <div className="la-kpi-label">TOTAL N°</div>
          <div className="la-kpi-value">{total}</div>
          <div className="la-kpi-sub">{section.sheetName}</div>
        </div>
        <div className="la-kpi-card" onClick={onGoPlazos}>
          <div className="la-kpi-label">VENCIDOS</div>
          <div className="la-kpi-value" style={{ color: vencidos > 0 ? '#E24B4A' : undefined }}>{vencidos}</div>
          <div className="la-kpi-sub">Acción inmediata</div>
        </div>
        <div className="la-kpi-card" onClick={onGoRegistros}>
          <div className="la-kpi-label">ALTA PRIORIDAD</div>
          <div className="la-kpi-value" style={{ color: altaPrio > 0 ? '#BA7517' : undefined }}>{altaPrio}</div>
          <div className="la-kpi-sub">De {total} total</div>
        </div>
        <div className="la-kpi-card" onClick={onGoPlazos}>
          <div className="la-kpi-label">ESTA SEMANA</div>
          <div className="la-kpi-value">{estaSemana}</div>
          <div className="la-kpi-sub">Próximos 7 días</div>
        </div>
      </div>

      {/* Row 2 — Estado + Próximos plazos */}
      <div className="la-grid-2">
        {/* Estado bar chart */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">ESTADO</span>
          </div>
          {statusSorted.length === 0
            ? <p style={{ fontSize: 12, color: '#9c9a92' }}>Sin datos de estado.</p>
            : statusSorted.map(([label, count]) => (
              <div key={label} className="la-chart-row">
                <div className="la-chart-label">{label}</div>
                <div className="la-chart-track">
                  <div className="la-chart-fill"
                    style={{ width: `${(count / statusMax) * 100}%`, background: statusBarColor(label) }} />
                </div>
                <div className="la-chart-num">{count}</div>
              </div>
            ))
          }
        </div>

        {/* Próximos plazos */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">Próximos plazos</span>
            <button className="la-card-link" onClick={onGoPlazos}>Ver todos →</button>
          </div>
          {proximos.length === 0
            ? <p style={{ fontSize: 12, color: '#9c9a92' }}>Sin plazos próximos.</p>
            : proximos.map(({ c, d }) => {
              const isOD   = d !== null && d < 0;
              const isSoon = d !== null && d >= 0 && d <= 3;
              const dotColor = isOD ? '#E24B4A' : isSoon ? '#BA7517' : '#534AB7';
              const dLbl = dayLabel(d);
              return (
                <div key={c._id} className="la-alert-item" onClick={() => onViewCase(c)}>
                  <div className="la-alert-dot" style={{ background: dotColor }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="la-alert-text">
                      <strong>{truncate(c.description || c.action || c.carpeta || '—', 55)}</strong>
                    </div>
                    <div className="la-alert-meta">{fmtDate(c.deadline)} · {c.client || '—'}</div>
                  </div>
                  <span className={`la-estado ${statusClass(c.status)}`}>{c.status || '—'}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isOD ? '#E24B4A' : isSoon ? '#BA7517' : '#9c9a92', marginLeft: 6, flexShrink: 0 }}>{dLbl}</span>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Row 3 — AREA distribution + Pendientes urgentes */}
      <div className="la-grid-2">
        {/* AREA distribution */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">AREA — Distribución</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {areaSorted.map(([label, count], i) => (
              <div key={label} className="la-chart-row">
                <div className="la-chart-label">{label}</div>
                <div className="la-chart-track">
                  <div className="la-chart-fill"
                    style={{ width: `${(count / areaMax) * 100}%`, background: AREA_COLORS[i % AREA_COLORS.length] }} />
                </div>
                <div className="la-chart-num">{count}</div>
              </div>
            ))}
            {areaSorted.length === 0 && <p style={{ fontSize: 12, color: '#9c9a92', gridColumn: '1/-1' }}>Sin datos de área.</p>}
          </div>
        </div>

        {/* Pendientes urgentes */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">Pendientes urgentes</span>
            <button className="la-card-link" onClick={onGoRegistros}>Ver todos →</button>
          </div>
          {urgentes.length === 0
            ? <p style={{ fontSize: 12, color: '#9c9a92' }}>Sin urgentes.</p>
            : urgentes.map(c => (
              <div key={c._id} className="la-case-item" onClick={() => onViewCase(c)}>
                <div className={`la-case-avatar ${avatarClass(c.client)}`}>
                  {initials(c.client || '?')}
                </div>
                <div className="la-case-info">
                  <div className="la-case-title">{truncate(c.description || c.action || '—', 50)}</div>
                  <div className="la-case-client">{c.client} · {c.carpeta}</div>
                </div>
                <span className={`la-estado ${statusClass(c.status)}`}>{c.status || '—'}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Row 4 — Tareas de hoy + Clientes */}
      <div className="la-grid-2">
        {/* Tareas de hoy */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">Tareas de hoy</span>
          </div>
          {tareasHoy.length === 0
            ? <p style={{ fontSize: 12, color: '#9c9a92' }}>Sin tareas para hoy.</p>
            : tareasHoy.map(c => {
              const done = doneIds.has(c._id);
              return (
                <div key={c._id} className="la-task-item">
                  <div
                    className={`la-task-check ${done ? 'done' : ''}`}
                    onClick={() => setDoneIds(prev => {
                      const n = new Set(prev);
                      done ? n.delete(c._id) : n.add(c._id);
                      return n;
                    })}>
                    {done && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div
                    className="la-task-text"
                    style={{ cursor: 'pointer', textDecoration: done ? 'line-through' : undefined, color: done ? '#9c9a92' : undefined }}
                    onClick={() => onViewCase(c)}>
                    {truncate(c.description || c.action || '—', 50)}
                  </div>
                  <div className="la-task-due" style={{ color: '#E24B4A' }}>
                    {c.assignee || '—'}
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Clientes */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">Clientes</span>
          </div>
          <div className="la-grid-2" style={{ gap: 10 }}>
            {clientsSorted.map(([name, { count, urgent }]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: '#EEEDFE', color: '#3C3489',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600,
                }}>
                  {initials(name || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {truncate(name, 18)}
                  </div>
                  <div style={{ fontSize: 10, color: '#9c9a92', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {count} pendientes
                    {urgent > 0 && (
                      <span style={{ background: '#FCEBEB', color: '#791F1F', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 600 }}>
                        {urgent}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {clientsSorted.length === 0 && <p style={{ fontSize: 12, color: '#9c9a92', gridColumn: '1/-1' }}>Sin clientes.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

// Normalise any common date string to YYYY-MM-DD for <input type="date">
function toISODate(v: string): string {
  if (!v) return '';
  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = v.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// DynamicField — renders any schema column with the right input control
// ─────────────────────────────────────────────────────────────────────────────
function DynamicField({
  col, value, onChange, onPickDrive,
}: {
  col: Column;
  value: string;
  onChange: (v: string) => void;
  onPickDrive?: () => void;
}) {
  const label = col.label || col.excelHeader;
  const isUrl = col.type === 'url' || col.semanticRole === 'link';

  // Enum → pill buttons (works for any set of options from any sheet)
  if (col.type === 'enum' && col.options?.length) {
    return (
      <div>
        <div className="la-ep-label">{label}</div>
        <div className="la-pill-sel">
          {col.options.map(opt => (
            <button key={opt} type="button"
              className={`la-pill-opt ${value === opt ? 'active' : ''}`}
              onClick={() => onChange(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Boolean → Yes/No toggle
  if (col.type === 'boolean') {
    const checked = /^(true|1|s[íi]|yes|sí)$/i.test(value);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="la-ep-label" style={{ margin: 0 }}>{label}</div>
        <button type="button" onClick={() => onChange(checked ? 'No' : 'Sí')}
          style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: checked ? '#3C3489' : '#eee', color: checked ? '#fff' : '#555' }}>
          {checked ? 'Sí' : 'No'}
        </button>
      </div>
    );
  }

  // Long text → textarea
  if (col.type === 'longtext') {
    return (
      <div>
        <div className="la-ep-label">{label}</div>
        <textarea className="la-ep-textarea" rows={3} value={value} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }

  // URL / link → text input + optional Drive picker button
  if (isUrl) {
    return (
      <div>
        <div className="la-ep-label">{label}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="la-ep-input" style={{ flex: 1 }} type="url"
            value={value} onChange={e => onChange(e.target.value)} placeholder="https://…" />
          {onPickDrive && (
            <button type="button" onClick={onPickDrive}
              style={{ flexShrink: 0, padding: '0 10px', borderRadius: 8, border: '0.5px solid rgba(99,102,241,0.4)', background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              📁 Browse
            </button>
          )}
        </div>
      </div>
    );
  }

  // Date — normalise from any format (DD/MM/YYYY etc.) to YYYY-MM-DD for the picker
  if (col.type === 'date' || col.type === 'datetime') {
    const iso = toISODate(value);
    return (
      <div>
        <div className="la-ep-label">{label}</div>
        <input className="la-ep-input" type="date" value={iso} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }

  // Number / currency
  if (col.type === 'number' || col.type === 'currency') {
    return (
      <div>
        <div className="la-ep-label">{label}</div>
        <input className="la-ep-input" type="number" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }

  // Default: text input
  return (
    <div>
      <div className="la-ep-label">{label}</div>
      <input className="la-ep-input" type="text" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit slide-over panel
// ─────────────────────────────────────────────────────────────────────────────
function EditPanel({
  caso, section, sectionIdx, projectId, spreadsheetId, sheetTab, onClose, onSaved,
}: {
  caso: LegalCase;
  section: SectionWithRecords;
  sectionIdx: number;
  projectId: string;
  spreadsheetId?: string;
  sheetTab?: string;
  onClose: () => void;
  onSaved: (updated: Row) => void;
}) {
  const cols = section.schema.columns;

  // Init from the raw row so ALL columns are captured, not just the bound ones
  const rawRow: Row = section.records.find(r => r._id === caso._id) ?? { _id: '' };
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const col of cols) {
      init[col.id] = String(rawRow[col.id] ?? '');
    }
    return init;
  });
  const [saving, setSaving]          = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [syncMsg, setSyncMsg]        = useState<string | null>(null);
  const [showDrivePicker, setShowDP] = useState(false);

  const set = (id: string | undefined, v: string) => {
    if (!id) return;
    setDraft(p => ({ ...p, [id]: v }));
  };

  async function save() {
    setSaving(true); setError(null); setSyncMsg(null);
    try {
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(draft)) if (k) body[k] = v;
      const res = await fetch(
        `/api/projects/${projectId}/records/${caso._id}?section=${sectionIdx}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data);

      if (spreadsheetId) {
        setSyncMsg('Sincronizando con Google Sheets…');
        fetch('/api/projects/sync-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, recordId: caso._id, patch: body }),
        }).then(async r => {
          const d = await r.json().catch(() => ({}));
          if (!r.ok) {
            setSyncMsg('⚠ Error al sincronizar con Google Sheets');
          } else if (d.skipped === 'row_not_found') {
            setSyncMsg('⚠ Fila no encontrada — usa "Sincronizar hoja" en el menú lateral primero');
          } else if (d.skipped) {
            setSyncMsg(`⚠ Sync omitido: ${d.skipped}`);
          } else {
            setSyncMsg(`✓ Guardado en Google Sheets (fila ${d.sheetRow})`);
            setTimeout(() => setSyncMsg(null), 3000);
          }
        }).catch(() => setSyncMsg('⚠ Error de red al sincronizar'));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="la-panel-backdrop" onClick={onClose} />
      <div className="la-edit-panel">
        {/* Header */}
        <div className="la-ep-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#9c9a92', marginBottom: 2 }}>#{caso.num || caso._id.slice(0, 6)}</div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
              {truncate(caso.description || caso.action || '—', 50)}
            </div>
            {caso.carpeta && (
              <div style={{ marginTop: 6 }}>
                <span className={`la-badge ${carpetaClass(caso.carpeta)}`}>{caso.carpeta}</span>
              </div>
            )}
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9c9a92', padding: 4 }}
            onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 12L12 2M12 12L2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body — fully dynamic: every column from the sheet is rendered */}
        <div className="la-ep-body">
          {cols.map(col => (
            <DynamicField
              key={col.id}
              col={col}
              value={draft[col.id] ?? ''}
              onChange={v => set(col.id, v)}
              onPickDrive={(col.type === 'url' || col.semanticRole === 'link') ? () => setShowDP(true) : undefined}
            />
          ))}
          {showDrivePicker && (
            <DriveFolderPickerModal
              onClose={() => setShowDP(false)}
              onSelect={(url) => {
                const linkCol = cols.find(c => c.semanticRole === 'link' || c.type === 'url');
                if (linkCol) set(linkCol.id, url);
                setShowDP(false);
              }}
            />
          )}
          {error && (
            <div style={{ background: '#FCEBEB', color: '#791F1F', fontSize: 12, borderRadius: 6, padding: '8px 12px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {syncMsg && (
          <div style={{ padding: '6px 16px', fontSize: 11, color: syncMsg.startsWith('✓') ? '#085041' : '#7a3a00', background: syncMsg.startsWith('✓') ? '#e8f5f0' : '#fff8e6', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
            {syncMsg}
          </div>
        )}
        <div className="la-ep-footer">
          <button className="la-btn" onClick={onClose}>Cancelar</button>
          <button className="la-btn la-btn-primary" disabled={saving} onClick={save}>
            {saving ? '…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 2 — REGISTROS (Casos)
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function RegistrosView({
  cases, section, sectionIdx, projectId, spreadsheetId, sheetTab, search, setCases, onViewCase,
}: {
  cases: LegalCase[];
  section: SectionWithRecords;
  sectionIdx: number;
  projectId: string;
  spreadsheetId?: string;
  sheetTab?: string;
  search: string;
  setCases: (updater: (prev: LegalCase[]) => LegalCase[]) => void;
  onViewCase: (c: LegalCase) => void;
}) {
  const [carpetaFilter, setCarpetaFilter] = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [editCase,      setEditCase]       = useState<LegalCase | null>(null);
  const [page,          setPage]           = useState(0);

  const carpetaOpts = [...new Set(cases.map(c => c.carpeta).filter(Boolean))];
  const statusOpts  = [...new Set(cases.map(c => c.status).filter(Boolean))];

  const filtered = cases.filter(c => {
    if (carpetaFilter && c.carpeta !== carpetaFilter) return false;
    if (statusFilter  && c.status  !== statusFilter)  return false;
    if (search) {
      const q = search.toLowerCase();
      return [c.description, c.client, c.carpeta, c.status, c.assignee, c.num, c.action, c.area]
        .some(v => v && v.toLowerCase().includes(q));
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [carpetaFilter, statusFilter, search]);

  return (
    <>
      {/* Section header + pills */}
      <div className="la-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
          <span className="la-section-label">{filtered.length} casos</span>
          <div className="la-pill-row">
            <button
              className={`la-pill ${!carpetaFilter ? 'active' : ''}`}
              onClick={() => setCarpetaFilter('')}>
              Todos
            </button>
            {carpetaOpts.map(opt => (
              <button key={opt}
                className={`la-pill ${carpetaFilter === opt ? 'active' : ''}`}
                onClick={() => setCarpetaFilter(carpetaFilter === opt ? '' : opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            fontSize: 12, padding: '5px 10px', borderRadius: 8,
            border: '0.5px solid rgba(0,0,0,0.18)',
            background: statusFilter ? '#EEEDFE' : '#fff',
            color: statusFilter ? '#3C3489' : '#5c5b57',
            outline: 'none', cursor: 'pointer',
          }}>
          <option value="">Todos los estados</option>
          {statusOpts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="la-card-p0">
        <div className="la-table-wrap">
          {paged.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: 13, color: '#9c9a92' }}>
              Sin resultados.
            </div>
          ) : (
            <table className="la-table">
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>Expediente</th>
                  <th style={{ width: '10%' }}>Carpeta</th>
                  <th style={{ width: '13%' }}>Cliente</th>
                  <th style={{ width: '11%' }}>Responsable</th>
                  <th style={{ width: '9%' }}>Vencimiento</th>
                  <th style={{ width: '8%' }}>Estado</th>
                  <th style={{ width: '8%' }}>Prioridad</th>
                  <th style={{ width: '9%' }}>Acción</th>
                  <th style={{ width: '8%' }}></th>
                </tr>
              </thead>
              <tbody>
                {paged.map(c => {
                  const d = daysUntil(c.deadline);
                  const isOD = d !== null && d < 0;
                  return (
                    <tr key={c._id} onClick={() => onViewCase(c)}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {truncate(c.description || c.action || '—', 60)}
                        </div>
                        {c.num && (
                          <div style={{ fontSize: 11, opacity: 0.5 }}>N° {c.num}</div>
                        )}
                      </td>
                      <td>
                        {c.carpeta && <span className={`la-badge ${carpetaClass(c.carpeta)}`}>{c.carpeta}</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>{truncate(c.client, 20) || '—'}</td>
                      <td style={{ fontSize: 12, opacity: 0.7 }}>{truncate(c.assignee, 20) || '—'}</td>
                      <td style={{ fontSize: 12, color: isOD ? '#E24B4A' : '#5c5b57', fontWeight: isOD ? 600 : 400, whiteSpace: 'nowrap' }}>
                        {fmtDate(c.deadline) || '—'}
                      </td>
                      <td>
                        {c.status && <span className={`la-estado ${statusClass(c.status)}`}>{c.status}</span>}
                      </td>
                      <td>
                        {c.priority && <span className={`la-badge ${priorityBadgeClass(c.priority)}`}>{c.priority}</span>}
                      </td>
                      <td style={{ fontSize: 11, color: '#9c9a92' }}>{truncate(c.action, 20) || '—'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="la-btn la-btn-sm"
                          onClick={e => { e.stopPropagation(); setEditCase(c); }}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#9c9a92' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="la-btn la-btn-sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
              ← Anterior
            </button>
            <button className="la-btn la-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editCase && (
        <EditPanel
          caso={editCase}
          section={section}
          sectionIdx={sectionIdx}
          projectId={projectId}
          spreadsheetId={spreadsheetId}
          sheetTab={sheetTab}
          onClose={() => setEditCase(null)}
          onSaved={updated => {
            setCases(prev => prev.map(c =>
              c._id === (updated._id as string) ? rowToCase(updated, section.bindings, section) : c
            ));
            setEditCase(null);
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 3 — PLAZOS
// ─────────────────────────────────────────────────────────────────────────────
function PlazosView({ cases, onViewCase }: { cases: LegalCase[]; onViewCase: (c: LegalCase) => void }) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  // Calendar
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const MON_FIRST_OFFSET = (firstDay + 6) % 7; // Mon-first offset
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Collect days that have deadlines
  const deadlineDays = new Set<number>();
  cases.forEach(c => {
    const m = String(c.deadline).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m && +m[1] === year && +m[2] - 1 === month) deadlineDays.add(+m[3]);
  });

  const today = now.getDate();

  // Audiencias próximas — all cases with deadlines, sorted ascending
  const audiencias = [...cases]
    .filter(c => c.deadline)
    .sort((a, b) => (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999));

  // Todos los vencimientos
  const vencimientos = [...cases]
    .filter(c => c.deadline)
    .sort((a, b) => (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999));

  const isMeetLink = (link: string) => /meet\.google\.com/i.test(link || '');

  return (
    <>
      <div className="la-section-header" style={{ marginBottom: 16 }}>
        <span className="la-section-label">Plazos y audiencias</span>
      </div>

      <div className="la-grid-2" style={{ alignItems: 'start' }}>
        {/* Calendar */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">Calendario {monthNames[month]} {year}</span>
          </div>
          <div className="la-cal-grid" style={{ gap: 2 }}>
            {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(d => (
              <div key={d} className="la-cal-head" style={{ padding: '2px 0', fontSize: 10 }}>{d}</div>
            ))}
            {Array.from({ length: MON_FIRST_OFFSET }).map((_, i) => (
              <div key={`e${i}`} className="la-cal-day empty" style={{ minHeight: 26 }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today;
              const hasEv   = deadlineDays.has(day);
              return (
                <div key={day} style={{ minHeight: 26, fontSize: 11, padding: '4px 2px' }}
                  className={`la-cal-day ${isToday ? 'today' : ''} ${hasEv ? 'has-event' : ''}`}>
                  {day}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 11, color: '#9c9a92' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} />
              Vencimiento / Audiencia
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ background: '#3C3489', color: '#fff', borderRadius: 10, padding: '1px 7px', fontWeight: 500 }}>{today}</span>
              Hoy
            </span>
          </div>
        </div>

        {/* Audiencias próximas — all upcoming deadlines */}
        <div className="la-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="la-card-header" style={{ flexShrink: 0 }}>
            <span className="la-card-title">Audiencias próximas</span>
          </div>
          <div style={{ overflow: 'y-auto', flex: 1 }}>
          {audiencias.length === 0
            ? <p style={{ fontSize: 12, color: '#9c9a92' }}>Sin plazos registrados.</p>
            : audiencias.map(c => (
              <div key={c._id} className="la-alert-item" style={{ alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => onViewCase(c)}>
                <div className="la-alert-dot" style={{ background: '#E24B4A', marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="la-alert-text" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.client || '—'}</div>
                  <div className="la-alert-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncate(c.description, 55)}</div>
                  <div className="la-alert-meta">📅 {fmtDate(c.deadline)} &nbsp; 🕐 {c.horario || 'Hora por confirmar'} &nbsp; {c.carpeta}</div>
                </div>
                {isMeetLink(c.link) && (
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="la-btn la-btn-primary la-btn-sm"
                    style={{ textDecoration: 'none' }}>
                    Unirse
                  </a>
                )}
              </div>
            ))
          }
          </div>
        </div>
      </div>

      {/* Todos los vencimientos */}
      <div className="la-card">
        <div className="la-card-header">
          <span className="la-card-title">Todos los vencimientos ({vencimientos.length})</span>
        </div>
        {vencimientos.length === 0
          ? <p style={{ fontSize: 12, color: '#9c9a92' }}>Sin vencimientos.</p>
          : vencimientos.map(c => {
            const d    = daysUntil(c.deadline);
            const isOD = d !== null && d < 0;
            const dotColor = isOD ? '#E24B4A' : (d !== null && d <= 3) ? '#BA7517' : '#534AB7';
            const dateLabel = d === 0 ? 'Vence HOY'
              : isOD ? `Venció hace ${Math.abs(d!)}d`
              : fmtDate(c.deadline);
            return (
              <div key={c._id} className="la-alert-item" style={{ padding: '11px 0' }}>
                <div className="la-alert-dot" style={{ background: dotColor }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="la-alert-text" style={{ fontWeight: 500 }}>
                    {truncate(c.description || c.action || '—', 70)}
                  </div>
                  <div className="la-alert-meta">
                    {dateLabel} · {c.client || '—'} · {c.carpeta || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: isOD ? '#E24B4A' : '#5c5b57', fontWeight: isOD ? 600 : 400 }}>
                    {fmtDate(c.deadline)}
                  </div>
                  {c.assignee && (
                    <div style={{ fontSize: 11, color: '#9c9a92' }}>{c.assignee}</div>
                  )}
                </div>
              </div>
            );
          })
        }
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 4 — CASO DETALLE
// ─────────────────────────────────────────────────────────────────────────────
function CaseDetailView({
  caso, section, sectionIdx, projectId, spreadsheetId, sheetTab, onBack, onUpdated,
}: {
  caso: LegalCase;
  section: SectionWithRecords;
  sectionIdx: number;
  projectId: string;
  spreadsheetId?: string;
  sheetTab?: string;
  onBack: () => void;
  onUpdated: (updated: LegalCase) => void;
}) {
  const [tab,     setTab]     = useState<TabId>('resumen');
  const [editing, setEditing] = useState(false);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'resumen',      label: 'Resumen' },
    { id: 'actuado',      label: 'Lo actuado' },
    { id: 'tareas',       label: 'Tareas' },
    { id: 'audiencias',   label: 'Audiencias' },
    { id: 'documentos',   label: 'Documentos' },
    { id: 'responsables', label: 'Responsables' },
  ];

  const d    = daysUntil(caso.deadline);
  const isOD = d !== null && d < 0;

  const hechosLines  = (caso.hechos || '').split('\n').map(s => s.trim()).filter(Boolean);
  const procLines    = (caso.procedimiento || '').split('\n').map(s => s.trim()).filter(Boolean);
  const hasHearing   = !!(caso.horario && !/todo.el.dia|oficina/i.test(caso.horario));
  const isMeetLink   = /meet\.google\.com/i.test(caso.link || '');
  const isDriveLink  = /drive\.google\.com|docs\.google\.com|sheets\.google\.com/i.test(caso.link || '');

  const isDriveFolder = /drive\.google\.com\/drive\/folders|drive\.google\.com\/folderview/i.test(caso.link || '');
  const linkLabel = isDriveFolder ? 'Abrir carpeta en Drive' : isDriveLink ? 'Abrir en Drive' : 'Abrir enlace';

  const proseClass = (() => {
    const p = (caso.priority || '').toLowerCase();
    if (/urgent/.test(p)) return 'urgente';
    if (/alta/.test(p))   return 'alta';
    return 'media';
  })();

  return (
    <>
      {/* Back */}
      <button className="la-back-btn" onClick={onBack}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Volver a registros
      </button>

      {/* Detail header */}
      <div className="la-detail-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: '#EEEDFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 4H14M6 8H14M6 12H10" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="2" width="16" height="16" rx="3" stroke="#3C3489" strokeWidth="1.3"/>
            </svg>
          </div>
          {/* Case info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>
              {caso.description || caso.action || '—'}
            </div>
            <div className="la-case-badge-row" style={{ marginBottom: 0 }}>
              {caso.client   && <span className="la-badge la-badge-judicial">{caso.client}</span>}
              {caso.carpeta  && <span className={`la-badge ${carpetaClass(caso.carpeta)}`}>{caso.carpeta}</span>}
              {caso.status   && <span className={`la-estado ${statusClass(caso.status)}`}>{caso.status}</span>}
              {caso.priority && <span className={`la-badge ${priorityBadgeClass(caso.priority)}`}>{caso.priority}</span>}
            </div>
          </div>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="la-btn la-btn-primary la-btn-sm" onClick={() => setEditing(true)}>Editar</button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="la-meta-strip">
          <div className="la-meta-cell">
            <div className="la-meta-label">N° Pendiente</div>
            <div className="la-meta-value">{caso.num || '—'}</div>
          </div>
          <div className="la-meta-cell">
            <div className="la-meta-label">Área</div>
            <div className="la-meta-value">{caso.area || '—'}</div>
          </div>
          <div className="la-meta-cell">
            <div className="la-meta-label">Fecha solicitud</div>
            <div className="la-meta-value">{fmtDate(caso.fechaSolicitud) || '—'}</div>
          </div>
          <div className="la-meta-cell">
            <div className="la-meta-label">Fecha límite</div>
            <div className="la-meta-value" style={{ color: isOD ? '#E24B4A' : undefined }}>
              {fmtDate(caso.deadline) || '—'}
            </div>
          </div>
          <div className="la-meta-cell">
            <div className="la-meta-label">Horario</div>
            <div className="la-meta-value">{caso.horario || '—'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="la-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`la-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumen ── */}
      {tab === 'resumen' && (
        <div className="la-grid-2">
          <div className="la-card">
            <div className="la-card-header"><span className="la-card-title">Descripción del servicio</span></div>
            <div className={`la-prose ${proseClass}`}>{caso.description || '—'}</div>
          </div>
          <div className="la-card">
            <div className="la-card-header"><span className="la-card-title">Acción requerida</span></div>
            {caso.action && (
              <div style={{ marginBottom: 10 }}>
                <span className={`la-badge ${priorityBadgeClass(caso.priority)}`}>{caso.action}</span>
              </div>
            )}
            {caso.link && (
              <div style={{ marginBottom: 10 }}>
                {isDriveLink ? (
                  <a href={caso.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: '#534AB7', textDecoration: 'none' }}>
                    Ver carpeta en Drive ↗
                  </a>
                ) : (
                  <a href={caso.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: '#534AB7', wordBreak: 'break-all' }}>
                    {caso.link}
                  </a>
                )}
              </div>
            )}
            {caso.notes && (
              <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{caso.notes}</p>
            )}
            {!caso.action && !caso.link && !caso.notes && (
              <span style={{ fontSize: 13, color: '#9c9a92' }}>—</span>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Lo actuado ── */}
      {tab === 'actuado' && (
        <div className="la-grid-2">
          {/* Hechos */}
          <div className="la-card">
            <div className="la-card-header"><span className="la-card-title">Hechos / Antecedentes</span></div>
            {hechosLines.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9c9a92' }}>—</p>
            ) : (
              <div className="la-timeline">
                {hechosLines.map((line, i) => (
                  <div key={i} className="la-tl-entry">
                    <div className="la-tl-dot" style={{ background: i === 0 ? '#3C3489' : '#AFA9EC' }} />
                    <div className="la-tl-body">{line}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Procedimiento */}
          <div className="la-card">
            <div className="la-card-header"><span className="la-card-title">Procedimiento — ¿Cómo hacerlo?</span></div>
            {procLines.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9c9a92' }}>—</p>
            ) : (
              <div className="la-timeline">
                {procLines.map((line, i) => (
                  <div key={i} className="la-tl-entry">
                    <div className="la-tl-dot" style={{ background: i === 0 ? '#0F6E56' : '#5DCAA5' }} />
                    <div className="la-tl-body">{line}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Tareas ── */}
      {tab === 'tareas' && (
        <div className="la-card">
          <div className="la-card-header"><span className="la-card-title">Pasos pendientes</span></div>
          {procLines.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9c9a92' }}>Sin pasos registrados.</p>
          ) : (
            procLines.map((line, i) => (
              <div key={i} className="la-task-list-item">
                <div className="la-task-num">{i + 1}</div>
                <div className="la-task-list-text">{line}</div>
                {caso.priority && <span className={`la-badge ${priorityBadgeClass(caso.priority)}`}>{caso.priority}</span>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Audiencias ── */}
      {tab === 'audiencias' && (
        <div className="la-card">
          <div className="la-card-header"><span className="la-card-title">Audiencias</span></div>
          {hasHearing ? (
            <div className="la-audiencia-card">
              <div className="la-audiencia-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="4" width="14" height="12" rx="2" stroke="#E24B4A" strokeWidth="1.4"/>
                  <path d="M6 2v4M12 2v4M2 8h14" stroke="#E24B4A" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Próxima audiencia</div>
                <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 2 }}>
                  {fmtDate(caso.deadline)} · {caso.horario} · {caso.carpeta}
                </div>
              </div>
              {isMeetLink && caso.link && (
                <a
                  href={caso.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="la-btn la-btn-primary la-btn-sm"
                  style={{ textDecoration: 'none' }}>
                  Unirse
                </a>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9c9a92' }}>No hay audiencias registradas.</p>
          )}
        </div>
      )}

      {/* ── Tab: Documentos ── */}
      {tab === 'documentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {caso.link ? (
            <div className="la-card">
              <div className="la-card-header">
                <span className="la-card-title">Expediente / Documentos</span>
                {isDriveLink && (
                  <span style={{ fontSize: 11, color: '#9c9a92' }}>Google Drive</span>
                )}
              </div>
              {/* Drive folder access */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', borderBottom: '0.5px solid rgba(0,0,0,0.10)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: isDriveLink ? '#EEEDFE' : '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isDriveLink ? (
                    <svg width="24" height="20" viewBox="0 0 87.3 78" fill="none">
                      <path d="M6.6 66.85L11.5 75a5 5 0 004.3 2.5h49.8a5 5 0 004.3-2.5l4.9-8.15H6.6z" fill="#0066DA"/>
                      <path d="M43.65 8.35L23.35 43.65l4.5 7.5 20.3-35.3L63.5 43.65h9L43.65 8.35z" fill="#00AC47"/>
                      <path d="M63.5 43.65H34.5l-4.5 7.5 4.5 7.5h29l4.5-7.5-4.5-7.5z" fill="#FFBA00"/>
                      <path d="M6.6 66.85l19.65-34.5H6.6L0 43.65 6.6 66.85z" fill="#0066DA"/>
                      <path d="M43.65 8.35L24 43.65H6.6l19.65-34.5L43.65 8.35z" fill="#00832D"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M12 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-6-6z" stroke="#9c9a92" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 2v6h6" stroke="#9c9a92" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {isDriveLink ? (isDriveFolder ? 'Carpeta del expediente en Drive' : 'Documento en Drive') : 'Enlace del expediente'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9c9a92', wordBreak: 'break-all' }}>{caso.link}</div>
                  {isDriveLink && (
                    <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 4 }}>
                      Se abrirá en Google Drive con tu cuenta de Google activa en el navegador
                    </div>
                  )}
                </div>
                <a href={caso.link} target="_blank" rel="noopener noreferrer"
                  className="la-btn la-btn-primary" style={{ textDecoration: 'none', flexShrink: 0 }}>
                  {linkLabel} ↗
                </a>
              </div>
              {isDriveFolder && (
                <div style={{ padding: '12px 0 0', fontSize: 12, color: '#9c9a92', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M7 5v4M7 4v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Para ver los archivos, asegurate de estar conectado con la cuenta de Google que tiene acceso a esta carpeta.
                  Para subir documentos, abrí la carpeta en Drive y subí los archivos directamente.
                </div>
              )}
            </div>
          ) : (
            <div className="la-card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 13, color: '#9c9a92' }}>Sin expediente o enlace vinculado a este caso.</p>
              <p style={{ fontSize: 12, color: '#9c9a92', marginTop: 8 }}>Editá el caso para agregar el link del expediente en Drive.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Responsables ── */}
      {tab === 'responsables' && (
        <div className="la-card">
          <div className="la-card-header"><span className="la-card-title">Equipo asignado</span></div>
          {!caso.pm && !caso.assignee ? (
            <p style={{ fontSize: 13, color: '#9c9a92' }}>Sin responsables asignados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {caso.pm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="la-resp-avatar" style={{ background: '#3C3489' }}>{initials(caso.pm)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{caso.pm}</div>
                    <div style={{ fontSize: 12, color: '#9c9a92' }}>Responsable Calité — Supervisor</div>
                  </div>
                </div>
              )}
              {caso.assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="la-resp-avatar" style={{ background: '#085041' }}>{initials(caso.assignee)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{caso.assignee}</div>
                    <div style={{ fontSize: 12, color: '#9c9a92' }}>Responsable asignado</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit slide-over from detail */}
      {editing && (
        <EditPanel
          caso={caso}
          section={section}
          sectionIdx={sectionIdx}
          projectId={projectId}
          spreadsheetId={spreadsheetId}
          sheetTab={sheetTab}
          onClose={() => setEditing(false)}
          onSaved={updated => {
            onUpdated(rowToCase(updated, section.bindings, section));
            setEditing(false);
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 5 — EQUIPO
// ─────────────────────────────────────────────────────────────────────────────
function EquipoView({ cases }: { cases: LegalCase[] }) {
  const byPerson: Record<string, { items: LegalCase[]; urgent: number; carpetas: Record<string, number> }> = {};
  cases.forEach(c => {
    const p = c.assignee || '—';
    if (!byPerson[p]) byPerson[p] = { items: [], urgent: 0, carpetas: {} };
    byPerson[p].items.push(c);
    if (/urgent|alta/i.test(c.priority)) byPerson[p].urgent++;
    if (c.carpeta) byPerson[p].carpetas[c.carpeta] = (byPerson[p].carpetas[c.carpeta] ?? 0) + 1;
  });
  const sorted = Object.entries(byPerson).sort((a, b) => b[1].items.length - a[1].items.length);

  return (
    <>
      <div className="la-section-header" style={{ marginBottom: 16 }}>
        <span className="la-section-label">Equipo</span>
      </div>
      <div className="la-card-p0">
        <div className="la-table-wrap">
          <table className="la-table">
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Asignados</th>
                <th>Urgentes</th>
                <th>Distribución</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#9c9a92', padding: '32px' }}>
                    Sin responsables asignados.
                  </td>
                </tr>
              ) : sorted.map(([name, s]) => (
                <tr key={name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`la-case-avatar ${avatarClass(name)}`}>{initials(name)}</div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 14 }}>{s.items.length}</td>
                  <td>
                    {s.urgent > 0
                      ? <span className="la-badge la-badge-penal">{s.urgent}</span>
                      : <span style={{ color: '#9c9a92' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Object.entries(s.carpetas).map(([cp]) => (
                        <span key={cp} className={`la-badge ${carpetaClass(cp)}`}>{cp}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClienteDetailView — full client profile page (matches Image #16)
// ─────────────────────────────────────────────────────────────────────────────
function ClienteDetailView({ clientName, cases, onBack, onViewCase, onNewCase }: {
  clientName: string; cases: LegalCase[]; onBack: () => void;
  onViewCase: (c: LegalCase) => void; onNewCase: () => void;
}) {
  const [tab, setTab] = useState<'casos' | 'documentos' | 'actividad' | 'contratos'>('casos');
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const urgent    = cases.filter(c => /urgent|alta/i.test(c.priority)).length;
  const finalized = cases.filter(c => /finaliz|cerrad/i.test(c.status)).length;
  const active    = cases.filter(c => !/finaliz|cerrad/i.test(c.status)).length;
  const nextDeadline = [...cases].filter(c => c.deadline).sort((a, b) => {
    const da = daysUntil(a.deadline) ?? 9999, db = daysUntil(b.deadline) ?? 9999;
    return da - db;
  })[0];
  const driveLinks = cases.filter(c => c.link && /^https?:\/\//i.test(c.link));

  // Group by carpeta
  const byArea: Record<string, LegalCase[]> = {};
  cases.forEach(c => {
    const k = c.carpeta || 'Sin clasificar';
    if (!byArea[k]) byArea[k] = [];
    byArea[k].push(c);
  });

  // All responsables
  const allResp = [...new Set(cases.map(c => [c.assignee, c.pm]).flat().filter(Boolean))];

  const toggleArea = (area: string) => setExpandedAreas(prev => {
    const n = new Set(prev);
    n.has(area) ? n.delete(area) : n.add(area);
    return n;
  });

  const ndDays = nextDeadline ? daysUntil(nextDeadline.deadline) : null;
  const ndLabel = ndDays === null ? '—' : ndDays === 0 ? 'Hoy' : ndDays < 0 ? `Hace ${Math.abs(ndDays)}d` : ndDays === 1 ? 'Mañana' : `En ${ndDays}d`;
  const ndOverdue = ndDays !== null && ndDays < 0;

  const AREA_COLORS_LIST = ['#E24B4A','#534AB7','#0F6E56','#633806','#712B13','#0C447C'];

  return (
    <>
      <button className="la-back-btn" onClick={onBack}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Clientes
      </button>

      {/* Client header card */}
      <div className="la-card" style={{ padding: '20px 24px', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#3C3489', color: '#fff', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {initials(clientName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{clientName}</div>
            <div style={{ fontSize: 12, color: '#9c9a92', marginBottom: 8 }}>
              Persona jurídica · {cases[0]?.pm || cases[0]?.assignee || '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="la-estado la-e-proceso" style={{ fontSize: 11 }}>● Cliente activo</span>
              <span style={{ fontSize: 12, color: '#9c9a92' }}>{cases.length} pendientes activos</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="la-btn la-btn-sm" onClick={onNewCase}>+ Nuevo caso</button>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 16, paddingTop: 16, borderTop: '0.5px solid rgba(0,0,0,0.1)' }}>
          {[
            { label: 'Responsable asignado', value: allResp.slice(0, 3).join(' / ') || '—' },
            { label: 'Carpeta principal', value: Object.entries(byArea).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || '—' },
            { label: 'Casos urgentes', value: String(urgent) },
            { label: 'Con enlace', value: String(driveLinks.length) },
          ].map((item, i) => (
            <div key={i} style={{ padding: '0 14px', borderRight: i < 3 ? '0.5px solid rgba(0,0,0,0.1)' : 'none', paddingLeft: i === 0 ? 0 : undefined }}>
              <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'Total de casos', value: cases.length, sub: 'total registrados', color: undefined },
          { label: 'Casos activos', value: active, sub: 'en proceso', color: '#534AB7' },
          { label: 'Finalizados', value: finalized, sub: 'cerrados', color: '#0F6E56' },
          { label: 'Próx. vencimiento', value: ndLabel, sub: nextDeadline ? truncate(nextDeadline.description, 20) : 'sin plazos', color: ndOverdue ? '#E24B4A' : undefined },
          { label: 'Documentos', value: driveLinks.length, sub: 'con enlace', color: undefined },
        ].map((k, i) => (
          <div key={i} className="la-kpi-card" style={{ padding: '12px 14px' }}>
            <div className="la-kpi-label">{k.label}</div>
            <div className="la-kpi-value" style={{ fontSize: 22, color: k.color || undefined }}>{k.value}</div>
            <div className="la-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="la-tabs">
        {(['casos', 'documentos', 'actividad', 'contratos'] as const).map(t => (
          <button key={t} className={`la-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'casos' ? 'Casos' : t === 'documentos' ? 'Documentos' : t === 'actividad' ? 'Actividad' : 'Contratos'}
          </button>
        ))}
      </div>

      {/* Casos tab — grouped by carpeta */}
      {tab === 'casos' && (
        <div className="la-card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.1)', fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Casos y pendientes por área
          </div>
          {Object.entries(byArea).sort((a, b) => b[1].length - a[1].length).map(([area, areaCases], areaIdx) => {
            const isOpen = !expandedAreas.has(area); // default open
            const dotColor = AREA_COLORS_LIST[areaIdx % AREA_COLORS_LIST.length];
            return (
              <div key={area}>
                <div onClick={() => toggleArea(area)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  cursor: 'pointer', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
                  background: 'transparent'
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, flex: 1 }}>{area}</span>
                  <span className={`la-badge ${carpetaClass(area)}`}>{areaCases.length} casos</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#9c9a92' }}>
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {isOpen && areaCases.map(c => (
                  <div key={c._id} onClick={() => onViewCase(c)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px 11px 36px',
                    borderBottom: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer'
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <div style={{ fontSize: 12, color: '#9c9a92', width: 60, flexShrink: 0 }}>N° {c.num}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {truncate(c.description, 70)}
                      </div>
                      <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 2 }}>{c.assignee || c.pm}</div>
                    </div>
                    <span className={`la-estado ${statusClass(c.status)}`}>{c.status || '—'}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Documentos tab */}
      {tab === 'documentos' && (
        <div className="la-card">
          <div className="la-card-header"><span className="la-card-title">Documentos vinculados</span></div>
          {driveLinks.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9c9a92' }}>Sin documentos vinculados para este cliente.</p>
          ) : driveLinks.map(c => (
            <div key={c._id} className="la-case-item">
              <div className="la-case-avatar la-av-purple" style={{ borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LinkIcon url={c.link} />
              </div>
              <div className="la-case-info">
                <div className="la-case-title">{truncate(c.description, 50)}</div>
                <div className="la-case-client">{linkTypeLabel(c.link)}{c.carpeta ? ` · ${c.carpeta}` : ''}</div>
              </div>
              <a href={c.link} target="_blank" rel="noopener noreferrer" className="la-btn la-btn-sm" style={{ textDecoration: 'none', flexShrink: 0 }}>
                Abrir ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Actividad tab — timeline of recent actions */}
      {tab === 'actividad' && (() => {
        const events = [...cases]
          .filter(c => c.deadline || c.fechaSolicitud || c.status)
          .sort((a, b) => {
            const da = daysUntil(a.deadline) ?? 9999;
            const db = daysUntil(b.deadline) ?? 9999;
            return da - db;
          })
          .slice(0, 20);

        const actIcon = (c: LegalCase) => {
          if (/finaliz|cerrad/i.test(c.status)) return { icon: '✓', bg: '#0F6E56', label: 'Caso cerrado' };
          if (/urgent/i.test(c.priority)) return { icon: '!', bg: '#E24B4A', label: 'Urgente' };
          if (/en progres/i.test(c.status)) return { icon: '▶', bg: '#534AB7', label: 'En progreso' };
          if (/pendiente/i.test(c.status)) return { icon: '○', bg: '#633806', label: 'Pendiente' };
          return { icon: '·', bg: '#9c9a92', label: c.status || 'Sin estado' };
        };

        return (
          <div className="la-card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.1)', fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Actividad reciente
            </div>
            <div style={{ padding: '8px 0' }}>
              {events.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9c9a92', padding: '16px' }}>Sin actividad registrada.</p>
              ) : events.map((c, i) => {
                const ev = actIcon(c);
                const days = daysUntil(c.deadline);
                const isLast = i === events.length - 1;
                return (
                  <div key={c._id} style={{ display: 'flex', gap: 14, padding: '10px 16px', position: 'relative' }}>
                    {/* Vertical line */}
                    {!isLast && (
                      <div style={{ position: 'absolute', left: 27, top: 32, bottom: 0, width: 1, background: 'rgba(0,0,0,0.08)' }} />
                    )}
                    {/* Icon */}
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: ev.bg,
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1
                    }}>
                      {ev.icon}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {truncate(c.description || c.action || `N° ${c.num}`, 60)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#9c9a92' }}>{ev.label}</span>
                        {c.carpeta && <span className={`la-badge ${carpetaClass(c.carpeta)}`} style={{ fontSize: 10 }}>{c.carpeta}</span>}
                        {c.assignee && <span style={{ fontSize: 11, color: '#9c9a92' }}>· {c.assignee}</span>}
                      </div>
                    </div>
                    {/* Deadline */}
                    {c.deadline && (
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: days !== null && days < 0 ? '#E24B4A' : days !== null && days <= 3 ? '#BA7517' : '#9c9a92' }}>
                          {days !== null ? (days === 0 ? 'HOY' : days < 0 ? `Vencido` : `En ${days}d`) : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: '#9c9a92' }}>{fmtDate(c.deadline)}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Contratos tab — contract cards derived from case data */}
      {tab === 'contratos' && (() => {
        // Group cases by carpeta — each carpeta becomes a "contract type"
        const byCarpeta = Object.entries(byArea).sort((a, b) => b[1].length - a[1].length);
        const primaryCarpeta = byCarpeta[0];
        const firstCase = cases[0];
        const latestDeadline = [...cases].filter(c => c.deadline).sort((a, b) => (daysUntil(b.deadline) ?? 0) - (daysUntil(a.deadline) ?? 0))[0];
        const earliestSolicitud = [...cases].filter(c => c.fechaSolicitud).sort()[0];
        const driveDoc = driveLinks[0];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byCarpeta.length === 0 ? (
              <div className="la-card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 13, color: '#9c9a92' }}>Sin contratos registrados para este cliente.</p>
              </div>
            ) : byCarpeta.map(([carpetaNombre, carpetaCases], idx) => {
              const caseForContract = carpetaCases[0];
              const contractDeadline = [...carpetaCases].filter(c => c.deadline).sort((a, b) => (daysUntil(b.deadline) ?? 0) - (daysUntil(a.deadline) ?? 0))[0];
              const contractStart = [...carpetaCases].filter(c => c.fechaSolicitud).sort()[0];
              const contractNotes = carpetaCases.map(c => c.notes).filter(Boolean).join(' ').slice(0, 120);
              const driveDocForCarpeta = carpetaCases.find(c => /drive\.google|docs\.google/i.test(c.link));
              const statusCounts: Record<string, number> = {};
              carpetaCases.forEach(c => { const s = c.status || 'Sin estado'; statusCounts[s] = (statusCounts[s] ?? 0) + 1; });
              const mainStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

              return (
                <div key={carpetaNombre} className="la-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Header bar */}
                  <div style={{ background: AREA_COLORS_LIST[idx % AREA_COLORS_LIST.length], padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                      {carpetaNombre}
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 10, padding: '2px 8px' }}>
                      {carpetaCases.length} caso{carpetaCases.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Contract details */}
                  <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Tipo de servicio</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{caseForContract?.area || carpetaNombre}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Estado actual</div>
                      <span className={`la-estado ${statusClass(mainStatus)}`}>{mainStatus}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Inicio</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{contractStart ? fmtDate(contractStart.fechaSolicitud) : '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Vencimiento</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: contractDeadline && (daysUntil(contractDeadline.deadline) ?? 1) < 0 ? '#E24B4A' : undefined }}>
                        {contractDeadline ? fmtDate(contractDeadline.deadline) : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Responsable</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{caseForContract?.assignee || caseForContract?.pm || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Honorarios</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Por caso</div>
                    </div>
                    {contractNotes && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 11, color: '#9c9a92', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Condiciones / observaciones</div>
                        <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>{contractNotes}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', gap: 8 }}>
                    <button className="la-btn" style={{ fontSize: 12 }}>Renovar contrato</button>
                    {driveDocForCarpeta ? (
                      <a href={driveDocForCarpeta.link} target="_blank" rel="noopener noreferrer" className="la-btn la-btn-outline" style={{ fontSize: 12, textDecoration: 'none' }}>
                        Ver en Drive ↗
                      </a>
                    ) : (
                      <button className="la-btn la-btn-outline" style={{ fontSize: 12, opacity: 0.5, cursor: 'default' }} disabled>
                        Sin PDF adjunto
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </>
  );
}

// ClientesView — list of clients
// ─────────────────────────────────────────────────────────────────────────────
function ClientesView({ cases, onViewCase, onNewCase, onViewClient }: {
  cases: LegalCase[]; onViewCase: (c: LegalCase) => void;
  onNewCase: () => void; onViewClient: (name: string) => void;
}) {
  const grouped: Record<string, { cases: LegalCase[]; urgent: number }> = {};
  cases.forEach(c => {
    const k = c.client || '—';
    if (!grouped[k]) grouped[k] = { cases: [], urgent: 0 };
    grouped[k].cases.push(c);
    if (/urgent|alta/i.test(c.priority)) grouped[k].urgent++;
  });
  const sorted = Object.entries(grouped).sort((a, b) => b[1].cases.length - a[1].cases.length);

  return (
    <>
      <div className="la-section-header">
        <span className="la-section-label">{sorted.length} clientes activos</span>
      </div>
      <div className="la-card-p0">
        <table className="la-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Cliente</th>
              <th style={{ width: '15%' }}>Pendientes</th>
              <th style={{ width: '15%' }}>Urgentes</th>
              <th>Áreas</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([name, data]) => {
              const areas: Record<string, number> = {};
              data.cases.forEach(c => { if (c.carpeta) areas[c.carpeta] = (areas[c.carpeta] ?? 0) + 1; });
              return (
                <tr key={name} onClick={() => onViewClient(name)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`la-case-avatar ${avatarClass(name)}`}>{initials(name)}</div>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{data.cases.length}</td>
                  <td>
                    {data.urgent > 0
                      ? <span className="la-estado la-e-urgente">{data.urgent}</span>
                      : <span style={{ color: '#6e6c66' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {Object.entries(areas).slice(0, 3).map(([a, n]) => (
                        <span key={a} className={`la-badge ${carpetaClass(a)}`}>{a} {n}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TareasView
// ─────────────────────────────────────────────────────────────────────────────
const DONE_STATUSES = new Set(['listo','completado','done','hecho','cerrado','resuelto','finished','closed']);

function TareasView({
  cases, onViewCase, projectId, spreadsheetId, section, sectionIdx, setCases,
}: {
  cases: LegalCase[];
  onViewCase: (c: LegalCase) => void;
  projectId?: string;
  spreadsheetId?: string;
  section?: SectionWithRecords;
  sectionIdx?: number;
  setCases?: (updater: (prev: LegalCase[]) => LegalCase[]) => void;
}) {
  const [filter, setFilter] = useState<'todos' | 'hoy' | 'semana'>('todos');
  // Initialise from actual case status so the checkbox reflects the real sheet value
  const [done, setDone] = useState<Set<string>>(
    () => new Set(cases.filter(c => DONE_STATUSES.has((c.status || '').toLowerCase())).map(c => c._id))
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const filtered = cases
    .filter(c => c.deadline)
    .filter(c => {
      const d = daysUntil(c.deadline);
      if (filter === 'hoy') return d !== null && d <= 0 && d >= -1;
      if (filter === 'semana') return d !== null && d <= 7;
      return true;
    })
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''));

  const groups: { date: string; label: string; cases: LegalCase[] }[] = [];
  filtered.forEach(c => {
    const key = c.deadline;
    const d = daysUntil(c.deadline);
    let label = fmtDate(c.deadline);
    if (d !== null && d < 0) label = `Vence hoy — ${fmtDate(c.deadline)}`;
    else if (d === 0) label = `Vence hoy — ${fmtDate(c.deadline)}`;
    const g = groups.find(x => x.date === key);
    if (g) g.cases.push(c);
    else groups.push({ date: key ?? '', label, cases: [c] });
  });

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span className="la-section-label">PENDIENTES POR FECHA LÍMITE — {cases.length > 0 ? (cases[0].client || 'TEMPLO 2') : 'TEMPLO 2'}</span>
        <div className="la-pill-row">
          {(['todos', 'hoy', 'semana'] as const).map(f => (
            <button key={f} className={`la-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'todos' ? 'Todos' : f === 'hoy' ? 'Hoy' : 'Esta semana'}
            </button>
          ))}
        </div>
      </div>
      {groups.map(group => {
        const overdue = (daysUntil(group.date) ?? 0) < 0;
        return (
          <div key={group.date} className="la-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: overdue ? '#E24B4A' : undefined }}>
                {group.label}
              </span>
              <span style={{ fontSize: 11, color: '#9c9a92' }}>{group.cases.length} pendientes</span>
            </div>
            {group.cases.map(c => (
              <div key={c._id} className="la-task-item" style={{ alignItems: 'flex-start', padding: '10px 0' }}>
                <div
                  className={`la-task-check ${done.has(c._id) ? 'done' : ''}`}
                  style={{ marginTop: 2, flexShrink: 0 }}
                  onClick={async () => {
                    const wasDone = done.has(c._id);
                    const newStatus = wasDone ? 'PENDIENTE' : 'LISTO';
                    setDone(prev => { const n = new Set(prev); wasDone ? n.delete(c._id) : n.add(c._id); return n; });
                    // Persist to DB and sheet if project is connected
                    if (projectId && section) {
                      const statusColId = section.bindings.status;
                      if (statusColId) {
                        const patch = { [statusColId]: newStatus };
                        // Update Supabase record
                        fetch(`/api/projects/${projectId}/records/${c._id}?section=${sectionIdx ?? 0}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(patch),
                        }).then(r => r.json()).then(updated => {
                          if (setCases) setCases(prev => prev.map(x => x._id === c._id ? { ...x, status: newStatus } : x));
                          // Sync to Google Sheet
                          if (spreadsheetId) {
                            fetch('/api/projects/sync-record', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ projectId, recordId: c._id, patch }),
                            }).catch(() => {});
                          }
                        }).catch(() => {});
                      }
                    }
                  }}>
                  {done.has(c._id) && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onViewCase(c)}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: done.has(c._id) ? 'line-through' : 'none', opacity: done.has(c._id) ? 0.5 : 1 }}>
                    {truncate(c.description || c.num, 60)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 2 }}>
                    {c.client} · {c.carpeta}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: overdue ? '#E24B4A' : '#9c9a92' }}>{fmtDate(c.deadline)}</div>
                  <div style={{ fontSize: 10, color: '#9c9a92', marginTop: 2 }}>{c.assignee || c.pm}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {groups.length === 0 && (
        <div className="la-card" style={{ textAlign: 'center', padding: 40, color: '#9c9a92' }}>
          Sin tareas para este filtro.
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DocumentosView
// ─────────────────────────────────────────────────────────────────────────────
function linkDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function linkTypeLabel(url: string): string {
  const h = linkDomain(url);
  if (/drive\.google|docs\.google/.test(h)) return 'Google Drive';
  if (/github/.test(h)) return 'GitHub';
  if (/figma/.test(h)) return 'Figma';
  if (/notion/.test(h)) return 'Notion';
  if (/trello/.test(h)) return 'Trello';
  if (/jira|atlassian/.test(h)) return 'Jira';
  if (/youtube|youtu\.be/.test(h)) return 'YouTube';
  if (/loom/.test(h)) return 'Loom';
  if (/miro/.test(h)) return 'Miro';
  if (/linear/.test(h)) return 'Linear';
  return h || 'Enlace externo';
}

function LinkIcon({ url }: { url: string }) {
  const h = linkDomain(url);
  if (/drive\.google|docs\.google/.test(h)) return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2L2 11h10L7 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
  if (/github/.test(h)) return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5a5.5 5.5 0 00-1.74 10.72c.28.05.38-.12.38-.26v-.9c-1.53.33-1.85-.74-1.85-.74-.25-.64-.61-.81-.61-.81-.5-.34.04-.33.04-.33.55.04.84.57.84.57.49.84 1.28.6 1.59.46.05-.36.19-.6.35-.74-1.22-.14-2.5-.61-2.5-2.72 0-.6.21-1.09.57-1.48-.06-.14-.25-.7.05-1.46 0 0 .47-.15 1.53.57A5.3 5.3 0 017 5.08c.47 0 .95.06 1.4.19 1.06-.72 1.52-.57 1.52-.57.3.76.11 1.32.05 1.46.36.39.57.88.57 1.48 0 2.12-1.29 2.58-2.51 2.72.2.17.37.51.37 1.02v1.52c0 .14.1.31.38.26A5.5 5.5 0 007 1.5z" fill="currentColor"/>
    </svg>
  );
  if (/figma/.test(h)) return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="2" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="7.5" y="2" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="2" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="9.75" cy="9.75" r="2.25" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
  // Generic link icon
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5.5 8.5l3-3M6 4H4a2 2 0 000 4h2M8 10h2a2 2 0 000-4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function DocumentosView({ cases }: { cases: LegalCase[] }) {
  // Show all cases that have ANY link value (URL or reference text).
  // After reconnecting the sheet, links will be proper Drive URLs.
  const withLinks = cases.filter(c => c.link && c.link.trim().length > 0);
  const isUrl = (s: string) => /^https?:\/\//i.test(s);

  // Group by domain for the right-side panel
  const byDomain: Record<string, LegalCase[]> = {};
  for (const c of withLinks) {
    const d = linkTypeLabel(c.link);
    if (!byDomain[d]) byDomain[d] = [];
    byDomain[d].push(c);
  }
  const domainEntries = Object.entries(byDomain).sort((a, b) => b[1].length - a[1].length);

  return (
    <>
      <div className="la-section-header" style={{ marginBottom: 2 }}>
        <span className="la-section-label">GESTIÓN DOCUMENTAL</span>
      </div>
      <div className="la-grid-2">
        {/* Left: recent documents */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">Documentos vinculados</span>
            {withLinks.length > 0 && (
              <span style={{ fontSize: 11, color: '#9c9a92' }}>{withLinks.length} enlace{withLinks.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          {withLinks.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9c9a92' }}>
              Sin referencias vinculadas. Reconecta la hoja para cargar los enlaces de Drive.
            </p>
          ) : (
            withLinks.map(c => (
              <div key={c._id} className="la-file-row">
                <div className={`la-file-icon ${carpetaClass(c.carpeta)}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinkIcon url={c.link} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {truncate(c.description || c.num, 40)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 2 }}>
                    {c.client && <span>{c.client} · </span>}
                    <span>{isUrl(c.link) ? linkTypeLabel(c.link) : 'Referencia'}</span>
                  </div>
                </div>
                {isUrl(c.link) ? (
                  <a href={c.link} target="_blank" rel="noopener noreferrer"
                    className="la-btn la-btn-sm" style={{ textDecoration: 'none' }}>
                    Abrir ↗
                  </a>
                ) : (
                  <span className="la-btn la-btn-sm" style={{ color: '#9c9a92', cursor: 'default' }}>{truncate(c.link, 16)}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: grouped by service/domain */}
        <div className="la-card">
          <div className="la-card-header">
            <span className="la-card-title">Por servicio</span>
          </div>
          {domainEntries.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9c9a92' }}>Sin enlaces vinculados.</p>
          ) : (
            domainEntries.map(([domain, domainCases]) => (
              <div key={domain} className="la-case-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <div className="la-case-avatar la-av-purple" style={{ borderRadius: 6, flexShrink: 0 }}>
                    <LinkIcon url={domainCases[0].link} />
                  </div>
                  <div className="la-case-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="la-case-title">{domain}</div>
                    <div className="la-case-client">{domainCases.length} enlace{domainCases.length !== 1 ? 's' : ''}</div>
                  </div>
                  <span className="la-badge la-badge-gray">{domainCases.length}</span>
                </div>
                <div style={{ paddingLeft: 36, display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  {domainCases.map(c => (
                    isUrl(c.link) ? (
                      <a key={c._id} href={c.link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#534AB7', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                        ↗ {truncate(c.description || c.num || c.link, 45)}
                      </a>
                    ) : (
                      <span key={c._id} style={{ fontSize: 12, color: '#9c9a92', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        📎 {c.link}
                      </span>
                    )
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContratosView
// ─────────────────────────────────────────────────────────────────────────────
function ContratosView({ cases }: { cases: LegalCase[] }) {
  const byClient: Record<string, LegalCase> = {};
  cases.forEach(c => { if (c.client && !byClient[c.client]) byClient[c.client] = c; });
  const contracts = Object.values(byClient).slice(0, 10);

  return (
    <>
      <div className="la-section-header" style={{ marginBottom: 2 }}>
        <span className="la-section-label">CONTRATOS DE SERVICIOS</span>
      </div>
      <div className="la-card-p0">
        <table className="la-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Cliente</th>
              <th style={{ width: '22%' }}>Tipo de servicio</th>
              <th style={{ width: '15%' }}>Casos activos</th>
              <th style={{ width: '20%' }}>Último vencimiento</th>
              <th style={{ width: '15%' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => {
              const clientCases = cases.filter(x => x.client === c.client);
              const latestDeadline = clientCases.map(x => x.deadline).filter(Boolean).sort().reverse()[0];
              const d = daysUntil(latestDeadline);
              const overdue = d !== null && d < 0;
              return (
                <tr key={c.client}>
                  <td style={{ fontWeight: 500 }}>{c.client}</td>
                  <td><span className={`la-badge ${carpetaClass(c.carpeta)}`}>{c.carpeta || 'Servicios generales'}</span></td>
                  <td style={{ fontWeight: 700 }}>{clientCases.length}</td>
                  <td style={{ color: overdue ? '#E24B4A' : undefined, fontSize: 12 }}>{fmtDate(latestDeadline) || '—'}</td>
                  <td>
                    <span className={`la-estado ${overdue ? 'la-e-urgente' : 'la-e-proceso'}`}>
                      {overdue ? 'Vence pronto' : 'Vigente'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {contracts.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9c9a92', padding: 32 }}>Sin contratos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NewCaseModal — add a new row
// ─────────────────────────────────────────────────────────────────────────────
function NewCaseModal({ section, sectionIdx, projectId, onClose, onAdded }: {
  section: SectionWithRecords; sectionIdx: number; projectId: string;
  onClose: () => void; onAdded: (c: LegalCase) => void;
}) {
  const cols = section.schema.columns;
  const [vals, setVals]              = useState<Record<string, string>>({});
  const [saving, setSaving]          = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [showDrivePicker, setShowDP] = useState(false);
  // Drive file upload state
  const [pendingFile,  setPendingFile]  = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState<string>(''); // folder URL or ID
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }));
  const linkCol = cols.find(c => c.semanticRole === 'link' || c.type === 'url');

  async function save() {
    setSaving(true); setError(null);
    try {
      // If user picked a file to upload, do it first
      let linkUrl = vals[linkCol?.id ?? ''] ?? '';
      if (pendingFile && uploadFolder) {
        const fd = new FormData();
        fd.append('file', pendingFile);
        fd.append('folderId', uploadFolder);
        const upRes = await fetch('/api/drive/upload', { method: 'POST', body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error ?? 'Error subiendo archivo a Drive');
        linkUrl = upData.webViewLink ?? '';
        if (linkCol) set(linkCol.id, linkUrl);
      }

      const body: Record<string, string> = {};
      for (const col of cols) {
        if (col.semanticRole === 'identifier') continue;
        const v = col.id === linkCol?.id ? linkUrl : (vals[col.id] ?? '');
        if (v !== '') body[col.id] = v;
      }
      // Auto-assign N°
      const identifierCol = cols.find(c => c.semanticRole === 'identifier');
      if (identifierCol) {
        const maxNum = section.records.reduce((m, r) => {
          const n = parseInt(String(r[identifierCol.id] ?? '0'), 10);
          return isNaN(n) ? m : Math.max(m, n);
        }, 0);
        body[identifierCol.id] = String(maxNum + 1);
      }
      const res = await fetch(`/api/projects/${projectId}/records?section=${sectionIdx}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdded(rowToCase(data, section.bindings, section));
      onClose();
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="la-panel-backdrop" onClick={onClose} />
      <div className="la-edit-panel">
        <div className="la-ep-header">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nuevo caso</div>
            <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 2 }}>Completa los campos del nuevo pendiente</div>
          </div>
          <button className="la-btn la-btn-sm" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
        </div>
        <div className="la-ep-body">
          {cols
            .filter(col => col.semanticRole !== 'identifier')
            .map(col => {
              const isLinkCol = col.semanticRole === 'link' || col.type === 'url';
              if (isLinkCol) {
                return (
                  <div key={col.id} className="la-field">
                    <label className="la-field-label">{col.label}</label>
                    {/* Folder target row */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input
                        className="la-field-input"
                        style={{ flex: 1 }}
                        placeholder="URL del documento o carpeta…"
                        value={vals[col.id] ?? ''}
                        onChange={e => set(col.id, e.target.value)}
                      />
                      <button className="la-btn la-btn-sm" type="button" onClick={() => setShowDP(true)}
                        title="Seleccionar carpeta de destino en Drive">
                        📁 Carpeta
                      </button>
                    </div>
                    {/* File upload row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0] ?? null;
                          setPendingFile(f);
                          if (f) {
                            // Use link field value as folder if it looks like a folder URL
                            const cur = vals[col.id] ?? '';
                            if (cur.includes('/folders/') || (!cur.startsWith('http') && cur)) {
                              setUploadFolder(cur);
                            }
                          }
                        }}
                      />
                      <button className="la-btn la-btn-sm" type="button"
                        onClick={() => {
                          const cur = vals[col.id] ?? '';
                          if (cur.includes('/folders/') || (!cur.startsWith('http') && cur.length > 4)) {
                            setUploadFolder(cur);
                          }
                          fileInputRef.current?.click();
                        }}
                        style={{ whiteSpace: 'nowrap' }}>
                        ⬆ Subir archivo
                      </button>
                      {pendingFile ? (
                        <span style={{ fontSize: 11, color: '#534AB7', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📎 {pendingFile.name}
                          <button style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9c9a92', fontSize: 11 }}
                            onClick={() => { setPendingFile(null); setUploadFolder(''); }}>✕</button>
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#9c9a92' }}>
                          {uploadFolder ? `→ ${uploadFolder.split('/').pop() ?? 'carpeta'}` : 'Selecciona carpeta primero, luego sube el archivo'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <DynamicField
                  key={col.id}
                  col={col}
                  value={vals[col.id] ?? ''}
                  onChange={v => set(col.id, v)}
                />
              );
            })}
          {showDrivePicker && (
            <DriveFolderPickerModal
              onClose={() => setShowDP(false)}
              onSelect={(url) => {
                if (linkCol) {
                  set(linkCol.id, url);
                  setUploadFolder(url);
                }
                setShowDP(false);
              }}
            />
          )}
          {error && <div style={{ fontSize: 12, color: '#E24B4A', background: 'rgba(226,75,74,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
        </div>
        <div className="la-ep-footer">
          <button className="la-btn" onClick={onClose}>Cancelar</button>
          <button className="la-btn la-btn-primary" onClick={save} disabled={saving}>
            {saving ? (pendingFile ? 'Subiendo archivo…' : 'Guardando…') : 'Crear caso'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LegalShell — main exported component
// ─────────────────────────────────────────────────────────────────────────────
export function LegalShell({ project }: { project: FullProject }) {
  const sectionIdx = project.sections.findIndex(s => s.domain === 'legal_pendings');
  const section    = project.sections[sectionIdx >= 0 ? sectionIdx : 0] as SectionWithRecords;

  const [cases, setCasesRaw] = useState<LegalCase[]>(() =>
    section.records.map(r => rowToCase(r, section.bindings, section))
  );
  const [view,        setView]       = useState<LegalViewId>('panel');
  const [prevView,    setPrevView]   = useState<LegalViewId>('panel');
  const [detailCase,  setDetailCase] = useState<LegalCase | null>(null);
  const [search,      setSearch]     = useState('');
  const [downloading, setDownloading] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectMsg, setReconnectMsg] = useState<string | null>(null);
  const [showNew,          setShowNew]          = useState(false);
  const [activeClientName, setActiveClientName] = useState<string | null>(null);

  function setCases(updater: (prev: LegalCase[]) => LegalCase[]) { setCasesRaw(updater); }
  function navTo(v: LegalViewId) {
    if (v !== 'detail' && v !== 'cliente-detail') setPrevView(v as LegalViewId);
    setView(v);
  }
  function viewCase(c: LegalCase) { setDetailCase(c); navTo('detail'); }
  function viewClient(name: string) { setActiveClientName(name); navTo('cliente-detail'); }

  async function dl() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/download`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = (project.originalFilename.replace(/\.[^.]+$/, '') ?? 'export') + '_updated.xlsx';
      a.click(); URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  }

  async function reconnect() {
    setReconnecting(true); setReconnectMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/reconnect`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setReconnectMsg('Error: ' + (data.error ?? 'unknown')); return; }
      setReconnectMsg(`Sincronizado (${data.rowCount} filas). Recargando…`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setReconnectMsg('Error de red');
    } finally {
      setReconnecting(false);
    }
  }

  const overdueCount = cases.filter(c => { const d = daysUntil(c.deadline); return d !== null && d < 0; }).length;
  const uniqueClients = new Set(cases.map(c => c.client).filter(Boolean)).size;

  const VIEW_META: Record<string, { title: string; action?: string; onAction?: () => void }> = {
    panel:           { title: 'Panel principal', action: 'Nuevo caso', onAction: () => setShowNew(true) },
    clientes:        { title: 'Clientes' },
    'cliente-detail':{ title: 'Detalle de cliente', action: 'Nuevo pendiente', onAction: () => setShowNew(true) },
    casos:           { title: 'Casos', action: 'Nuevo caso', onAction: () => setShowNew(true) },
    plazos:          { title: 'Plazos y Audiencias' },
    tareas:          { title: 'Tareas' },
    documentos:      { title: 'Documentos' },
    contratos:       { title: 'Contratos' },
    equipo:          { title: 'Equipo' },
    detail:          { title: 'Detalle del pendiente' },
  };
  const activeNavId = view === 'detail' ? prevView : view;
  const meta = VIEW_META[view] ?? VIEW_META.panel;

  return (
    <div className="la la-app">
      {/* ── Sidebar ── */}
      <aside className="la-sidebar">
        {/* Logo */}
        <div className="la-logo">
          <div className="la-logo-icon">
            <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
              <path d="M9 2L3 5v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5L9 2z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6.5 9l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="la-logo-title">{project.name}</div>
          <div className="la-logo-sub">{project.originalFilename}</div>
        </div>

        <nav className="la-nav">
          <div className="la-nav-section">Principal</div>

          {([
            { id: 'panel',    label: 'Panel principal', badge: undefined, red: false,
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/></svg> },
            { id: 'clientes', label: 'Clientes', badge: uniqueClients, red: false,
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 12c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
            { id: 'casos',    label: 'Casos', badge: cases.length, red: false,
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
            { id: 'plazos',   label: 'Plazos', badge: overdueCount || undefined, red: true,
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
            { id: 'tareas',   label: 'Tareas', badge: undefined, red: false,
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          ] as { id: LegalViewId; label: string; badge?: number; red: boolean; icon: React.ReactNode }[]).map(n => (
            <button key={n.id} className={`la-nav-item ${activeNavId === n.id ? 'active' : ''}`} onClick={() => navTo(n.id)}>
              <span className="la-nav-ico">{n.icon}</span>
              {n.label}
              {n.badge !== undefined && n.badge > 0 && (
                <span className={`la-nav-badge ${n.red ? 'red' : ''}`}>{n.badge}</span>
              )}
            </button>
          ))}

          <div className="la-nav-section">Gestión</div>
          {([
            { id: 'documentos', label: 'Documentos',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2h5.5l3 3V12a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/><path d="M8.5 2v3H11" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
            { id: 'contratos',  label: 'Contratos',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
          ] as { id: LegalViewId; label: string; icon: React.ReactNode }[]).map(n => (
            <button key={n.id} className={`la-nav-item ${activeNavId === n.id ? 'active' : ''}`} onClick={() => navTo(n.id)}>
              <span className="la-nav-ico">{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div className="la-nav-section">Sistema</div>
          <button className={`la-nav-item ${activeNavId === 'equipo' ? 'active' : ''}`} onClick={() => navTo('equipo')}>
            <span className="la-nav-ico">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 12c0-2 1.8-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10.5 9c1.5 0 2.5.8 2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </span>
            Equipo
          </button>
        </nav>

        <div className="la-sidebar-footer">
          {/* Reconnect Google Sheet — re-syncs schema, dropdowns, and _sheet_row indices */}
          {project.spreadsheetId && (
            <>
              <button onClick={reconnect} disabled={reconnecting} className="la-nav-item"
                style={{ width: '100%', textAlign: 'left', marginBottom: 4, opacity: reconnecting ? 0.6 : 1, color: '#534AB7' }}>
                <span className="la-nav-ico">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M12 7A5 5 0 1 1 7 2M7 2l2.5 2.5M7 2L4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {reconnecting ? 'Sincronizando…' : 'Sincronizar hoja'}
              </button>
              {reconnectMsg && (
                <div style={{ fontSize: 11, padding: '4px 10px 6px', color: reconnectMsg.startsWith('Error') ? '#c0392b' : '#085041' }}>
                  {reconnectMsg}
                </div>
              )}
            </>
          )}
          {/* Download up-to-date Excel */}
          <button onClick={dl} disabled={downloading} className="la-nav-item" style={{ width: '100%', textAlign: 'left', marginBottom: 4, opacity: downloading ? 0.6 : 1 }}>
            <span className="la-nav-ico">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6.5L7 9.5l3-3M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {downloading ? 'Descargando…' : 'Descargar Excel'}
          </button>
          {/* Back to org projects */}
          <Link href={project.orgId ? `/org/${project.orgId}` : '/'} style={{ textDecoration: 'none' }}>
            <div className="la-nav-item" style={{ marginBottom: 4, color: '#534AB7', fontWeight: 500 }}>
              <span className="la-nav-ico">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L4 7l5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </span>
              ← Projects
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, borderTop: '0.5px solid rgba(0,0,0,0.08)', marginTop: 4, paddingTop: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3C3489', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {initials(project.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
              <div style={{ fontSize: 11, color: '#9c9a92' }}>Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="la-main">
        <div className="la-topbar">
          <div className="la-topbar-title">{meta.title}</div>
          <div className="la-search">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="4" stroke="#9c9a92" strokeWidth="1.2"/>
              <path d="M8.5 8.5l2 2" stroke="#9c9a92" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar casos, clientes…" />
          </div>
          {meta.action && (
            <button className="la-btn la-btn-primary" onClick={meta.onAction} style={{ flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {meta.action}
            </button>
          )}
        </div>

        <div className="la-content">
          {view === 'panel' && (
            <PanelView cases={cases} section={section}
              onGoRegistros={() => navTo('casos')} onGoPlazos={() => navTo('plazos')} onViewCase={viewCase} />
          )}
          {view === 'clientes' && (
            <ClientesView cases={cases} onViewCase={viewCase} onNewCase={() => setShowNew(true)} onViewClient={viewClient} />
          )}
          {view === 'cliente-detail' && activeClientName && (
            <ClienteDetailView
              clientName={activeClientName}
              cases={cases.filter(c => c.client === activeClientName)}
              onBack={() => navTo('clientes')}
              onViewCase={viewCase}
              onNewCase={() => setShowNew(true)} />
          )}
          {view === 'casos' && (
            <RegistrosView cases={cases} section={section}
              sectionIdx={sectionIdx >= 0 ? sectionIdx : 0} projectId={project.id}
              spreadsheetId={project.spreadsheetId} sheetTab={project.sheetTab}
              search={search} setCases={setCases} onViewCase={viewCase} />
          )}
          {view === 'plazos'     && <PlazosView cases={cases} onViewCase={viewCase} />}
          {view === 'tareas'     && <TareasView cases={cases} onViewCase={viewCase}
            projectId={project.id} spreadsheetId={project.spreadsheetId}
            section={section} sectionIdx={sectionIdx >= 0 ? sectionIdx : 0}
            setCases={setCases} />}
          {view === 'documentos' && <DocumentosView cases={cases} />}
          {view === 'contratos'  && <ContratosView cases={cases} />}
          {view === 'equipo'     && <EquipoView cases={cases} />}
          {view === 'detail' && detailCase && (
            <CaseDetailView caso={detailCase} section={section}
              sectionIdx={sectionIdx >= 0 ? sectionIdx : 0} projectId={project.id}
              spreadsheetId={project.spreadsheetId} sheetTab={project.sheetTab}
              onBack={() => navTo(prevView)}
              onUpdated={updated => { setCases(prev => prev.map(c => c._id === updated._id ? updated : c)); setDetailCase(updated); }} />
          )}
        </div>
      </div>

      {showNew && (
        <NewCaseModal section={section} sectionIdx={sectionIdx >= 0 ? sectionIdx : 0}
          projectId={project.id} onClose={() => setShowNew(false)}
          onAdded={c => { setCases(prev => [...prev, c]); setShowNew(false); navTo('casos'); }} />
      )}
    </div>
  );
}

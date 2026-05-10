'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import type { StoredProject, ProjectSection, Row, Column } from '@/lib/types';
import { cn, initials, avatarColor, fmtDate, daysUntil, truncate } from '@/lib/utils';
import {
  KVTableView, FinancialReportView, TimeSeriesView, BudgetView, scenarioVerdictStyle,
} from '@/components/StructuredViews';

// ─── LexDesk exact colours (from intra-app.html CSS vars) ──────────────────
const C = {
  indigo50:'#EEF2FF', indigo600:'#4F46E5', indigo800:'#3730A3', indigo900:'#1E1B4B',
  emerald50:'#D1FAE5', emerald600:'#059669', emerald800:'#065F46',
  amber50:'#FEF3C7', amber600:'#B45309', amber800:'#78350F',
  rose50:'#FFE4E6', rose600:'#E11D48', rose800:'#9F1239',
  sky50:'#E0F2FE', sky800:'#075985',
  violet50:'#EDE9FE', violet800:'#5B21B6',
  slate50:'#F1F5F9', slate800:'#1E293B',
  bg:'#ffffff', bg2:'#f5f7fa', bg3:'#eef1f5',
  text:'#0f172a', text2:'#475569', text3:'#94a3b8',
  border:'rgba(15,23,42,0.10)', borderMd:'rgba(15,23,42,0.18)',
} as const;

const CHART_COLORS = [C.indigo600,'#7C3AED',C.emerald600,C.amber600,C.rose600,'#0EA5E9','#8B5CF6'];

// ─── i18n ────────────────────────────────────────────────────────────────────
function T(l: string) {
  const base = {
    dashboard:'Overview', records:'Records', plazos:'Deadlines', equipo:'Team',
    add:'Add row', save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit row',
    back:'Projects', download:'Download Excel', downloading:'Downloading…',
    search:'Search all fields…', all:'All', total:'Total',
    noRows:'No rows yet — click «Add row» above to add the first one.',
    noResults:'No results match your filter.', confirmDel:'Delete this record?',
    essential:'Key fields', extra:'More fields', notes:'Long text fields',
    addAnother:'Add another row after saving', auto:'Auto', sel:'Select…',
    overdue:'Overdue', today:'Today', thisWeek:'This week',
    next30:'Next 30 days', later:'Later', noDeadlines:'No deadlines found.',
    teamLoad:'Team workload', noTeam:'No assignee column detected.',
    dIn:(n:number)=>`In ${n}d`, dAgo:(n:number)=>`${n}d overdue`,
    notFound:'Project not found', loading:'Loading project…',
    recientes:'Recent rows', upcoming:'Upcoming deadlines',
    kpiUrgent:'High priority', kpiOverdue:'Overdue', kpiWeek:'Due this week',
    byGroup:'Breakdown', areas:'Areas', main:'MAIN', manage:'MANAGE',
    steps:'Steps', reference:'Reference', observations:'Notes',
    tasksDone:(n:number)=>`${n} steps`, addRowTitle:'New row', editRowTitle:'Edit row',
  } as const;
  if (l === 'es') return {
    dashboard:'Panel', records:'Registros', plazos:'Plazos', equipo:'Equipo',
    add:'Agregar fila', save:'Guardar', cancel:'Cancelar', delete:'Eliminar', edit:'Editar fila',
    back:'Proyectos', download:'Descargar Excel', downloading:'Descargando…',
    search:'Buscar en todos los campos…', all:'Todos', total:'Total',
    noRows:'Aún no hay filas — haz clic en «Agregar fila» para empezar.',
    noResults:'Sin resultados para ese filtro.', confirmDel:'¿Eliminar este registro?',
    essential:'Campos principales', extra:'Más campos', notes:'Campos de texto largo',
    addAnother:'Agregar otra fila al guardar', auto:'Auto', sel:'Seleccionar…',
    overdue:'Vencidos', today:'Hoy', thisWeek:'Esta semana',
    next30:'Próximos 30 días', later:'Más adelante', noDeadlines:'Sin plazos registrados.',
    teamLoad:'Carga del equipo', noTeam:'Sin columna de responsable.',
    dIn:(n:number)=>`En ${n}d`, dAgo:(n:number)=>`Venció hace ${n}d`,
    notFound:'Proyecto no encontrado', loading:'Cargando proyecto…',
    recientes:'Actividad reciente', upcoming:'Próximos plazos',
    kpiUrgent:'Alta prioridad', kpiOverdue:'Vencidos', kpiWeek:'Esta semana',
    byGroup:'Distribución', areas:'Áreas', main:'PRINCIPAL', manage:'GESTIÓN',
    steps:'Pasos', reference:'Referencia técnica', observations:'Observaciones',
    tasksDone:(n:number)=>`${n} pasos`, addRowTitle:'Nueva fila', editRowTitle:'Editar fila',
  } as const;
  if (l === 'pt') return {
    ...base,
    dashboard:'Painel', records:'Registros', plazos:'Prazos', equipo:'Equipe',
    add:'Adicionar linha', save:'Salvar', cancel:'Cancelar', delete:'Excluir', edit:'Editar linha',
    back:'Projetos', download:'Baixar Excel', downloading:'Baixando…',
    search:'Buscar em todos os campos…', all:'Todos',
    noRows:'Sem linhas — clique em «Adicionar linha» para começar.',
    noResults:'Sem resultados.', confirmDel:'Excluir este registro?',
    essential:'Campos principais', extra:'Mais campos',
    overdue:'Vencidos', today:'Hoje', thisWeek:'Esta semana',
    next30:'Próximos 30 dias', later:'Mais tarde',
    main:'PRINCIPAL', manage:'GERENCIAR',
    dIn:(n:number)=>`Em ${n}d`, dAgo:(n:number)=>`Venceu há ${n}d`,
    addRowTitle:'Nova linha', editRowTitle:'Editar linha',
  } as const;
  return base;
}
type Tx = ReturnType<typeof T>;

// ─── Types ────────────────────────────────────────────────────────────────────
interface SectionWithRecords extends ProjectSection { records: Row[] }
interface FullProject extends StoredProject { sections: SectionWithRecords[] }
type ViewId = 'dashboard' | 'records' | 'detail' | 'plazos' | 'equipo';

// ─── Column utilities ─────────────────────────────────────────────────────────
const TABLE_SKIP = new Set(['longtext','url','formula']);
const ROLE_ORDER = ['identifier','client','description','status','priority','assignee','deadline','area','action','pm','created'];

/** Columns to show in the summary table (no longtext/url, max 7, sorted by importance) */
function summaryCols(cols: Column[]): Column[] {
  const ok = cols.filter(c => !TABLE_SKIP.has(c.type));
  if (ok.length <= 7) return ok;
  return [...ok].sort((a, b) => {
    const ai = a.semanticRole ? ROLE_ORDER.indexOf(a.semanticRole) : 99;
    const bi = b.semanticRole ? ROLE_ORDER.indexOf(b.semanticRole) : 99;
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  }).slice(0, 7);
}

/** Fields that are auto-filled and hidden from the add-row form */
function autoFields(cols: Column[], rows: Row[]): Set<string> {
  const s = new Set<string>();
  for (const c of cols) {
    if (c.type === 'formula') { s.add(c.id); continue; }
    // Sequential numeric identifier (N°, #, row number)
    if (c.semanticRole === 'identifier' && (c.type === 'number' || c.type === 'text')) {
      const vals = rows.map(r => r[c.id]).filter(v => v != null && v !== '');
      if (vals.length === 0 || vals.every(v => /^\d+$/.test(String(v)))) {
        s.add(c.id);
      }
    }
    // "Current date" columns (fecha actual, today, etc.)
    if (c.type === 'date' && /fecha.actual|current.?date|data.?atual|hoy|today/i.test(c.excelHeader)) {
      s.add(c.id);
    }
  }
  return s;
}

/** Auto-fill value for a hidden field */
function autoVal(col: Column, rows: Row[]): string {
  if (col.semanticRole === 'identifier') {
    const nums = rows.map(r => Number(r[col.id])).filter(n => !isNaN(n) && n > 0);
    return String(nums.length > 0 ? Math.max(...nums) + 1 : 1);
  }
  if (col.type === 'date') return new Date().toISOString().slice(0, 10);
  return '';
}

/** Group form columns: essential (semantic roles) / extra / notes (longtext) */
function formGroups(cols: Column[], skip: Set<string>) {
  const essential: Column[] = [], extra: Column[] = [], notes: Column[] = [];
  for (const c of cols) {
    if (skip.has(c.id)) continue;
    if (c.type === 'longtext') { notes.push(c); continue; }
    if (c.type === 'url') { extra.push(c); continue; }
    if (c.semanticRole && ROLE_ORDER.indexOf(c.semanticRole) >= 0) essential.push(c);
    else extra.push(c);
  }
  // Sort essential by role priority
  essential.sort((a, b) => {
    const ai = a.semanticRole ? ROLE_ORDER.indexOf(a.semanticRole) : 99;
    const bi = b.semanticRole ? ROLE_ORDER.indexOf(b.semanticRole) : 99;
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  return { essential, extra, notes };
}

// ─── Status + priority colour helpers (match intra-app.html) ─────────────────
function statusStyle(val: string): React.CSSProperties {
  const v = (val || '').toLowerCase();
  if (/progres/.test(v)) return { background: C.sky50, color: C.sky800 };
  if (/proce/.test(v)) return { background: C.emerald50, color: C.emerald800 };
  if (/pend|wait/.test(v)) return { background: C.amber50, color: C.amber800 };
  if (/listo|done|complet|cerrad|closed/.test(v)) return { background: C.slate50, color: C.slate800 };
  if (/cancel|rechaz/.test(v)) return { background: C.rose50, color: C.rose800 };
  return { background: C.slate50, color: C.slate800 };
}
function priorityStyle(val: string): React.CSSProperties {
  const v = (val || '').toLowerCase();
  if (/urgent/.test(v)) return { background: C.rose50, color: C.rose800 };
  if (/alta|high/.test(v)) return { background: C.amber50, color: C.amber800 };
  if (/media|medium/.test(v)) return { background: C.indigo50, color: C.indigo800 };
  if (/baja|low/.test(v)) return { background: C.slate50, color: C.slate800 };
  return { background: C.slate50, color: C.slate800 };
}
function enumStyle(col: Column, val: string): React.CSSProperties {
  if (col.semanticRole === 'status') return statusStyle(val);
  if (col.semanticRole === 'priority') return priorityStyle(val);
  return { background: C.indigo50, color: C.indigo800 };
}

// ─── Small atoms ─────────────────────────────────────────────────────────────
const g = (row: Row, id?: string) => { if (!id) return ''; const x = row[id]; return x == null ? '' : String(x); };

function Av({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div className={cn('rounded-lg flex items-center justify-center font-semibold flex-shrink-0', avatarColor(name || '?'))}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.34 }}>
      {initials(name || '?')}
    </div>
  );
}

function StatusBadge({ val, col }: { val: string; col?: Column }) {
  if (!val) return null;
  const style = col ? enumStyle(col, val) : statusStyle(val);
  return (
    <span className="inline-flex items-center rounded-full font-semibold whitespace-nowrap"
      style={{ ...style, fontSize: 10, padding: '2px 8px' }}>
      {val}
    </span>
  );
}

function KpiCard({ label, value, sub, accent, onClick }: {
  label: string; value: number | string; sub?: string; accent?: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick}
      className={cn('rounded-xl p-4 flex flex-col gap-1.5', onClick && 'cursor-pointer')}
      style={{ background: C.bg, border: `0.5px solid ${C.border}` }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.transform = '')}>
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.text3 }}>{label}</div>
      <div className="text-[28px] font-semibold leading-none tracking-tight" style={{ color: accent ?? C.text }}>{value}</div>
      {sub && <div className="text-[11px]" style={{ color: C.text3 }}>{sub}</div>}
    </div>
  );
}

// ─── Smart field input ────────────────────────────────────────────────────────
function FieldInput({ col, value, onChange }: { col: Column; value: string; onChange: (v: string) => void }) {
  const inputCls = "w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all";
  const inputStyle: React.CSSProperties = { background: C.bg, border: `0.5px solid ${C.borderMd}`, color: C.text };

  // Enum → pill selector
  if (col.type === 'enum' && col.options?.length) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {col.options.map(opt => {
          const active = value === opt;
          const st = active ? enumStyle(col, opt) : { background: C.bg2, color: C.text2 };
          return (
            <button key={opt} type="button" onClick={() => onChange(active ? '' : opt)}
              className="px-3 py-1 rounded-full text-[12px] font-medium border transition-all"
              style={{ ...st, borderColor: active ? 'transparent' : C.border, boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  if (col.type === 'date') return (
    <input type="date" value={value} onChange={e => onChange(e.target.value)}
      className={inputCls} style={inputStyle} />
  );
  if (col.type === 'longtext') return (
    <textarea rows={4} value={value} onChange={e => onChange(e.target.value)}
      className={cn(inputCls, 'resize-none leading-relaxed')} style={inputStyle}
      placeholder="…" />
  );
  if (col.type === 'url') return (
    <input type="url" value={value} onChange={e => onChange(e.target.value)}
      placeholder="https://" className={inputCls} style={inputStyle} />
  );
  if (col.type === 'number' || col.type === 'currency') return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      className={inputCls} style={inputStyle} />
  );
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      className={inputCls} style={inputStyle} />
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────
function RowModal({
  title, columns, initial, rows, onSubmit, onClose, onDelete, tx,
}: {
  title: string; columns: Column[]; initial: Record<string,string>; rows: Row[];
  onSubmit: (v: Record<string,string>) => Promise<void>;
  onClose: () => void; onDelete?: () => void; tx: Tx;
}) {
  const skip = autoFields(columns, rows);
  const { essential, extra, notes } = formGroups(columns, skip);
  const autoColMap = new Map(columns.filter(c => skip.has(c.id)).map(c => [c.id, autoVal(c, rows)]));

  const [vals, setVals] = useState<Record<string,string>>(() => ({
    ...Object.fromEntries(autoColMap),
    ...initial,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [again, setAgain] = useState(false);

  const set = (id: string, v: string) => setVals(p => ({ ...p, [id]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await onSubmit({ ...Object.fromEntries(autoColMap), ...vals });
      if (!again) onClose();
      else setVals({ ...Object.fromEntries(autoColMap), ...Object.fromEntries(columns.map(c => [c.id, ''])) });
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }

  const Label = ({ col }: { col: Column }) => (
    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: C.text3 }}>
      {col.label}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)', border: `0.5px solid ${C.border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.border }}>
          <div>
            <h2 className="text-[16px] font-semibold" style={{ color: C.text }}>{title}</h2>
            {skip.size > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
                {tx.auto}: {[...skip].map(id => columns.find(c=>c.id===id)?.label).filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: C.text3 }}
            onMouseEnter={e=>(e.currentTarget.style.background=C.bg2)}
            onMouseLeave={e=>(e.currentTarget.style.background='')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12L12 2M12 12L2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Essential fields */}
          {essential.map(col => (
            <div key={col.id}>
              <Label col={col} />
              <FieldInput col={col} value={vals[col.id]??''} onChange={v=>set(col.id,v)} />
            </div>
          ))}

          {/* Extra fields (collapsible) */}
          {extra.length > 0 && (
            <div>
              <button type="button" onClick={()=>setShowExtra(p=>!p)}
                className="flex items-center gap-2 text-[12px] font-medium mb-2 transition-colors"
                style={{ color: C.text3 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={cn('transition-transform', showExtra && 'rotate-90')}>
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {showExtra ? tx.extra : `${tx.extra} (${extra.length})`}
              </button>
              {showExtra && (
                <div className="flex flex-col gap-4 pl-4" style={{ borderLeft: `2px solid ${C.bg2}` }}>
                  {extra.map(col => (
                    <div key={col.id}>
                      <Label col={col} />
                      <FieldInput col={col} value={vals[col.id]??''} onChange={v=>set(col.id,v)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes / longtext */}
          {notes.length > 0 && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-widest pt-2" style={{ color: C.text3 }}>{tx.notes}</div>
              {notes.map(col => (
                <div key={col.id}>
                  <Label col={col} />
                  <FieldInput col={col} value={vals[col.id]??''} onChange={v=>set(col.id,v)} />
                </div>
              ))}
            </>
          )}

          {error && <div className="text-[12px] rounded-lg px-3 py-2" style={{ color: C.rose800, background: C.rose50 }}>{error}</div>}
        </form>

        <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: `0.5px solid ${C.border}`, background: C.bg2, borderRadius: '0 0 16px 16px' }}>
          {onDelete && (
            <button type="button" onClick={onDelete} className="text-[12px] px-3 py-2 rounded-lg transition-colors" style={{ color: C.text3 }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=C.rose800;(e.currentTarget as HTMLElement).style.background=C.rose50;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=C.text3;(e.currentTarget as HTMLElement).style.background='';}}>
              {tx.delete}
            </button>
          )}
          {!onDelete && (
            <label className="flex items-center gap-2 text-[12px] cursor-pointer select-none" style={{ color: C.text3 }}>
              <button type="button" onClick={()=>setAgain(p=>!p)}
                className="w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors"
                style={{ background: again ? C.indigo600 : '', borderColor: again ? C.indigo600 : C.borderMd }}>
                {again && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>}
              </button>
              {tx.addAnother}
            </label>
          )}
          <div className="flex-1"/>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] transition-colors"
            style={{ border: `0.5px solid ${C.borderMd}`, color: C.text2 }}
            onMouseEnter={e=>(e.currentTarget.style.background=C.bg3)}
            onMouseLeave={e=>(e.currentTarget.style.background='')}>
            {tx.cancel}
          </button>
          <button onClick={submit as never} disabled={saving}
            className="px-6 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: C.indigo600, boxShadow: `0 2px 8px rgba(79,70,229,0.25)` }}>
            {saving ? '…' : tx.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Full record detail view (LexDesk case-detail style) ──────────────────────
function DetailView({
  row, section, projectId, sectionIdx, allRows, onBack, onUpdated, onDeleted, tx,
}: {
  row: Row; section: SectionWithRecords; projectId: string; sectionIdx: number; allRows: Row[];
  onBack: () => void; onUpdated: (r: Row) => void; onDeleted: (id: string) => void; tx: Tx;
}) {
  const [editing, setEditing] = useState(false);
  const cols = section.schema.columns;
  const { bindings, colorMaps } = section;

  const titleId = bindings.description ?? bindings.client ?? bindings.identifier ?? cols[0]?.id;
  const title = g(row, titleId);
  const clientVal = g(row, bindings.client);
  const statusVal = g(row, bindings.status);
  const priorityVal = g(row, bindings.priority);
  const idVal = g(row, bindings.identifier);
  const areaVal = g(row, bindings.area);
  const deadlineVal = g(row, bindings.deadline);

  const statusCol = cols.find(c => c.semanticRole === 'status');
  const priorityCol = cols.find(c => c.semanticRole === 'priority');

  // Info grid: short columns excluding title/status/priority/identifier shown above
  const topIds = new Set([titleId, bindings.status, bindings.priority, bindings.identifier].filter(Boolean) as string[]);
  const infoGridCols = cols.filter(c => !TABLE_SKIP.has(c.type) && !topIds.has(c.id));
  // Content sections: longtext columns
  const contentCols = cols.filter(c => c.type === 'longtext');
  // URL columns
  const urlCols = cols.filter(c => c.type === 'url');

  // Parse numbered steps from "procedimiento" type fields
  function parseSteps(text: string): string[] {
    return text.split('\n').map(s => s.trim()).filter(s => /^\d+\./.test(s) || s.length > 5);
  }

  async function doDelete() {
    if (!confirm(tx.confirmDel)) return;
    await fetch(`/api/projects/${projectId}/records/${row._id}?section=${sectionIdx}`, { method: 'DELETE' });
    onDeleted(row._id); onBack();
  }

  async function save(vals: Record<string,string>) {
    const res = await fetch(`/api/projects/${projectId}/records/${row._id}?section=${sectionIdx}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vals),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    onUpdated(data); setEditing(false);
  }

  const initial = Object.fromEntries(cols.map(c => [c.id, g(row, c.id)]));

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] w-fit transition-colors"
        style={{ color: C.text2, background: 'none', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e=>(e.currentTarget.style.color=C.text)}
        onMouseLeave={e=>(e.currentTarget.style.color=C.text2)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      {/* Case header card */}
      <div className="rounded-xl p-6" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
        {/* Badge row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {clientVal && clientVal !== title && (
            <span className="rounded-full text-[10px] font-semibold px-2 py-0.5" style={{ background: C.indigo50, color: C.indigo800 }}>{clientVal}</span>
          )}
          {areaVal && (
            <span className="rounded-full text-[10px] font-semibold px-2 py-0.5" style={{ background: C.violet50, color: C.violet800 }}>{areaVal}</span>
          )}
          {statusVal && <StatusBadge val={statusVal} col={statusCol} />}
          {priorityVal && <StatusBadge val={priorityVal} col={priorityCol} />}
        </div>
        {/* Title */}
        <div className="text-[18px] font-semibold leading-snug mb-1.5 whitespace-pre-wrap" style={{ color: C.text }}>{title || '—'}</div>
        {idVal && (
          <div className="text-[12px]" style={{ color: C.text3 }}>
            #{idVal}{areaVal ? ` · ${areaVal}` : ''}
          </div>
        )}

        {/* 4-col info grid */}
        {infoGridCols.length > 0 && (
          <div className="mt-4 pt-4 grid gap-4" style={{ borderTop: `0.5px solid ${C.border}`, gridTemplateColumns: `repeat(${Math.min(infoGridCols.length, 4)}, minmax(0,1fr))` }}>
            {infoGridCols.map((col, i) => {
              const val = g(row, col.id);
              return (
                <div key={col.id} className="min-w-0" style={{ paddingRight: i < Math.min(infoGridCols.length, 4) - 1 ? 14 : 0, borderRight: i < Math.min(infoGridCols.length, 4) - 1 ? `0.5px solid ${C.border}` : 'none' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.text3 }}>{col.label}</div>
                  {col.semanticRole === 'assignee' && val ? (
                    <div className="flex items-center gap-1.5">
                      <div className={cn('rounded-full flex items-center justify-center font-semibold', avatarColor(val))} style={{ width: 24, height: 24, fontSize: 9, flexShrink: 0 }}>{initials(val)}</div>
                      <span className="text-[13px] font-semibold" style={{ color: C.text }}>{val}</span>
                    </div>
                  ) : col.type === 'enum' ? (
                    <StatusBadge val={val} col={col} />
                  ) : col.type === 'date' ? (
                    <span className="text-[13px] font-medium" style={{ color: C.text }}>{fmtDate(val) || '—'}</span>
                  ) : (
                    <span className="text-[13px] font-medium" style={{ color: val ? C.text : C.text3 }}>{val || '—'}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content sections (longtext) in 2-col grid */}
      {contentCols.length > 0 && (
        <div className={cn('grid gap-4', contentCols.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {contentCols.map(col => {
            const val = g(row, col.id);
            const steps = val ? parseSteps(val) : [];
            const isSteps = steps.length > 1 && steps.some(s => /^\d+\./.test(s));
            // Determine left-border colour from priority
            const priVal = priorityVal.toLowerCase();
            const leftColor = /urgent/.test(priVal) ? C.rose600 : /alta|high/.test(priVal) ? C.amber600 : undefined;

            return (
              <div key={col.id} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
                <div className="text-[13px] font-semibold" style={{ color: C.text }}>{col.label}</div>
                {isSteps ? (
                  <div className="flex flex-col divide-y" style={{ borderColor: C.border }}>
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-2.5">
                        <div className="rounded-full flex items-center justify-center font-semibold flex-shrink-0 text-[11px] mt-0.5"
                          style={{ width: 22, height: 22, background: C.indigo50, color: C.indigo800 }}>{i+1}</div>
                        <div className="text-[13px] leading-snug" style={{ color: C.text2 }}>{s.replace(/^\d+\.\s*/,'')}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
                    style={{ background: C.bg2, color: C.text2, ...(leftColor ? { borderLeft: `3px solid ${leftColor}` } : {}) }}>
                    {val || `—`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* URL + notes in 2-col grid */}
      {(urlCols.length > 0 || g(row, bindings.notes)) && (
        <div className="grid grid-cols-2 gap-4">
          {urlCols.map(col => {
            const href = g(row, col.id);
            return (
              <div key={col.id} className="rounded-xl p-4" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
                <div className="text-[13px] font-semibold mb-2" style={{ color: C.text }}>{col.label}</div>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="text-[13px] break-all hover:underline" style={{ color: C.indigo600 }}>{href}</a>
                ) : <span style={{ color: C.text3, fontSize: 13 }}>—</span>}
              </div>
            );
          })}
          {bindings.notes && g(row, bindings.notes) && (
            <div className="rounded-xl p-4" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
              <div className="text-[13px] font-semibold mb-2" style={{ color: C.text }}>{cols.find(c=>c.id===bindings.notes)?.label ?? 'Notes'}</div>
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: C.text2 }}>{g(row, bindings.notes)}</div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={doDelete} className="px-4 py-2 rounded-lg text-[13px] transition-colors" style={{ border: `0.5px solid ${C.border}`, color: C.text3 }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=C.rose800;(e.currentTarget as HTMLElement).style.background=C.rose50;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color=C.text3;(e.currentTarget as HTMLElement).style.background='';}}>
          {tx.delete}
        </button>
        <button onClick={() => setEditing(true)}
          className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: C.indigo600, boxShadow: `0 2px 8px rgba(79,70,229,0.2)` }}>
          {tx.edit}
        </button>
      </div>

      {editing && (
        <RowModal title={tx.editRowTitle} columns={cols} initial={initial} rows={allRows}
          onSubmit={save} onClose={() => setEditing(false)} onDelete={doDelete} tx={tx} />
      )}
    </div>
  );
}

// ─── Dashboard / Overview ─────────────────────────────────────────────────────
function DashboardView({ section, onViewRow, onGoRecords, onGoPlazos, tx }: {
  section: SectionWithRecords; onViewRow: (r: Row) => void;
  onGoRecords: () => void; onGoPlazos: () => void; tx: Tx;
}) {
  const { bindings, colorMaps, records: rows } = section;
  const cols = section.schema.columns;
  const total = rows.length;
  const urgent = rows.filter(r => /urgent|alta|high/i.test(g(r, bindings.priority))).length;
  const overdue = rows.filter(r => { const d = daysUntil(g(r, bindings.deadline)); return d !== null && d < 0; }).length;
  const week = rows.filter(r => { const d = daysUntil(g(r, bindings.deadline)); return d !== null && d >= 0 && d <= 7; }).length;

  // Breakdown: prefer status, else first enum
  const bkCol = cols.find(c => c.semanticRole === 'status') ?? cols.find(c => c.type === 'enum');
  const bkMap: Record<string,number> = {};
  if (bkCol) rows.forEach(r => { const v = g(r, bkCol.id) || '—'; bkMap[v] = (bkMap[v] ?? 0) + 1; });
  const bkSorted = Object.entries(bkMap).sort((a,b) => b[1]-a[1]);
  const bkMax = Math.max(...Object.values(bkMap), 1);

  // Upcoming deadlines (next 14 days + overdue)
  const titleId = bindings.description ?? bindings.client ?? bindings.identifier ?? cols[0]?.id;
  const upcoming = bindings.deadline
    ? [...rows].map((r,i) => ({r, d: daysUntil(g(r, bindings.deadline)), i}))
        .filter(x => x.d !== null && x.d <= 14)
        .sort((a,b) => (a.d??9999)-(b.d??9999))
        .slice(0, 6)
    : [];

  // Recent rows
  const recent = [...rows].slice(-6).reverse();

  // By group (secondary enum: area, action, etc.)
  const grpCol = cols.find(c => c.semanticRole === 'area') ?? cols.find(c => c.type === 'enum' && c !== bkCol);
  const grpMap: Record<string,number> = {};
  if (grpCol) rows.forEach(r => { const v = g(r, grpCol.id) || '—'; grpMap[v] = (grpMap[v] ?? 0) + 1; });
  const grpSorted = Object.entries(grpMap).sort((a,b) => b[1]-a[1]);
  const grpMax = Math.max(...Object.values(grpMap), 1);

  const statusCol = cols.find(c => c.semanticRole === 'status');

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label={`${tx.total} ${cols[0]?.label ?? 'rows'}`} value={total} onClick={onGoRecords} sub={section.sheetName} />
        {overdue > 0 && <KpiCard label={tx.overdue} value={overdue} accent={C.rose600} onClick={onGoPlazos} sub="Acción inmediata" />}
        {urgent > 0 && <KpiCard label={tx.kpiUrgent} value={urgent} accent={C.amber600} onClick={onGoRecords} sub={`De ${total} total`} />}
        {week > 0 && <KpiCard label={tx.kpiWeek} value={week} onClick={onGoPlazos} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Status breakdown */}
        {bkSorted.length > 0 && bkCol && (
          <div className="rounded-xl p-5" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
            <div className="text-[13px] font-semibold mb-4" style={{ color: C.text }}>{bkCol.label}</div>
            {bkSorted.slice(0, 8).map(([label, count]) => {
              const st = enumStyle(bkCol, label);
              return (
                <div key={label} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                  <div className="text-[12px] w-28 flex-shrink-0 truncate" style={{ color: C.text2 }}>{label}</div>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: C.bg3 }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(count/bkMax)*100}%`, background: st.color as string }} />
                  </div>
                  <div className="text-[12px] font-medium w-5 text-right" style={{ color: C.text2 }}>{count}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming deadlines */}
        {upcoming.length > 0 ? (
          <div className="rounded-xl p-5" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold" style={{ color: C.text }}>{tx.upcoming}</span>
              <button onClick={onGoPlazos} className="text-[12px] hover:underline" style={{ color: C.indigo600, background: 'none', border: 'none', cursor: 'pointer' }}>Ver todos →</button>
            </div>
            {upcoming.map(({ r, d }, i) => {
              const isOD = d !== null && d < 0, isSoon = d !== null && d >= 0 && d <= 3;
              const dotC = isOD ? C.rose600 : isSoon ? C.amber600 : C.indigo600;
              const dLabel = d === null ? '' : d === 0 ? tx.today : isOD ? tx.dAgo(Math.abs(d)) : tx.dIn(d);
              const sVal = g(r, bindings.status);
              return (
                <div key={i} onClick={() => onViewRow(r)}
                  className="flex items-start gap-2.5 py-2.5 cursor-pointer"
                  style={{ borderBottom: i < upcoming.length-1 ? `0.5px solid ${C.border}` : 'none' }}
                  onMouseEnter={e=>(e.currentTarget.style.background=C.bg2)}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotC }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: C.text }}>{truncate(g(r, titleId), 50)}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>{fmtDate(g(r, bindings.deadline))} · {g(r, bindings.client)}</div>
                  </div>
                  {sVal && <StatusBadge val={sVal} col={statusCol} />}
                  <div className="text-[11px] font-semibold ml-1 flex-shrink-0" style={{ color: isOD ? C.rose600 : isSoon ? C.amber600 : C.text3 }}>{dLabel}</div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Recent rows (fallback when no deadline col) */
          <div className="rounded-xl p-5" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
            <div className="text-[13px] font-semibold mb-3" style={{ color: C.text }}>{tx.recientes}</div>
            {recent.map((r, i) => {
              const t = g(r, titleId), sub = g(r, bindings.client);
              const sVal = g(r, bindings.status);
              return (
                <div key={i} onClick={() => onViewRow(r)} className="flex items-center gap-2.5 py-2 cursor-pointer"
                  style={{ borderBottom: i < recent.length-1 ? `0.5px solid ${C.border}` : 'none' }}
                  onMouseEnter={e=>(e.currentTarget.style.background=C.bg2)}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <Av name={g(r, bindings.client) || g(r, cols[0]?.id)} size={26} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: C.text }}>{truncate(t, 40)}</div>
                    {sub && sub !== t && <div className="text-[11px]" style={{ color: C.text3 }}>{truncate(sub, 30)}</div>}
                  </div>
                  {sVal && <StatusBadge val={sVal} col={statusCol} />}
                </div>
              );
            })}
            {recent.length === 0 && <p className="text-[13px] py-4" style={{ color: C.text3 }}>{tx.noRows}</p>}
          </div>
        )}
      </div>

      {/* Secondary group (area/action distribution) */}
      {grpSorted.length > 0 && grpCol && (
        <div className="rounded-xl p-5" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
          <div className="text-[13px] font-semibold mb-4" style={{ color: C.text }}>{grpCol.label} — {tx.byGroup}</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {grpSorted.slice(0, 10).map(([label, count], i) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="text-[12px] w-36 flex-shrink-0 truncate" style={{ color: C.text2 }}>{label}</div>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: C.bg3 }}>
                  <div className="h-full rounded-full" style={{ width: `${(count/grpMax)*100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
                <div className="text-[12px] font-medium w-5 text-right" style={{ color: C.text2 }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Records table ─────────────────────────────────────────────────────────────
function RecordsView({ section, projectId, sectionIdx, search, rows, setRows, onViewRow, tx }: {
  section: SectionWithRecords; projectId: string; sectionIdx: number; search: string;
  rows: Row[]; setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  onViewRow: (r: Row) => void; tx: Tx;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string,string>>({});
  const allCols = section.schema.columns;
  const visCols = summaryCols(allCols);
  const enumCols = allCols.filter(c => c.type === 'enum');
  const { bindings, colorMaps } = section;
  const blank = Object.fromEntries(allCols.map(c => [c.id, '']));
  const newRef = useRef<string|null>(null);
  const statusCol = allCols.find(c => c.semanticRole === 'status');

  const displayed = rows.filter(r => {
    for (const [id, v] of Object.entries(filters)) if (v && g(r, id) !== v) return false;
    if (search) { const q = search.toLowerCase(); return Object.values(r).some(x => x != null && String(x).toLowerCase().includes(q)); }
    return true;
  });

  function cellNode(col: Column, raw: unknown): React.ReactNode {
    if (raw == null || raw === '') return <span style={{ color: C.text3, fontSize: 12 }}>—</span>;
    const s = String(raw);
    if (col.type === 'enum') return <StatusBadge val={s} col={col} />;
    if (col.type === 'date') return <span style={{ fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>{fmtDate(s)}</span>;
    return <span style={{ fontSize: 13, color: C.text }}>{truncate(s, 40)}</span>;
  }

  // Client column: show with avatar
  const clientId = bindings.client;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {enumCols.slice(0, 5).map(col => (
          <div key={col.id} className="relative">
            <select value={filters[col.id] ?? ''} onChange={e => setFilters(p => ({ ...p, [col.id]: e.target.value }))}
              className="text-[12px] pl-3 pr-7 py-1.5 rounded-lg appearance-none outline-none cursor-pointer transition-colors"
              style={{ border: `0.5px solid ${C.border}`, background: filters[col.id] ? C.indigo50 : C.bg, color: filters[col.id] ? C.indigo800 : C.text2, fontWeight: filters[col.id] ? 600 : 400 }}>
              <option value="">{col.label}: {tx.all}</option>
              {col.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: C.text3 }}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        ))}
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({})} className="text-[12px] hover:underline" style={{ color: C.indigo600, background:'none', border:'none', cursor:'pointer' }}>
            {tx.all} ×
          </button>
        )}
        <div className="flex-1"/>
        <span className="text-[12px] mr-1" style={{ color: C.text3 }}>{displayed.length} / {rows.length}</span>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: C.indigo600, boxShadow: `0 2px 8px rgba(79,70,229,0.25)` }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          {tx.add}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
        {rows.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center px-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: C.indigo50 }}>
              <svg className="w-7 h-7" style={{ color: C.indigo600 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold mb-1" style={{ color: C.text }}>No rows yet</p>
              <p className="text-[13px] max-w-xs" style={{ color: C.text3 }}>{tx.noRows}</p>
            </div>
            <button onClick={() => setAddOpen(true)} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: C.indigo600 }}>{tx.add}</button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-14 text-center text-[13px]" style={{ color: C.text3 }}>{tx.noResults}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ borderBottom: `0.5px solid ${C.border}`, background: C.bg2 }}>
                <tr>
                  {visCols.map(col => (
                    <th key={col.id} className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                  <th style={{ width: 32 }}/>
                </tr>
              </thead>
              <tbody>
                {displayed.map((row, i) => (
                  <tr key={row._id ?? i} onClick={() => onViewRow(row)}
                    style={{ borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#fafaff')}
                    onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    {visCols.map(col => (
                      <td key={col.id} className="px-4 py-3 align-middle" style={{ maxWidth: 200 }}>
                        {col.id === clientId && g(row, clientId) ? (
                          <div className="flex items-center gap-2">
                            <Av name={g(row, clientId)} size={22} />
                            <span style={{ fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncate(g(row, clientId), 28)}</span>
                          </div>
                        ) : cellNode(col, row[col.id])}
                      </td>
                    ))}
                    <td className="px-2" style={{ color: C.text3, fontSize: 13 }}>›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addOpen && (
        <RowModal title={tx.addRowTitle} columns={allCols} initial={blank} rows={rows}
          onSubmit={async vals => {
            const res = await fetch(`/api/projects/${projectId}/records?section=${sectionIdx}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vals),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            newRef.current = data._id; setRows(p => [...p, data]);
          }}
          onClose={() => setAddOpen(false)} tx={tx} />
      )}
    </div>
  );
}

// ─── Deadlines view (grouped by bucket) ──────────────────────────────────────
function PlazosView({ section, onViewRow, tx }: { section: SectionWithRecords; onViewRow: (r: Row) => void; tx: Tx }) {
  const { bindings, records: rows } = section;
  const cols = section.schema.columns;
  const titleId = bindings.description ?? bindings.client ?? bindings.identifier ?? cols[0]?.id;
  const statusCol = cols.find(c => c.semanticRole === 'status');

  if (!bindings.deadline) return (
    <div className="rounded-xl p-8 text-center" style={{ background: C.bg, border: `0.5px solid ${C.border}`, color: C.text3 }}>
      {tx.noDeadlines}
    </div>
  );

  const buckets: Record<string, { rows: Row[]; color: string }> = {
    [tx.overdue]:   { rows: [], color: C.rose600 },
    [tx.today]:     { rows: [], color: C.rose600 },
    [tx.thisWeek]:  { rows: [], color: C.amber600 },
    [tx.next30]:    { rows: [], color: C.indigo600 },
    [tx.later]:     { rows: [], color: C.text3 },
  };

  rows.filter(r => g(r, bindings.deadline)).forEach(r => {
    const d = daysUntil(g(r, bindings.deadline));
    if (d === null) return;
    if (d < 0)       buckets[tx.overdue].rows.push(r);
    else if (d === 0) buckets[tx.today].rows.push(r);
    else if (d <= 7)  buckets[tx.thisWeek].rows.push(r);
    else if (d <= 30) buckets[tx.next30].rows.push(r);
    else              buckets[tx.later].rows.push(r);
  });

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(buckets).filter(([, b]) => b.rows.length > 0).map(([name, bucket]) => (
        <div key={name}>
          <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.text3 }}>
            {name} ({bucket.rows.length})
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
            {bucket.rows.map((r, i) => {
              const d = daysUntil(g(r, bindings.deadline));
              const dLabel = d === null ? '' : d === 0 ? tx.today : d < 0 ? tx.dAgo(Math.abs(d)) : tx.dIn(d);
              const sVal = g(r, bindings.status);
              return (
                <div key={i} onClick={() => onViewRow(r)}
                  className="flex items-start gap-2.5 px-4 py-3 cursor-pointer"
                  style={{ borderBottom: i < bucket.rows.length-1 ? `0.5px solid ${C.border}` : 'none' }}
                  onMouseEnter={e=>(e.currentTarget.style.background=C.bg2)}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: bucket.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: C.text }}>{truncate(g(r, titleId), 80)}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
                      {fmtDate(g(r, bindings.deadline))} · {g(r, bindings.client)} · {g(r, bindings.assignee)}
                    </div>
                  </div>
                  {sVal && <StatusBadge val={sVal} col={statusCol} />}
                  <div className="text-[11px] font-semibold flex-shrink-0 w-20 text-right" style={{ color: bucket.color }}>{dLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {Object.values(buckets).every(b => b.rows.length === 0) && (
        <div className="rounded-xl p-8 text-center" style={{ background: C.bg, border: `0.5px solid ${C.border}`, color: C.text3 }}>{tx.noDeadlines}</div>
      )}
    </div>
  );
}

// ─── Team view ────────────────────────────────────────────────────────────────
function EquipoView({ section, tx }: { section: SectionWithRecords; tx: Tx }) {
  const { bindings, records: rows } = section;
  const cols = section.schema.columns;
  if (!bindings.assignee) return (
    <div className="rounded-xl p-8 text-center" style={{ background: C.bg, border: `0.5px solid ${C.border}`, color: C.text3 }}>{tx.noTeam}</div>
  );
  const byPerson: Record<string, { rows: Row[]; urgent: number; areas: Record<string,number> }> = {};
  rows.forEach(r => {
    const p = g(r, bindings.assignee) || '—';
    if (!byPerson[p]) byPerson[p] = { rows: [], urgent: 0, areas: {} };
    byPerson[p].rows.push(r);
    if (/urgent|alta|high/i.test(g(r, bindings.priority))) byPerson[p].urgent++;
    const a = g(r, bindings.area);
    if (a) byPerson[p].areas[a] = (byPerson[p].areas[a] ?? 0) + 1;
  });
  const sorted = Object.entries(byPerson).sort((a,b) => b[1].rows.length - a[1].rows.length);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
      <table className="w-full">
        <thead style={{ borderBottom: `0.5px solid ${C.border}`, background: C.bg2 }}>
          <tr>
            {['Member', 'Assigned', 'Urgent', 'Distribution'].map(h => (
              <th key={h} className="px-4 py-3 text-left" style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(([name, s], i) => (
            <tr key={name} style={{ borderBottom: `0.5px solid ${C.border}` }}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Av name={name} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{name}</span>
                </div>
              </td>
              <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.rows.length}</td>
              <td className="px-4 py-3">
                {s.urgent > 0
                  ? <span className="rounded-full text-[10px] font-semibold px-2 py-0.5" style={{ background: C.rose50, color: C.rose800 }}>{s.urgent}</span>
                  : <span style={{ color: C.text3 }}>—</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(s.areas).map(([a, n]) => (
                    <span key={a} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: C.bg2, color: C.text2 }}>{a} {n}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function SectionShell({ section, projectId, sectionIdx, search, tx }: {
  section: SectionWithRecords; projectId: string; sectionIdx: number; search: string; tx: Tx;
}) {
  const structure = section.schema.structure ?? 'records';

  // Non-record structures: route directly to their specialised views (no nav bar)
  if (structure === 'kv_table') {
    const [editRow, setEditRow] = useState<Row | null>(null);
    const [rows, setRows] = useState<Row[]>(section.records);
    return (
      <div className="overflow-y-auto h-full">
        <KVTableView section={{ ...section, records: rows }} onEditRow={setEditRow} />
        {editRow && (
          <RowModal title="Edit parameter" columns={section.schema.columns}
            initial={Object.fromEntries(section.schema.columns.map(c => [c.id, String(editRow[c.id] ?? '')]))}
            rows={rows}
            onSubmit={async vals => {
              const res = await fetch(`/api/projects/${projectId}/records/${editRow._id}?section=${sectionIdx}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vals),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setRows(p => p.map(r => r._id === data._id ? data : r));
            }}
            onClose={() => setEditRow(null)} tx={tx} />
        )}
      </div>
    );
  }

  if (structure === 'financial_report') {
    return (
      <div className="overflow-y-auto h-full">
        <div className="mb-3 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full"
            style={{ background: '#EEF2FF', color: '#4F46E5' }}>Read-only report</span>
        </div>
        <FinancialReportView section={section} />
      </div>
    );
  }

  if (structure === 'timeseries') {
    return (
      <div className="overflow-y-auto h-full">
        <div className="mb-3 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full"
            style={{ background: '#EEF2FF', color: '#4F46E5' }}>Forecast model</span>
        </div>
        <TimeSeriesView section={section} />
      </div>
    );
  }

  if (structure === 'budget') {
    const [rows, setRows] = useState<Row[]>(section.records);
    const [addOpen, setAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<Row | null>(null);
    return (
      <div className="overflow-y-auto h-full">
        <BudgetView section={{ ...section, records: rows }}
          onEditRow={setEditRow} onAddRow={() => setAddOpen(true)} />
        {addOpen && (
          <RowModal title="Add budget item" columns={section.schema.columns}
            initial={Object.fromEntries(section.schema.columns.map(c => [c.id, '']))}
            rows={rows}
            onSubmit={async vals => {
              const res = await fetch(`/api/projects/${projectId}/records?section=${sectionIdx}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vals),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setRows(p => [...p, data]);
            }}
            onClose={() => setAddOpen(false)} tx={tx} />
        )}
        {editRow && (
          <RowModal title="Edit item" columns={section.schema.columns}
            initial={Object.fromEntries(section.schema.columns.map(c => [c.id, String(editRow[c.id] ?? '')]))}
            rows={rows}
            onSubmit={async vals => {
              const res = await fetch(`/api/projects/${projectId}/records/${editRow._id}?section=${sectionIdx}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vals),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setRows(p => p.map(r => r._id === data._id ? data : r));
            }}
            onDelete={async () => {
              if (!confirm(tx.confirmDel)) return;
              await fetch(`/api/projects/${projectId}/records/${editRow._id}?section=${sectionIdx}`, { method: 'DELETE' });
              setRows(p => p.filter(r => r._id !== editRow._id));
              setEditRow(null);
            }}
            onClose={() => setEditRow(null)} tx={tx} />
        )}
      </div>
    );
  }

  // ── Records (standard table + dashboard) ───────────────────────────────────
  const [view, setView] = useState<ViewId>('dashboard');
  const [prevView, setPrevView] = useState<ViewId>('dashboard');
  const [rows, setRows] = useState<Row[]>(section.records);
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const hasDeadline = !!section.bindings.deadline;
  const hasAssignee = !!section.bindings.assignee;

  function navTo(v: ViewId) { if (v !== 'detail') setPrevView(v); setView(v); }
  function viewRow(r: Row) { setDetailRow(r); navTo('detail'); }

  const NAV: { id: ViewId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: tx.dashboard, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/></svg> },
    { id: 'records', label: tx.records, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    ...(hasDeadline ? [{ id: 'plazos' as ViewId, label: tx.plazos, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }] : []),
    ...(hasAssignee ? [{ id: 'equipo' as ViewId, label: tx.equipo, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 12c0-2 1.8-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10.5 9c1.5 0 2.5.8 2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }] : []),
  ];
  const activeNavId = view === 'detail' ? prevView : view;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-40 flex-shrink-0 flex flex-col gap-0.5 pt-2 pr-4">
        {NAV.map(n => (
          <button key={n.id} onClick={() => navTo(n.id)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-all"
            style={n.id === activeNavId ? { background: C.indigo50, color: C.indigo800, fontWeight: 600 } : { color: C.text2 }}
            onMouseEnter={e => { if (n.id !== activeNavId) (e.currentTarget as HTMLElement).style.background = C.bg2; }}
            onMouseLeave={e => { if (n.id !== activeNavId) (e.currentTarget as HTMLElement).style.background = ''; }}>
            <span className="flex-shrink-0 opacity-70">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {view === 'dashboard' && (
          <DashboardView section={{ ...section, records: rows }} onViewRow={viewRow}
            onGoRecords={() => navTo('records')} onGoPlazos={() => navTo('plazos')} tx={tx} />
        )}
        {view === 'records' && (
          <RecordsView section={section} projectId={projectId} sectionIdx={sectionIdx}
            search={search} rows={rows} setRows={setRows} onViewRow={viewRow} tx={tx} />
        )}
        {view === 'plazos' && (
          <PlazosView section={{ ...section, records: rows }} onViewRow={viewRow} tx={tx} />
        )}
        {view === 'equipo' && (
          <EquipoView section={{ ...section, records: rows }} tx={tx} />
        )}
        {view === 'detail' && detailRow && (
          <DetailView row={detailRow} section={section} projectId={projectId} sectionIdx={sectionIdx}
            allRows={rows} onBack={() => navTo(prevView)}
            onUpdated={u => { setRows(p => p.map(r => r._id === u._id ? u : r)); setDetailRow(u); }}
            onDeleted={id => { setRows(p => p.filter(r => r._id !== id)); setDetailRow(null); navTo(prevView); }}
            tx={tx} />
        )}
      </div>
    </div>
  );
}

// ─── Main ProjectApp ──────────────────────────────────────────────────────────
export function ProjectApp({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setProject(d); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [projectId]);

  async function dl() {
    if (!project) return; setDownloading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/download`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = (project.originalFilename.replace(/\.[^.]+$/, '') ?? 'export') + '_updated.xlsx';
      a.click(); URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: C.bg3 }}>
      <div className="flex flex-col items-center gap-3" style={{ color: C.text3 }}>
        <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span className="text-[13px]">{T('en').loading}</span>
      </div>
    </div>
  );

  if (error || !project) return (
    <div className="h-screen flex items-center justify-center" style={{ background: C.bg3 }}>
      <div className="text-center">
        <p style={{ color: C.rose800, fontSize: 14 }} className="mb-3">{error ?? T('en').notFound}</p>
        <Link href="/" style={{ color: C.indigo600, fontSize: 13 }} className="hover:underline">← Back</Link>
      </div>
    </div>
  );

  const section = project.sections[active];
  const tx = T(section.schema.language);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg3 }}>
      {/* ── Sidebar ── */}
      <aside className="w-[220px] min-w-[220px] flex flex-col" style={{ background: C.bg, borderRight: `0.5px solid ${C.border}` }}>
        <div className="px-4 py-[18px]" style={{ borderBottom: `0.5px solid ${C.border}` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `linear-gradient(135deg,${C.indigo600},#7C3AED)`, boxShadow: `0 1px 3px rgba(79,70,229,0.3)` }}>
            <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4"><path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{project.name}</div>
          <div className="text-[11px] truncate mt-0.5" style={{ color: C.text3 }}>{project.originalFilename}</div>
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          {/* Always show sheets list — even if only one */}
          <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text3 }}>
            {project.sections.length === 1 ? 'Sheet' : `Sheets (${project.sections.length})`}
          </div>
          {project.sections.map((sec, i) => (
            <button key={i} onClick={() => { setActive(i); setSearch(''); }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-all"
              style={i === active ? { background: C.indigo50, color: C.indigo800, fontWeight: 600 } : { color: C.text2 }}
              onMouseEnter={e => { if (i !== active) (e.currentTarget as HTMLElement).style.background = C.bg2; }}
              onMouseLeave={e => { if (i !== active) (e.currentTarget as HTMLElement).style.background = ''; }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0 opacity-50">
                <rect x=".5" y=".5" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M.5 4.5h12M.5 8.5h12M4.5 4.5v8" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
              <span className="flex-1 truncate">{sec.sheetName}</span>
              <span className="text-[10px] opacity-40 tabular-nums">{sec.records.length}</span>
            </button>
          ))}

          <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.text3 }}>{tx.manage}</div>
          <button onClick={dl} disabled={downloading}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-all disabled:opacity-50"
            style={{ color: C.text2 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; (e.currentTarget as HTMLElement).style.color = C.emerald800; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = C.text2; }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="opacity-60"><path d="M6.5 1v7M3.5 5.5L6.5 8.5l3-3M2 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {downloading ? tx.downloading : tx.download}
          </button>
        </nav>

        <div className="px-2 py-3" style={{ borderTop: `0.5px solid ${C.border}` }}>
          <Link href="/" className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] transition-all"
            style={{ color: C.text3, textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.bg2; (e.currentTarget as HTMLElement).style.color = C.text2; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = C.text3; }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 1.5L3 5.5l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            {tx.back}
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 flex items-center px-5 gap-3 flex-shrink-0" style={{ background: C.bg, borderBottom: `0.5px solid ${C.border}` }}>
          <h1 className="text-[15px] font-semibold flex-shrink-0" style={{ color: C.text }}>{section.sheetName}</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: C.text3, background: C.bg2 }}>
            {section.records.length} rows
          </span>
          <div className="flex-1"/>
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 w-52" style={{ background: C.bg2, border: `0.5px solid ${C.border}` }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="4" stroke={C.text3} strokeWidth="1.2"/><path d="M8.5 8.5l2 2" stroke={C.text3} strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tx.search}
              className="bg-transparent text-[13px] outline-none w-full" style={{ color: C.text }}
              placeholder-style={{ color: C.text3 }}/>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-5">
          <SectionShell key={active} section={section} projectId={projectId}
            sectionIdx={active} search={search} tx={tx} />
        </div>
      </div>
    </div>
  );
}

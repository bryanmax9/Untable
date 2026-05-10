'use client';
import React, { useState } from 'react';
import type { Row, Column, ProjectSection } from '@/lib/types';
import { cn, truncate } from '@/lib/utils';

// SectionWithRecords mirrors what ProjectApp uses internally
export interface SectionWithRecords extends ProjectSection { records: Row[] }

// ─── Colour palette (LexDesk) ─────────────────────────────────────────────────
const C = {
  bg:'#fff', bg2:'#f5f7fa', bg3:'#eef1f5',
  text:'#0f172a', text2:'#475569', text3:'#94a3b8',
  border:'rgba(15,23,42,0.10)', borderMd:'rgba(15,23,42,0.18)',
  green:'#065F46', greenBg:'#D1FAE5',
  red:'#9F1239', redBg:'#FFE4E6',
  amber:'#78350F', amberBg:'#FEF3C7',
  indigo:'#4F46E5', indigoBg:'#EEF2FF',
  violet:'#5B21B6', violetBg:'#EDE9FE',
};

const CHART_COLORS = ['#4F46E5','#7C3AED','#059669','#B45309','#E11D48','#0EA5E9','#8B5CF6','#F59E0B'];

// ─── Number formatting ────────────────────────────────────────────────────────
function fmt(raw: unknown, header: string = ''): string {
  if (raw == null || raw === '') return '—';
  const s = String(raw).trim();
  if (s === '—' || s === '') return '—';

  const n = Number(s);
  if (isNaN(n)) return s;

  const h = header.toLowerCase();

  // Percentage: header has % or the value is between -1 and 1 with many decimals
  if (/%|percent|rate|margin|penetration|churn/i.test(h) || (Math.abs(n) < 1 && s.includes('.'))) {
    const pct = Math.abs(n) <= 1 ? n * 100 : n;
    return `${pct >= 0 ? '' : ''}${pct.toFixed(1)}%`;
  }

  // Ratio
  if (/ratio|ltv.*cac/i.test(h)) return `${n.toFixed(1)}×`;

  // Currency / large number
  if (/\$|amount|revenue|income|expense|cost|price|budget|grant|profit|loss|cogs|mrr|arr|arpu|ltv|cac|payback/i.test(h) || Math.abs(n) >= 100) {
    const abs = Math.abs(n);
    const formatted = abs >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : abs >= 1000
      ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : `$${n.toFixed(2)}`;
    return formatted;
  }

  // Years / months
  if (/year|month|lifetime|period/i.test(h)) return n.toFixed(1);

  return n.toLocaleString('en-US', { maximumFractionDigits: 2, maximumSignificantDigits: 4 });
}

function numColor(raw: unknown): string | undefined {
  const n = Number(String(raw ?? '').replace(/[,$%]/g, ''));
  if (isNaN(n)) return undefined;
  if (n < 0) return C.red;
  if (n > 0) return C.green;
  return undefined;
}

function isSectionHeader(row: Row, cols: Column[]): boolean {
  // A row where the first value is ALL-CAPS text and all other values are empty
  if (!cols.length) return false;
  const firstVal = String(row[cols[0].id] ?? '').trim();
  const rest = cols.slice(1).map(c => row[c.id]);
  const otherEmpty = rest.every(v => v == null || v === '');
  return (
    otherEmpty &&
    firstVal.length > 3 &&
    firstVal === firstVal.toUpperCase() &&
    /[A-Z]{2}/.test(firstVal) &&
    !/^\d/.test(firstVal)
  );
}

function isTotalRow(row: Row, cols: Column[]): boolean {
  const firstVal = String(row[cols[0]?.id] ?? '').toUpperCase();
  return /^(total|gross|net|operating|full year|SUBTOTAL)/i.test(firstVal);
}

// ─── KV Table View (Assumptions, Unit Economics) ──────────────────────────────
export function KVTableView({ section, onEditRow }: {
  section: SectionWithRecords;
  onEditRow: (row: Row) => void;
}) {
  const cols = section.schema.columns;
  const rows = section.records;
  const paramCol = cols[0];
  const valueCol = cols[1];
  const notesCol = cols[2];

  // Group rows by section headers
  const groups: { header: string | null; rows: Row[] }[] = [];
  let current: { header: string | null; rows: Row[] } = { header: null, rows: [] };

  for (const row of rows) {
    if (isSectionHeader(row, cols)) {
      if (current.rows.length > 0 || current.header) groups.push(current);
      current = { header: String(row[paramCol?.id] ?? ''), rows: [] };
    } else if (row[paramCol?.id] != null && row[paramCol?.id] !== '') {
      current.rows.push(row);
    }
  }
  if (current.rows.length > 0 || current.header) groups.push(current);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((grp, gi) => (
        <div key={gi} className="rounded-xl overflow-hidden" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
          {grp.header && (
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: C.indigoBg, borderBottom: `0.5px solid ${C.border}` }}>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.indigo }}>{grp.header}</span>
            </div>
          )}
          <table className="w-full">
            <tbody>
              {grp.rows.map((row, i) => {
                const param = String(row[paramCol?.id] ?? '');
                const value = row[valueCol?.id];
                const note = notesCol ? String(row[notesCol.id] ?? '') : '';
                const fmtVal = fmt(value, param);
                const color = numColor(value);
                const isLastRow = i === grp.rows.length - 1;

                return (
                  <tr key={row._id ?? i}
                    onClick={() => onEditRow(row)}
                    style={{ borderBottom: isLastRow ? 'none' : `0.5px solid ${C.border}`, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bg2)}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-5 py-3" style={{ width: '45%', color: C.text, fontSize: 13, fontWeight: 500 }}>
                      {param}
                    </td>
                    <td className="px-5 py-3" style={{ width: '20%', textAlign: 'right' }}>
                      <span className="font-semibold text-[14px]" style={{ color: color ?? C.text, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtVal}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ width: '35%', color: C.text3, fontSize: 12, lineHeight: 1.4 }}>
                      {truncate(note, 80)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Financial Report View (P&L, with section headers + period columns) ───────
export function FinancialReportView({ section }: { section: SectionWithRecords }) {
  const cols = section.schema.columns;
  const rows = section.records;
  if (!cols.length) return null;

  const rowLabelCol = cols[0];
  const periodCols = cols.slice(1);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
      {/* Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: C.bg2, borderBottom: `0.5px solid ${C.border}` }}>
              <th className="px-5 py-3 text-left" style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.04em', width: '35%' }}>
                {rowLabelCol.label || 'Item'}
              </th>
              {periodCols.map(col => (
                <th key={col.id} className="px-4 py-3 text-right" style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {col.label.replace(/\n/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const firstVal = String(row[rowLabelCol.id] ?? '').trim();
              const isSection = isSectionHeader(row, cols);
              const isTotal = !isSection && isTotalRow(row, cols);
              const isMargin = firstVal.toLowerCase().includes('margin') || firstVal.toLowerCase().includes('%');

              if (isSection) {
                return (
                  <tr key={row._id ?? i}>
                    <td colSpan={periodCols.length + 1} className="px-5 pt-5 pb-2"
                      style={{ background: '#fafafa', borderBottom: `0.5px solid ${C.borderMd}` }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.text3 }}>{firstVal}</span>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row._id ?? i} style={{
                  borderBottom: `0.5px solid ${C.border}`,
                  background: isTotal ? C.bg2 : 'transparent',
                  fontWeight: isTotal ? 700 : 400,
                }}>
                  <td className="px-5 py-2.5" style={{
                    fontSize: 13, color: C.text,
                    paddingLeft: firstVal.startsWith('  ') ? 28 : 20,
                  }}>
                    {firstVal.trim() || '—'}
                  </td>
                  {periodCols.map(col => {
                    const v = row[col.id];
                    const fmtd = fmt(v, isMargin ? '%' : col.label);
                    const clr = (isTotal || isMargin) ? numColor(v) : undefined;
                    return (
                      <td key={col.id} className="px-4 py-2.5 text-right" style={{ fontSize: 13, color: clr ?? C.text, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {fmtd}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Time-Series View (Monthly Forecast) ─────────────────────────────────────
export function TimeSeriesView({ section }: { section: SectionWithRecords }) {
  const cols = section.schema.columns;
  const rows = section.records;
  if (!cols.length) return null;

  const [highlight, setHighlight] = useState<string | null>(null);

  // Detect which column is "net income" for color coding
  const netCol = cols.find(c =>
    /net|income|profit|loss/i.test(c.label) && c !== cols[0]
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.bg, border: `0.5px solid ${C.border}` }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: C.bg2, borderBottom: `0.5px solid ${C.border}` }}>
              {cols.map(col => (
                <th key={col.id}
                  onClick={() => setHighlight(h => h === col.id ? null : col.id)}
                  className="px-4 py-3 text-left whitespace-nowrap cursor-pointer select-none"
                  style={{
                    fontSize: 11, fontWeight: 700, color: highlight === col.id ? C.indigo : C.text3,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    background: highlight === col.id ? C.indigoBg : 'transparent',
                  }}>
                  {col.label.replace(/\n/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const firstVal = String(row[cols[0]?.id] ?? '').toUpperCase();
              const isTotal = /^(full|total|annual|sum)/i.test(firstVal);

              return (
                <tr key={row._id ?? i} style={{
                  borderBottom: `0.5px solid ${C.border}`,
                  fontWeight: isTotal ? 700 : 400,
                  background: isTotal ? '#fffbeb' : 'transparent',
                }}>
                  {cols.map((col, ci) => {
                    const v = row[col.id];
                    const fmtd = ci === 0 ? String(v ?? '—') : fmt(v, col.label);
                    let color: string | undefined;
                    if (col === netCol && typeof v === 'number') color = numColor(v);
                    else if (highlight === col.id) color = C.indigo;

                    return (
                      <td key={col.id} className="px-4 py-2.5" style={{
                        fontSize: 13,
                        color: color ?? C.text,
                        textAlign: ci === 0 ? 'left' : 'right',
                        background: highlight === col.id ? '#fafaff' : 'transparent',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}>
                        {fmtd}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-[11px]" style={{ color: C.text3, borderTop: `0.5px solid ${C.border}`, background: C.bg2 }}>
        Click any column header to highlight it
      </div>
    </div>
  );
}

// ─── Budget View (Use of Funds) ───────────────────────────────────────────────
export function BudgetView({ section, onEditRow, onAddRow }: {
  section: SectionWithRecords;
  onEditRow: (row: Row) => void;
  onAddRow: () => void;
}) {
  const cols = section.schema.columns;
  const rows = section.records;

  const catCol = cols[0];
  const amtCol = cols.find(c => /amount|cost|\$|monto/i.test(c.label)) ?? cols[1];
  const pctCol = cols.find(c => /%|percent/i.test(c.label)) ?? cols[2];
  const purposeCol = cols.find(c => /purpose|description|note|reason/i.test(c.label)) ?? cols[3];

  const totalAmt = rows.reduce((s, r) => {
    const v = Number(r[amtCol?.id] ?? 0);
    return isNaN(v) ? s : s + v;
  }, 0);

  // Filter out "TOTAL" rows from items list
  const items = rows.filter(r => !/^total/i.test(String(r[catCol?.id] ?? '')));

  return (
    <div className="flex flex-col gap-4">
      {/* Total card */}
      <div className="rounded-xl p-5 flex items-center justify-between" style={{ background: C.indigoBg, border: `0.5px solid rgba(79,70,229,0.2)` }}>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: C.indigo }}>Total Budget</div>
          <div className="text-[32px] font-semibold leading-none" style={{ color: C.indigo }}>{fmt(totalAmt, '$')}</div>
        </div>
        <button onClick={onAddRow}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: C.indigo, boxShadow: '0 2px 8px rgba(79,70,229,0.25)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          Add item
        </button>
      </div>

      {/* Item cards */}
      <div className="flex flex-col gap-2.5">
        {items.map((row, i) => {
          const cat = String(row[catCol?.id] ?? '');
          const amt = Number(row[amtCol?.id] ?? 0);
          const pct = pctCol
            ? Number(row[pctCol.id] ?? 0)
            : totalAmt > 0 ? amt / totalAmt : 0;
          const pctDisplay = (Math.abs(pct) <= 1 ? pct * 100 : pct).toFixed(1);
          const purpose = purposeCol ? String(row[purposeCol.id] ?? '') : '';
          const barPct = totalAmt > 0 ? (amt / totalAmt) * 100 : 0;

          return (
            <div key={row._id ?? i}
              onClick={() => onEditRow(row)}
              className="rounded-xl p-4 cursor-pointer transition-colors"
              style={{ background: C.bg, border: `0.5px solid ${C.border}` }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bg2)}
              onMouseLeave={e => (e.currentTarget.style.background = C.bg)}>
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: C.text }}>{cat}</div>
                  {purpose && <div className="text-[12px] mt-0.5 leading-snug" style={{ color: C.text3 }}>{truncate(purpose, 80)}</div>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-[18px] font-semibold" style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(amt, '$')}
                  </div>
                  <div className="text-[11px] font-medium" style={{ color: C.text3 }}>{pctDisplay}%</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full" style={{ background: C.bg3 }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barPct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scenario / Analysis table (Sensitivity Analysis) ────────────────────────
// This one works with the standard RecordsView but with smarter badge colours
export function scenarioVerdictStyle(val: string): React.CSSProperties {
  const v = (val || '').toLowerCase();
  if (/healthy|strong|good/i.test(v)) return { background: '#D1FAE5', color: '#065F46' };
  if (/profitable|profit/i.test(v)) return { background: '#EEF2FF', color: '#3730A3' };
  if (/breakeven|restructure/i.test(v)) return { background: '#FEF3C7', color: '#78350F' };
  if (/loss|fail|critical/i.test(v)) return { background: '#FFE4E6', color: '#9F1239' };
  return { background: '#F1F5F9', color: '#1E293B' };
}

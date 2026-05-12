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

// ─── Budget View (Use of Funds / Grant Budget / Line-item Budget) ─────────────
function parseAmt(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/[$,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function BudgetView({ section, onEditRow, onAddRow }: {
  section: SectionWithRecords;
  onEditRow: (row: Row) => void;
  onAddRow: () => void;
}) {
  const cols = section.schema.columns;
  const rows = section.records;

  // ── Column detection ────────────────────────────────────────────────────────
  const catCol = cols[0];
  const amtCol = (() => {
    const byLabel = cols.find(c => /amount|cost|\$|monto|price|total/i.test(c.label) && c !== catCol);
    if (byLabel) return byLabel;
    return [...cols].slice(1).sort((a, b) => {
      const na = rows.filter(r => parseAmt(r[a.id]) !== 0).length;
      const nb = rows.filter(r => parseAmt(r[b.id]) !== 0).length;
      return nb - na;
    })[0] ?? cols[1];
  })();
  const pctCol = cols.find(c => /%|percent/i.test(c.label));
  const descCol = cols.find(c => c !== catCol && c !== amtCol && c !== pctCol &&
    /item|service|descripci|description|purpose|note|reason|detail|concept/i.test(c.label)) ??
    cols.find(c => c !== catCol && c !== amtCol && c !== pctCol &&
      rows.some(r => typeof r[c.id] === 'string' && String(r[c.id]).length > 4));

  // ── Helper: is this text predominantly uppercase? (≥80 % of letters) ───────
  function looksLikeHeader(cat: string): boolean {
    if (cat.length < 4) return false;
    const letters = cat.replace(/[^A-Za-z]/g, '');
    if (letters.length < 3) return false;
    const upper = letters.split('').filter(c => c >= 'A' && c <= 'Z').length;
    return upper / letters.length >= 0.80;
  }

  // ── Section header: 80 %+ uppercase letters, not a bare number ─────────────
  function isSection(row: Row): boolean {
    const cat = String(row[catCol?.id] ?? '').trim();
    if (!cat || /^\d+$/.test(cat)) return false;
    return looksLikeHeader(cat);
  }

  // ── Noise: rows that add no value to the view ──────────────────────────────
  function isNoise(row: Row): boolean {
    const cat = String(row[catCol?.id] ?? '').trim();
    const amt = parseAmt(row[amtCol?.id]);
    const desc = descCol ? String(row[descCol.id] ?? '').trim() : '';
    // Fully empty row
    if (!cat && !desc && amt === 0) return true;
    // Pure punctuation / special placeholder (e.g. "#", "–", "-")
    if (/^[#*\-–—/\\.]+$/.test(cat)) return true;
    // Explicit note rows
    if (/^note[s]?:/i.test(cat)) return true;
    // Column-header row: ≥2 cells match their own column label
    const headerHits = cols.filter(c =>
      String(row[c.id] ?? '').trim().toLowerCase() === c.label.trim().toLowerCase()
    ).length;
    if (headerHits >= 2) return true;
    // Long mixed-case sentence with $0 and no description = preamble/comment text
    // Only filter if it's clearly a sentence (>60 chars, has spaces, not a numbered item)
    if (amt === 0 && !looksLikeHeader(cat) && !desc && cat.length > 60 &&
        /\s/.test(cat) && !/^\d/.test(cat)) return true;
    return false;
  }

  // ── Smart title: row-number prefix → promote description ───────────────────
  function rowTitle(row: Row): { label: string; badge: string | null } {
    const cat = String(row[catCol?.id] ?? '').trim();
    const desc = descCol ? String(row[descCol.id] ?? '').trim() : '';
    // Numbered row → description is the real label
    if (/^\d{1,4}$/.test(cat) && desc) return { label: desc, badge: cat };
    // Empty first column → use description as label
    if (!cat && desc) return { label: desc, badge: null };
    // If cat is short (code/number) and desc is longer → prefer desc
    if (cat.length <= 4 && desc.length > cat.length) return { label: desc, badge: cat || null };
    return { label: cat || desc || '—', badge: null };
  }

  // ── Build groups ────────────────────────────────────────────────────────────
  type Group = { header: string | null; items: Row[] };
  const groups: Group[] = [];
  let cur: Group = { header: null, items: [] };

  for (const row of rows) {
    if (isNoise(row)) continue;
    if (isSection(row)) {
      if (cur.items.length > 0 || cur.header) groups.push(cur);
      cur = { header: String(row[catCol?.id] ?? '').trim(), items: [] };
    } else {
      cur.items.push(row);
    }
  }
  if (cur.items.length > 0 || cur.header) groups.push(cur);
  // Drop empty header-only groups (section headers with no items below them)
  const filledGroups = groups.filter(g => g.items.length > 0);

  const allItems = filledGroups.flatMap(g => g.items);
  const isSubtotalLabel = (label: string) =>
    /\bsubtotal\b/i.test(label) ||
    /\btotal\s+claimed\b|\bgrand\s+total\b/i.test(label);

  // Total = highest-level amount in the sheet — use the grand total row if present,
  // otherwise sum all leaf (non-subtotal) items to avoid double-counting.
  const grandTotalRow = allItems.find(r => {
    const { label } = rowTitle(r);
    return /\bgrand\s+total\b|\bfull\s+net\s+budget\b|\btotal\s+budget\b/i.test(label);
  });
  const totalAmt = grandTotalRow
    ? parseAmt(grandTotalRow[amtCol?.id])
    : allItems
        .filter(r => !isSubtotalLabel(rowTitle(r).label))
        .reduce((s, r) => { const v = parseAmt(r[amtCol?.id]); return v > 0 ? s + v : s; }, 0);

  const leafCount = allItems.filter(r => !isSubtotalLabel(rowTitle(r).label)).length;

  const fmtMoney = (n: number) =>
    (n < 0 ? '−' : '') +
    '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-4">
      {/* ── Summary banner ── */}
      <div className="rounded-xl p-5 flex items-center justify-between"
        style={{ background: C.indigoBg, border: `0.5px solid rgba(79,70,229,0.2)` }}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.indigo }}>Total Budget</div>
          <div className="text-[30px] font-semibold leading-none tabular-nums" style={{ color: C.indigo }}>{fmtMoney(totalAmt)}</div>
          <div className="text-[11px] mt-1.5" style={{ color: C.indigo, opacity: 0.65 }}>
            {leafCount} item{leafCount !== 1 ? 's' : ''} across {filledGroups.length} group{filledGroups.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={onAddRow}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: C.indigo, boxShadow: '0 2px 8px rgba(79,70,229,0.25)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          Add item
        </button>
      </div>

      {/* ── Groups ── */}
      {filledGroups.map((grp, gi) => {
        const color = CHART_COLORS[gi % CHART_COLORS.length];
        // Section total: prefer explicit subtotal row if present, else sum leaf items
        const subRow = grp.items.find(r => isSubtotalLabel(rowTitle(r).label));
        const grpLeafAmt = subRow
          ? parseAmt(subRow[amtCol?.id])
          : grp.items
              .filter(r => !isSubtotalLabel(rowTitle(r).label))
              .reduce((s, r) => s + Math.max(0, parseAmt(r[amtCol?.id])), 0);

        return (
          <div key={gi} className="rounded-xl overflow-hidden" style={{ border: `0.5px solid ${C.border}` }}>
            {/* Section header */}
            {grp.header && (
              <div className="px-5 py-3 flex items-center gap-3"
                style={{ background: C.bg2, borderBottom: `0.5px solid ${C.border}` }}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[12px] font-semibold flex-1" style={{ color: C.text2 }}>
                  {grp.header}
                </span>
                <span className="text-[13px] font-bold tabular-nums flex-shrink-0" style={{ color: C.text }}>
                  {fmtMoney(grpLeafAmt)}
                </span>
              </div>
            )}

            {/* Item rows */}
            {grp.items.map((row, i) => {
              const { label, badge } = rowTitle(row);
              const rawAmt = parseAmt(row[amtCol?.id]);
              const pctOfTotal = totalAmt > 0 ? rawAmt / totalAmt : 0;
              const barWidth = Math.max(0, pctOfTotal) * 100;
              const isNeg = rawAmt < 0;
              const isSub = isSubtotalLabel(label);
              const extraDesc = descCol && !badge
                ? String(row[descCol.id] ?? '').trim()
                : '';

              return (
                <div key={row._id ?? i}
                  onClick={() => onEditRow(row)}
                  className="cursor-pointer group"
                  style={{
                    padding: isSub ? '10px 20px' : '11px 20px',
                    background: isSub ? C.bg2 : C.bg,
                    borderBottom: i < grp.items.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bg3)}
                  onMouseLeave={e => (e.currentTarget.style.background = isSub ? C.bg2 : C.bg)}>

                  <div className="flex items-center gap-3">
                    {badge && (
                      <span className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: color + '18', color }}>
                        {badge}
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] leading-snug"
                        style={{ color: C.text, fontWeight: isSub ? 700 : 500 }}>
                        {label || '—'}
                      </div>
                      {extraDesc && extraDesc !== label && !isSub && (
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: C.text3 }}>
                          {truncate(extraDesc, 72)}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-[14px] font-semibold tabular-nums"
                        style={{ color: isNeg ? C.red : C.text }}>
                        {fmtMoney(rawAmt)}
                      </div>
                      {!isSub && rawAmt > 0 && totalAmt > 0 && (
                        <div className="text-[10px] tabular-nums mt-0.5" style={{ color: C.text3 }}>
                          {(pctOfTotal * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>

                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-30 transition-opacity"
                      style={{ color: C.text3 }}>
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {!isSub && !isNeg && rawAmt > 0 && barWidth > 0.1 && (
                    <div className="mt-2 h-0.5 rounded-full" style={{ background: C.bg3 }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(barWidth, 100)}%`, background: color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {filledGroups.length === 0 && (
        <div className="rounded-xl p-10 text-center" style={{ background: C.bg, border: `0.5px solid ${C.border}`, color: C.text3 }}>
          No budget items found. Click <strong>Add item</strong> to get started.
        </div>
      )}
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

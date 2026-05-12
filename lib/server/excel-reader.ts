import * as XLSX from 'xlsx';
import type { SheetInfo, Schema, Column, Row, SheetStructure } from '../types';
import { inferColumnType } from '../parser/type-inference';
import { detectSemanticRole } from '../parser/semantic-detection';
import { v4 as uuidv4 } from 'uuid';

function slugify(header: string): string {
  return (
    header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'col'
  );
}

function detectLanguage(headers: string[], samples: string[]): 'es' | 'en' | 'pt' {
  const text = [...headers, ...samples].join(' ').toLowerCase();
  const es = ['cliente', 'estado', 'fecha', 'responsable', 'prioridad', 'ingresos', 'gastos', 'precio', 'carpeta', 'expediente', 'empresa', 'gestión'].filter(w => text.includes(w)).length;
  const en = ['client', 'status', 'date', 'owner', 'priority', 'revenue', 'expense', 'price', 'budget', 'amount', 'estimated', 'total', 'grant', 'disbursement', 'investment', 'withholding'].filter(w => text.includes(w)).length;
  const pt = ['cliente', 'data', 'respons', 'prioridade', 'receita', 'despesas', 'empresa'].filter(w => text.includes(w)).length;
  // Only classify as Spanish/Portuguese if there's actual evidence; default to English
  if (es > 0 && es > en && es >= pt) return 'es';
  if (pt > 0 && pt > en) return 'pt';
  return 'en';
}

// ─── Structure detection ──────────────────────────────────────────────────────
function detectStructure(
  colLabels: string[],
  rows: Row[],
  colIds: string[]
): SheetStructure {
  const h = colLabels.map(s => s.toLowerCase());
  const colCount = colLabels.length;

  // Budget: has a cost/amount column + (has description/items col OR small column count)
  // The % column is optional — grant budgets, use-of-funds sheets, etc. rarely have %
  const hasCostCol = h.some(x => /\bamount\b|\bcost\b|\$|budget|monto|\bprecio\b|\bprice\b/i.test(x));
  const hasItemsCol = h.some(x => /item|service|descripci|description|category|purpose|concept|concepto/i.test(x));
  if (hasCostCol && (hasItemsCol || colCount <= 5)) return 'budget';

  // Financial report OR timeseries: columns 1+ are year/period-based
  // Use strict pattern so "cumul." doesn't trigger it
  const YEAR_PERIOD = /\byear\b|\byr\b|^Q[1-4]\s+\d{4}|\bH[12]\b.*\d{4}|3-year|3 year|\btotal\b/i;
  const periodCols = colLabels.slice(1).filter(Boolean);
  const yearPeriodCount = periodCols.filter(h => YEAR_PERIOD.test(h)).length;

  if (yearPeriodCount >= 2) {
    // Does the first column contain ALL-CAPS section headers? → financial_report
    const firstId = colIds[0];
    if (firstId) {
      const hasSections = rows.some(r => {
        const v = String(r[firstId] ?? '').trim();
        return v.length > 4 && v === v.toUpperCase() && /[A-Z]{3}/.test(v) && !/^\d/.test(v) && !/^(FULL|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JAN|FEB|MAR)/i.test(v);
      });
      if (hasSections) return 'financial_report';
    }
  }

  // Timeseries: first column contains month/date strings in data
  const firstId = colIds[0];
  if (firstId && rows.length >= 4) {
    const MONTH_PATTERN = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|ene|abr|ago|ene|dic)\b.*\d{4}|\d{4}.*\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;
    const monthCount = rows.slice(0, 8).filter(r => MONTH_PATTERN.test(String(r[firstId] ?? ''))).length;
    if (monthCount >= 4) return 'timeseries';
  }

  // KV table: 2–4 columns, first col is all strings, second has numbers
  if (colCount >= 2 && colCount <= 4) {
    const firstAllText = rows.every(r => {
      const v = r[colIds[0]];
      return v == null || v === '' || typeof v === 'string';
    });
    const secondHasNums = rows.some(r => {
      const v = r[colIds[1]];
      return v != null && v !== '' && !isNaN(Number(v));
    });
    if (firstAllText && secondHasNums) return 'kv_table';
  }

  return 'records';
}

// ─── Smart header row detection ───────────────────────────────────────────────
interface HeaderResult {
  idx: number;
  source: (string | null)[];
  dataStart: number; // first row index of actual data
}

function looksLikeDataValue(s: string): boolean {
  // Currency string like $5,000.00 or -$1,200
  if (/^-?\$[\d,]+(\.\d+)?$/.test(s.trim())) return true;
  // Pure numeric string with commas (1,200.00)
  if (/^-?[\d]{1,3}(,\d{3})*(\.\d+)?$/.test(s.trim()) && s.includes(',')) return true;
  // Percentage
  if (/^-?\d+(\.\d+)?%$/.test(s.trim())) return true;
  return false;
}

function scoreHeaderCandidate(nonEmpty: string[]): number {
  // Prefer rows whose cells look like typical column names
  let score = 0;
  for (const s of nonEmpty) {
    if (looksLikeDataValue(s)) score -= 5;
    if (s.length <= 30 && /^[A-Za-z#]/.test(s)) score += 1;
    if (/^(#|n[°o]|item|name|date|status|cost|amount|description|service|category|type|priority|area|client|id)/i.test(s)) score += 3;
  }
  return score;
}

function findHeaderRow(raw: unknown[][]): HeaderResult {
  const maxSearch = Math.min(15, raw.length);

  // Pass 1: row where ALL non-null cells are strings → definite header
  // Collect all candidates then pick the best-scoring one (avoids picking data rows that happen to be all-strings)
  const candidates: { i: number; score: number; source: (string | null)[] }[] = [];

  for (let i = 0; i < maxSearch; i++) {
    const row = raw[i] as unknown[];
    const nonEmpty = row.filter(c => c != null && c !== '');
    if (nonEmpty.length < 2) continue;
    const allStrings = nonEmpty.every(c => typeof c === 'string');
    if (!allStrings) continue;
    const hasNextData = raw.slice(i + 1, i + 5).some(r =>
      (r as unknown[]).some(c => c != null && c !== '')
    );
    if (!hasNextData) continue;
    const strVals = nonEmpty.map(String);
    const score = scoreHeaderCandidate(strVals);
    const source = row.map(h =>
      h != null && String(h).trim() !== '' ? String(h).replace(/\n/g, ' ').trim() : null
    );
    candidates.push({ i, score, source });
  }

  if (candidates.length > 0) {
    // Prefer highest-scoring candidate; if scores tied prefer the earlier one unless a later one scores significantly better
    candidates.sort((a, b) => b.score !== a.score ? b.score - a.score : a.i - b.i);
    const best = candidates[0];
    return { idx: best.i, source: best.source, dataStart: best.i + 1 };
  }

  // Pass 2: row where first col is null but rest are year/period strings
  for (let i = 0; i < maxSearch; i++) {
    const row = raw[i] as unknown[];
    const nonEmpty = row.filter(c => c != null && c !== '');
    if (nonEmpty.length < 2) continue;
    const firstIsNull = row[0] == null || row[0] === '';
    const restStrings = nonEmpty.every(c => typeof c === 'string');
    const hasPeriods = nonEmpty.some(c => /year|yr|quarter|Q[1-4]|total|H[12]/i.test(String(c)));
    if (firstIsNull && restStrings && hasPeriods) {
      const source = row.map(h =>
        h != null && String(h).trim() !== '' ? String(h).replace(/\n/g, ' ').trim() : null
      );
      return { idx: i, source, dataStart: i + 1 };
    }
  }

  // Pass 3: no header found → KV-style table; generate implicit headers
  for (let i = 0; i < maxSearch; i++) {
    const row = raw[i] as unknown[];
    const nonEmpty = row.filter(c => c != null && c !== '');
    if (nonEmpty.length < 2) continue;
    const maxCols = Math.max(
      ...raw.slice(i, i + 20).map(r => (r as unknown[]).filter(c => c != null && c !== '').length)
    );
    const implicit: string[] = maxCols >= 3
      ? ['Parameter', 'Value', 'Notes']
      : ['Parameter', 'Value'];
    return { idx: i, source: implicit, dataStart: i };
  }

  return { idx: 0, source: [], dataStart: 1 };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getSheetInfos(buffer: Buffer): SheetInfo[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  return wb.SheetNames.map(name => {
    const ws = wb.Sheets[name];
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    const { source, dataStart } = findHeaderRow(raw);
    const headers = source.filter(Boolean).map(String).filter(h => h.trim().length > 0);
    const dataRows = raw.slice(dataStart).filter(r =>
      r && (r as unknown[]).some(c => c != null && c !== '')
    );
    return { name, rowCount: dataRows.length, headers };
  });
}

export function parseSheet(buffer: Buffer, sheetName: string): { schema: Schema; rows: Row[] } {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);

  // Pre-extract hyperlinks: map "R<row>C<col>" → URL
  const hyperlinkMap = new Map<string, string>();
  const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;
  if (range) {
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (cell?.l?.Target) hyperlinkMap.set(`${r},${c}`, cell.l.Target);
      }
    }
  }

  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const { source: headerSource, dataStart } = findHeaderRow(raw);

  // Keep track of original row indices for hyperlink lookups
  const dataRowsWithIdx: { row: unknown[]; rawIdx: number }[] = raw
    .map((r, i) => ({ row: r as unknown[], rawIdx: i }))
    .slice(dataStart)
    .filter(({ row }) => row && row.some(c => c != null && c !== ''));

  const dataRows = dataRowsWithIdx.map(({ row }) => row);

  // Determine actual column count from data
  const maxDataWidth = Math.max(
    headerSource.length,
    ...dataRows.map(r => (r as unknown[]).length)
  );

  // Build column labels: null cells in header → auto-generate
  const colLabels: string[] = Array.from({ length: maxDataWidth }, (_, i) => {
    const h = headerSource[i];
    if (h != null && h.trim() !== '') return h.trim();
    const hasData = dataRows.some(r => (r as unknown[])[i] != null && (r as unknown[])[i] !== '');
    if (i === 0 && hasData) return 'Item';
    if (hasData) return `Column ${i + 1}`;
    return '';
  });

  // Collect values per column for type inference
  const colValues: unknown[][] = Array.from({ length: maxDataWidth }, () => []);
  for (const row of dataRows) {
    for (let i = 0; i < maxDataWidth; i++) {
      colValues[i].push((row as unknown[])[i] ?? null);
    }
  }

  const sampleStrings: string[] = [];
  for (const row of dataRows.slice(0, 5)) {
    for (const v of row as unknown[]) {
      if (typeof v === 'string' && v.length > 2 && v.length < 60) sampleStrings.push(v);
    }
  }

  // Build columns (skip truly empty columns)
  const columns: Column[] = [];
  const colIndexMap: number[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < maxDataWidth; i++) {
    const label = colLabels[i];
    if (!label) continue;

    let id = slugify(label);
    if (usedIds.has(id)) id = `${id}_${i}`;
    usedIds.add(id);

    const type = inferColumnType(colValues[i]);
    const semanticRole = detectSemanticRole(label);
    const options: string[] | undefined = type === 'enum'
      ? [...new Set((colValues[i]).filter(v => v != null && v !== '').map(String))].slice(0, 30)
      : undefined;

    columns.push({ id, excelHeader: label, label, type, semanticRole, options });
    colIndexMap.push(i);
  }

  const language = detectLanguage(columns.map(c => c.label), sampleStrings);

  // Build row objects (use rawIdx to look up hyperlinks per cell)
  const rows: Row[] = dataRowsWithIdx.map(({ row: rawRow, rawIdx: rowIdx }) => {
    const row: Row = { _id: uuidv4() };
    for (let ci = 0; ci < columns.length; ci++) {
      const colIdx = colIndexMap[ci];
      const col = columns[ci];
      // Prefer hyperlink URL over cell text for url/link columns
      const hyperlink = hyperlinkMap.get(`${rowIdx},${colIdx}`);
      let val: unknown = (rawRow as unknown[])[colIdx] ?? null;
      if (hyperlink && (col.semanticRole === 'link' || col.type === 'url')) {
        val = hyperlink;
      } else if (val instanceof Date) {
        val = val.toISOString().slice(0, 10);
      } else if (typeof val === 'string') {
        val = val.trim() || null;
      } else if (val !== null && val !== undefined) {
        // keep numbers as-is
      } else {
        val = null;
      }
      row[col.id] = val as Row[string];
    }
    return row;
  });

  const colIds = columns.map(c => c.id);
  const structure = detectStructure(columns.map(c => c.label), rows, colIds);

  const schema: Schema = {
    columns,
    language,
    rowCount: rows.length,
    sheetName,
    structure,
  };

  return { schema, rows };
}

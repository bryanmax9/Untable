/**
 * Parses raw Google Sheets API values (string[][]) through the same
 * 3-layer pipeline as excel-reader.ts (type inference → schema → rows).
 * Excel upload code is kept intact as reference — do not delete.
 */
import type { Schema, Column, Row, SheetInfo, SheetStructure } from '../types';
import { inferColumnType } from '../parser/type-inference';
import { detectSemanticRole } from '../parser/semantic-detection';
import { v4 as uuidv4 } from 'uuid';

function slugify(header: string): string {
  return (
    header.toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'col'
  );
}

function detectLanguage(headers: string[], samples: string[]): 'es' | 'en' | 'pt' {
  const text = [...headers, ...samples].join(' ').toLowerCase();
  const es = ['cliente','estado','fecha','responsable','prioridad','ingresos','gastos','precio','carpeta','expediente','empresa','gestión'].filter(w => text.includes(w)).length;
  const en = ['client','status','date','owner','priority','revenue','expense','price','budget','amount','estimated','total'].filter(w => text.includes(w)).length;
  const pt = ['cliente','data','respons','prioridade','receita','despesas','empresa'].filter(w => text.includes(w)).length;
  if (es > 0 && es > en && es >= pt) return 'es';
  if (pt > 0 && pt > en) return 'pt';
  return 'en';
}

function detectStructure(colLabels: string[], rows: Row[], colIds: string[]): SheetStructure {
  const h = colLabels.map(s => s.toLowerCase());
  const colCount = colLabels.length;
  const hasCostCol  = h.some(x => /\bamount\b|\bcost\b|\$|budget|monto|\bprecio\b|\bprice\b/i.test(x));
  const hasItemsCol = h.some(x => /item|service|descripci|description|category|purpose|concept|concepto/i.test(x));
  if (hasCostCol && (hasItemsCol || colCount <= 5)) return 'budget';

  const YEAR_PERIOD = /\byear\b|\byr\b|^Q[1-4]\s+\d{4}|\bH[12]\b.*\d{4}|3-year|3 year|\btotal\b/i;
  const periodCols = colLabels.slice(1).filter(Boolean);
  const yearPeriodCount = periodCols.filter(h => YEAR_PERIOD.test(h)).length;
  if (yearPeriodCount >= 2) {
    const firstId = colIds[0];
    if (firstId) {
      const hasSections = rows.some(r => {
        const v = String(r[firstId] ?? '').trim();
        return v.length > 4 && v === v.toUpperCase() && /[A-Z]{3}/.test(v) && !/^\d/.test(v);
      });
      if (hasSections) return 'financial_report';
    }
  }

  const firstId = colIds[0];
  if (firstId && rows.length >= 4) {
    const MONTH_PATTERN = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|ene|abr|ago|dic)\b.*\d{4}|\d{4}.*\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;
    const monthCount = rows.slice(0, 8).filter(r => MONTH_PATTERN.test(String(r[firstId] ?? ''))).length;
    if (monthCount >= 4) return 'timeseries';
  }

  if (colCount >= 2 && colCount <= 4) {
    const firstAllText  = rows.every(r => { const v = r[colIds[0]]; return v == null || v === '' || typeof v === 'string'; });
    const secondHasNums = rows.some(r  => { const v = r[colIds[1]]; return v != null && v !== '' && !isNaN(Number(v)); });
    if (firstAllText && secondHasNums) return 'kv_table';
  }

  return 'records';
}

function scoreHeaderCandidate(nonEmpty: string[]): number {
  let score = 0;
  for (const s of nonEmpty) {
    if (s.length <= 30 && /^[A-Za-z#]/.test(s)) score += 1;
    if (/^(#|n[°o]|item|name|date|status|cost|amount|description|service|category|type|priority|area|client|id)/i.test(s)) score += 3;
  }
  return score;
}

function findHeaderRow(raw: string[][]): { source: (string | null)[]; dataStart: number } {
  const maxSearch = Math.min(15, raw.length);
  const candidates: { i: number; score: number; source: (string | null)[] }[] = [];

  for (let i = 0; i < maxSearch; i++) {
    const row = raw[i];
    const nonEmpty = row.filter(c => c != null && c !== '');
    if (nonEmpty.length < 2) continue;
    const hasNextData = raw.slice(i + 1, i + 5).some(r => r.some(c => c != null && c !== ''));
    if (!hasNextData) continue;
    const score = scoreHeaderCandidate(nonEmpty);
    const source = row.map(h => (h != null && h.trim() !== '') ? h.replace(/\n/g, ' ').trim() : null);
    candidates.push({ i, score, source });
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score !== a.score ? b.score - a.score : a.i - b.i);
    const best = candidates[0];
    return { source: best.source, dataStart: best.i + 1 };
  }

  // No clear header: generate implicit headers
  for (let i = 0; i < maxSearch; i++) {
    const row = raw[i];
    const nonEmpty = row.filter(c => c != null && c !== '');
    if (nonEmpty.length < 2) continue;
    const maxCols = Math.max(...raw.slice(i, i + 20).map(r => r.filter(c => c != null && c !== '').length));
    const implicit = maxCols >= 3 ? ['Parameter', 'Value', 'Notes'] : ['Parameter', 'Value'];
    return { source: implicit, dataStart: i };
  }

  return { source: [], dataStart: 1 };
}

export function getSheetInfo(values: string[][], sheetName: string): SheetInfo {
  const { source, dataStart } = findHeaderRow(values);
  const headers = source.filter(Boolean).map(String).filter(h => h.trim().length > 0);
  const dataRows = values.slice(dataStart).filter(r => r.some(c => c != null && c !== ''));
  return { name: sheetName, rowCount: dataRows.length, headers };
}

export function parseGoogleSheetValues(
  values: string[][],
  sheetName: string,
  hyperlinks?: (string | null)[][],
  colValidations?: (string[] | null)[],
): { schema: Schema; rows: Row[] } {
  const { source: headerSource, dataStart } = findHeaderRow(values);

  // Preserve original row indices so hyperlink lookup stays correct
  // even when some rows are empty and filtered out.
  const dataRowsWithIdx = values
    .slice(dataStart)
    .map((row, i) => ({ row, origIdx: dataStart + i }))
    .filter(({ row }) => row.some(c => c != null && c !== ''));

  const dataRows = dataRowsWithIdx.map(d => d.row);
  const maxDataWidth = Math.max(headerSource.length, ...dataRows.map(r => r.length));

  const colLabels: string[] = Array.from({ length: maxDataWidth }, (_, i) => {
    const h = headerSource[i];
    if (h != null && h.trim() !== '') return h.trim();
    const hasData = dataRows.some(r => r[i] != null && r[i] !== '');
    if (i === 0 && hasData) return 'Item';
    if (hasData) return `Column ${i + 1}`;
    return '';
  });

  const colValues: unknown[][] = Array.from({ length: maxDataWidth }, () => []);
  for (const row of dataRows) {
    for (let i = 0; i < maxDataWidth; i++) {
      colValues[i].push(row[i] ?? null);
    }
  }

  const sampleStrings: string[] = [];
  for (const row of dataRows.slice(0, 5)) {
    for (const v of row) {
      if (typeof v === 'string' && v.length > 2 && v.length < 60) sampleStrings.push(v);
    }
  }

  const columns: Column[] = [];
  const colIndexMap: number[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < maxDataWidth; i++) {
    const label = colLabels[i];
    if (!label) continue;

    let id = slugify(label);
    if (usedIds.has(id)) id = `${id}_${i}`;
    usedIds.add(id);

    let type = inferColumnType(colValues[i]);
    const semanticRole = detectSemanticRole(label);

    // Google Sheets data validation is the most reliable source for dropdown detection.
    // Override inferred type when the sheet has an explicit ONE_OF_LIST rule.
    const validationOpts = colValidations?.[i];
    if (validationOpts?.length) type = 'enum';

    const options: string[] | undefined =
      validationOpts?.length ? validationOpts :
      type === 'enum'
        ? [...new Set(colValues[i].filter(v => v != null && v !== '').map(String))].slice(0, 30)
        : undefined;

    columns.push({ id, excelHeader: label, label, type, semanticRole, options });
    colIndexMap.push(i);
  }

  const language = detectLanguage(columns.map(c => c.label), sampleStrings);

  const rows: Row[] = dataRowsWithIdx.map(({ row: rawRow, origIdx }) => {
    // origIdx is 0-based index into the raw values array.
    // origIdx + 1 = the 1-indexed Google Sheet row number (row 1 = first sheet row).
    const row: Row = { _id: uuidv4(), _sheet_row: (origIdx + 1) as unknown as string };
    for (let ci = 0; ci < columns.length; ci++) {
      const colIdx = colIndexMap[ci];
      const col    = columns[ci];
      let val: unknown = rawRow[colIdx] ?? null;

      // For link/URL columns prefer the embedded Drive hyperlink URL over cell display text.
      // origIdx is the real sheet row so the hyperlink matrix lookup is always correct.
      if (col.type === 'url' || col.semanticRole === 'link') {
        const hlinkVal = hyperlinks?.[origIdx]?.[colIdx];
        if (hlinkVal) val = hlinkVal;
      }

      if (typeof val === 'string') val = val.trim() || null;
      row[col.id] = val as Row[string];
    }
    return row;
  });

  const colIds = columns.map(c => c.id);
  const structure = detectStructure(columns.map(c => c.label), rows, colIds);

  const schema: Schema = { columns, language, rowCount: rows.length, sheetName, structure };
  return { schema, rows };
}

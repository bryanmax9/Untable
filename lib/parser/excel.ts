'use client';
import * as XLSX from 'xlsx';
import type { Column, Row, Schema } from '../types';
import { inferColumnType } from './type-inference';
import { detectSemanticRole } from './semantic-detection';

export interface ParsedExcel {
  schema: Schema;
  rows: Row[];
  sheetName: string;
}

function slugify(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function excelDateToISO(serial: number): string {
  const utc = (serial - 25569) * 86400 * 1000;
  return new Date(utc).toISOString().slice(0, 10);
}

function detectLanguage(headers: string[], samples: string[]): 'es' | 'en' | 'pt' {
  const text = [...headers, ...samples].join(' ').toLowerCase();
  const es = ['cliente', 'estado', 'fecha', 'responsable', 'prioridad'].filter(w => text.includes(w)).length;
  const en = ['client', 'status', 'date', 'owner', 'priority'].filter(w => text.includes(w)).length;
  const pt = ['cliente', 'data', 'respons', 'prioridade'].filter(w => text.includes(w)).length;
  if (es >= en && es >= pt) return 'es';
  if (pt > en) return 'pt';
  return 'en';
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedExcel {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Get raw data as array of arrays
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });

  // Find the header row (first non-empty row)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const row = raw[i];
    if (row && row.filter(c => c != null && c !== '').length >= 3) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = raw[headerRowIdx] as unknown[];
  const dataRows = raw.slice(headerRowIdx + 1).filter(row =>
    row && row.some(c => c != null && c !== '')
  );

  if (!headerRow || headerRow.length === 0) {
    throw new Error('No header row found in Excel file');
  }

  // Build column values for type inference
  const colCount = headerRow.length;
  const colValues: unknown[][] = Array.from({ length: colCount }, () => []);
  for (const row of dataRows) {
    for (let i = 0; i < colCount; i++) {
      colValues[i].push((row as unknown[])[i] ?? null);
    }
  }

  const sampleStrings: string[] = [];
  for (const row of dataRows.slice(0, 5)) {
    for (const v of row as unknown[]) {
      if (typeof v === 'string' && v.length > 2 && v.length < 50) sampleStrings.push(v);
    }
  }

  const language = detectLanguage(
    headerRow.filter(Boolean).map(String),
    sampleStrings
  );

  const columns: Column[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < colCount; i++) {
    const rawHeader = headerRow[i];
    if (rawHeader == null || String(rawHeader).trim() === '') continue;

    const header = String(rawHeader).trim();
    let id = slugify(header);
    // Ensure unique IDs
    if (usedIds.has(id)) id = id + '_' + i;
    usedIds.add(id);

    const values = colValues[i];
    const type = inferColumnType(values);
    const semanticRole = detectSemanticRole(header);

    const options: string[] | undefined =
      type === 'enum'
        ? [...new Set(values.filter(v => v != null && v !== '').map(String))].slice(0, 30)
        : undefined;

    columns.push({ id, excelHeader: header, label: header, type, semanticRole, options });
  }

  // Build rows as {columnId: value}
  const rows: Row[] = dataRows.map(raw => {
    const row: Row = { _id: '' }; // _id populated by server; client-side preview uses ''
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      let val = (raw as unknown[])[i] ?? null;

      // Convert Date objects
      if (val instanceof Date) {
        val = val.toISOString().slice(0, 10);
      } else if (col.type === 'date' && typeof val === 'number') {
        val = excelDateToISO(val);
      } else if (val !== null) {
        val = typeof val === 'string' ? val.trim() : val;
      }

      row[col.id] = val as Row[string];
    }
    return row;
  });

  const schema: Schema = { columns, language, rowCount: rows.length, sheetName, structure: 'records' };
  return { schema, rows, sheetName };
}

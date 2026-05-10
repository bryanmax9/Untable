import * as XLSX from 'xlsx';
import type { StoredProject, Row } from '../types';

export function generateExcelBuffer(project: StoredProject, allRecords: Row[][]): Buffer {
  const wb = XLSX.utils.book_new();

  for (let i = 0; i < project.sections.length; i++) {
    const section = project.sections[i];
    const records = allRecords[i] ?? [];
    const { columns } = section.schema;

    // Build header row from original Excel headers
    const headers = columns.map(c => c.excelHeader);

    // Build data rows in original column order
    const data = records.map(row =>
      columns.map(col => {
        const v = row[col.id];
        return v == null ? '' : v;
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Style header row
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'EEF2FF' } },
      };
    }

    // Auto column widths
    ws['!cols'] = columns.map(col => {
      const maxLen = Math.max(
        col.excelHeader.length,
        ...records.map(r => String(r[col.id] ?? '').length).slice(0, 20)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    XLSX.utils.book_append_sheet(wb, ws, section.sheetName.slice(0, 31));
  }

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

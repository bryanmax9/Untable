'use client';
import React, { useState, useMemo } from 'react';
import type { AppConfig, Row, Column } from '@/lib/types';
import { COLOR_CLASSES } from '@/lib/binder/colors';
import { truncate, fmtDate, cn } from '@/lib/utils';
import { Badge } from '@/components/primitives/Badge';

function getCellDisplay(col: Column, val: unknown, colorMap: Record<string, string>): React.ReactNode {
  if (val == null || val === '') return <span className="text-slate-300">—</span>;
  const str = String(val);

  if (col.type === 'enum') {
    const colorKey = colorMap[str] ?? 'default';
    return <Badge value={str} colorKey={colorKey} />;
  }
  if (col.type === 'date') return <span className="text-[12px]">{fmtDate(str)}</span>;
  if (col.type === 'url') return (
    <a href={str} target="_blank" rel="noopener noreferrer"
      className="text-indigo-600 hover:underline text-[12px] truncate block max-w-[140px]">
      {str.replace(/^https?:\/\//, '')}
    </a>
  );
  if (col.type === 'longtext') return <span className="text-[12px] text-slate-600 dark:text-slate-300">{truncate(str, 60)}</span>;
  return <span className="text-[13px]">{truncate(str, 40)}</span>;
}

interface Props {
  config: AppConfig;
  fileName: string | null;
  onReset: () => void;
}

export function GenericTableTemplate({ config, fileName, onReset }: Props) {
  const { schema, colorMaps, rows, branding } = config;
  const [search, setSearch] = useState('');

  const enumCols = schema.columns.filter(c => c.type === 'enum');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const displayed = useMemo(() => {
    return rows.filter(r => {
      for (const [colId, val] of Object.entries(filters)) {
        if (val && r[colId] !== val) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return Object.values(r).some(v => v != null && String(v).toLowerCase().includes(q));
      }
      return true;
    });
  }, [rows, filters, search]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-52 min-w-52 bg-white dark:bg-slate-800 border-r border-black/[0.08] dark:border-white/[0.08] flex flex-col p-3">
        <div className="mb-4 px-1">
          <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-50">{branding.name}</div>
          <div className="text-[11px] text-slate-400">{schema.rowCount} registros</div>
        </div>

        {enumCols.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 px-1 uppercase tracking-widest font-semibold">Filtros</div>
            {enumCols.slice(0, 6).map(col => (
              <div key={col.id}>
                <div className="text-[11px] text-slate-500 mb-1 px-1">{col.label}</div>
                <select
                  value={filters[col.id] ?? ''}
                  onChange={e => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                  className="w-full text-[12px] px-2 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none">
                  <option value="">Todos</option>
                  {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
            {Object.values(filters).some(Boolean) && (
              <button onClick={() => setFilters({})}
                className="text-[12px] text-indigo-600 hover:underline px-1 text-left">
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <div className="mt-auto">
          <button onClick={onReset}
            className="w-full text-left px-2 py-2 rounded-lg text-[11px] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            ↩ Cargar otro XLSX
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 bg-white dark:bg-slate-800 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center px-5 gap-3">
          <div className="flex-1 text-[15px] font-semibold text-slate-900 dark:text-slate-50">{branding.name}</div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3 py-1.5 w-52">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#94a3b8" strokeWidth="1.3"/><path d="M9 9l2.5 2.5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="bg-transparent text-[13px] text-slate-900 dark:text-slate-100 outline-none w-full placeholder:text-slate-400" />
          </div>
          <span className="text-[12px] text-slate-400">{displayed.length} / {rows.length}</span>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                  {schema.columns.map(col => (
                    <th key={col.id}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.slice(0, 200).map((row, i) => (
                  <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    {schema.columns.map(col => (
                      <td key={col.id} className="px-4 py-2.5 max-w-[200px] align-middle">
                        {getCellDisplay(col, row[col.id], colorMaps[col.semanticRole ?? col.id] ?? {})}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useMemo } from 'react';
import type { AppConfig, Row } from '@/lib/types';
import { COLOR_CLASSES } from '@/lib/binder/colors';
import { initials, avatarColor, fmtDate, daysUntil, truncate, cn } from '@/lib/utils';
import { Badge } from '@/components/primitives/Badge';

// ─── helpers ──────────────────────────────────────────────────────────────────

function get(row: Row, colId: string | undefined): string {
  if (!colId) return '';
  const v = row[colId];
  return v == null ? '' : String(v);
}

function statusColorKey(statusColorMap: Record<string, string>, val: string): string {
  return statusColorMap[val] ?? 'default';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-[11px]';
  return (
    <div className={cn('rounded-lg flex items-center justify-center font-semibold flex-shrink-0', sz, avatarColor(name))}>
      {initials(name)}
    </div>
  );
}

function NavItem({
  icon, label, active, badge, badgeRed, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean;
  badge?: number; badgeRed?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-colors',
        active
          ? 'bg-indigo-50 text-indigo-900 font-semibold dark:bg-indigo-950 dark:text-indigo-200'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
      )}
    >
      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-semibold min-w-[20px] text-center',
          badgeRed ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white')}>
          {badge}
        </span>
      )}
    </button>
  );
}

function KpiCard({ label, value, sub, onClick }: {
  label: string; value: number | string; sub?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      <div className="text-[11px] text-slate-400 mb-1.5 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-semibold text-slate-900 dark:text-slate-50 leading-none tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1.5">{sub}</div>}
    </button>
  );
}

function ChartBar({ label, value, max, color }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5 mb-2.5 last:mb-0">
      <div className="text-[12px] text-slate-500 w-28 flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color ?? 'bg-indigo-500')} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[12px] text-slate-500 w-6 text-right font-medium">{value}</div>
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

function DashboardView({
  rows, bindings, colorMaps, onTicketClick, onClientClick,
}: { rows: Row[]; bindings: AppConfig['bindings']; colorMaps: AppConfig['colorMaps']; onTicketClick: (r: Row) => void; onClientClick: (c: string) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const statusMap = colorMaps.status ?? {};
  const priorityMap = colorMaps.priority ?? {};

  const urgentCount = rows.filter(r => {
    const p = get(r, bindings.priority).toUpperCase();
    return p === 'URGENTE' || p === 'URGENT';
  }).length;

  const dueSoon = rows.filter(r => {
    const d = daysUntil(get(r, bindings.deadline));
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const overdue = rows.filter(r => {
    const d = daysUntil(get(r, bindings.deadline));
    return d !== null && d < 0;
  }).length;

  // Area breakdown
  const byArea: Record<string, number> = {};
  for (const r of rows) {
    const a = get(r, bindings.area) || 'Sin área';
    byArea[a] = (byArea[a] ?? 0) + 1;
  }
  const areaMax = Math.max(...Object.values(byArea), 1);

  // Client breakdown
  const byClient: Record<string, number> = {};
  for (const r of rows) {
    const c = get(r, bindings.client) || 'Sin cliente';
    byClient[c] = (byClient[c] ?? 0) + 1;
  }
  const topClients = Object.entries(byClient).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Upcoming deadlines
  const upcoming = [...rows]
    .filter(r => get(r, bindings.deadline))
    .sort((a, b) => {
      const da = daysUntil(get(a, bindings.deadline)) ?? 9999;
      const db = daysUntil(get(b, bindings.deadline)) ?? 9999;
      return da - db;
    })
    .slice(0, 5);

  // Urgent tickets
  const urgentRows = rows
    .filter(r => {
      const p = get(r, bindings.priority).toUpperCase();
      return p === 'URGENTE' || p === 'URGENT';
    })
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total tickets" value={rows.length} />
        <KpiCard label="Urgentes" value={urgentCount} sub="Prioridad máxima" />
        <KpiCard label="Vencen esta semana" value={dueSoon} sub="Próximos 7 días" />
        <KpiCard label="Vencidos" value={overdue} sub="Fecha límite pasada" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">Plazos próximos</span>
            <button className="text-[12px] text-indigo-600 hover:underline">Ver todos →</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-[13px] text-slate-400 py-4 text-center">Sin plazos registrados</div>
          ) : upcoming.map((r, i) => {
            const d = daysUntil(get(r, bindings.deadline));
            const overdue = d !== null && d < 0;
            const color = overdue ? 'bg-rose-500' : d !== null && d <= 3 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div key={i} onClick={() => onTicketClick(r)}
                className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-1 px-1 rounded">
                <div className={cn('w-2 h-2 rounded-full mt-[5px] flex-shrink-0', color)} />
                <div>
                  <div className="text-[13px] text-slate-900 dark:text-slate-100 leading-snug">{truncate(get(r, bindings.description), 52)}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {get(r, bindings.client)} · {overdue ? `Venció hace ${Math.abs(d!)} días` : `${d} día${d !== 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">Tickets urgentes</span>
          </div>
          {urgentRows.length === 0 ? (
            <div className="text-[13px] text-slate-400 py-4 text-center">Sin tickets urgentes</div>
          ) : urgentRows.map((r, i) => {
            const statusKey = statusMap[get(r, bindings.status)] ?? 'default';
            const { bg, text } = COLOR_CLASSES[statusKey] ?? COLOR_CLASSES.default;
            return (
              <div key={i} onClick={() => onTicketClick(r)}
                className="flex items-center gap-3 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-1 px-1 rounded">
                <Avatar name={get(r, bindings.client)} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">{truncate(get(r, bindings.description), 44)}</div>
                  <div className="text-[11px] text-slate-400">{get(r, bindings.client)}</div>
                </div>
                <Badge value={get(r, bindings.status)} colorKey={statusKey} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-3">Pendientes por área</div>
          {Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
            <ChartBar key={area} label={area} value={count} max={areaMax} />
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-3">Top clientes activos</div>
          {topClients.map(([client, count]) => (
            <div key={client} onClick={() => onClientClick(client)}
              className="flex items-center gap-3 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-1 px-1 rounded">
              <Avatar name={client} size="sm" />
              <div className="flex-1 text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">{client}</div>
              <div className="text-[12px] text-slate-400 font-medium">{count} tickets</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TicketsView({
  rows, bindings, colorMaps, onTicketClick, search,
}: { rows: Row[]; bindings: AppConfig['bindings']; colorMaps: AppConfig['colorMaps']; onTicketClick: (r: Row) => void; search: string }) {
  const [filter, setFilter] = useState<string>('all');
  const priorityMap = colorMaps.priority ?? {};
  const statusMap = colorMaps.status ?? {};

  const priorities = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'];

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== 'all' && get(r, bindings.priority).toUpperCase() !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return Object.values(r).some(v => v != null && String(v).toLowerCase().includes(q));
      }
      return true;
    });
  }, [rows, filter, search, bindings]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">Todos los tickets</span>
        <div className="flex gap-2">
          {['all', ...priorities].map(p => (
            <button key={p} onClick={() => setFilter(p)}
              className={cn('px-3 py-1 rounded-full text-[12px] border transition-colors',
                filter === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-black/10 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700')}>
              {p === 'all' ? 'Todos' : p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-10">N°</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-36">Cliente</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Asunto</th>
              {bindings.area && <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">Área</th>}
              {bindings.assignee && <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">Responsable</th>}
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-28">Estado</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Sin resultados</td></tr>
            )}
            {filtered.map((r, i) => {
              const statusKey = statusMap[get(r, bindings.status)] ?? 'default';
              const priorityKey = priorityMap[get(r, bindings.priority)] ?? 'default';
              return (
                <tr key={i} onClick={() => onTicketClick(r)}
                  className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[12px]">{get(r, bindings.identifier) || String(i + 1)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={get(r, bindings.client)} size="sm" />
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200 max-w-[120px]">{get(r, bindings.client)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs">
                    <div className="truncate">{truncate(get(r, bindings.description), 60)}</div>
                  </td>
                  {bindings.area && <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{get(r, bindings.area)}</td>}
                  {bindings.assignee && <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{get(r, bindings.assignee)}</td>}
                  <td className="px-4 py-3"><Badge value={get(r, bindings.status)} colorKey={statusKey} /></td>
                  <td className="px-4 py-3"><Badge value={get(r, bindings.priority)} colorKey={priorityKey} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeadlinesView({ rows, bindings, colorMaps, onTicketClick }: {
  rows: Row[]; bindings: AppConfig['bindings']; colorMaps: AppConfig['colorMaps']; onTicketClick: (r: Row) => void;
}) {
  const statusMap = colorMaps.status ?? {};
  const priorityMap = colorMaps.priority ?? {};
  const sorted = [...rows]
    .filter(r => get(r, bindings.deadline))
    .sort((a, b) => {
      const da = daysUntil(get(a, bindings.deadline)) ?? 9999;
      const db = daysUntil(get(b, bindings.deadline)) ?? 9999;
      return da - db;
    });

  return (
    <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">Plazos por fecha límite</span>
      </div>
      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {sorted.map((r, i) => {
          const d = daysUntil(get(r, bindings.deadline));
          const isOverdue = d !== null && d < 0;
          const isSoon = d !== null && d >= 0 && d <= 3;
          const dotColor = isOverdue ? 'bg-rose-500' : isSoon ? 'bg-amber-500' : 'bg-emerald-500';
          const statusKey = statusMap[get(r, bindings.status)] ?? 'default';
          const priorityKey = priorityMap[get(r, bindings.priority)] ?? 'default';
          return (
            <div key={i} onClick={() => onTicketClick(r)}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors">
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor)} />
              <Avatar name={get(r, bindings.client)} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{truncate(get(r, bindings.description), 55)}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{get(r, bindings.client)} · {get(r, bindings.area)}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge value={get(r, bindings.status)} colorKey={statusKey} />
                <Badge value={get(r, bindings.priority)} colorKey={priorityKey} />
                <div className={cn('text-[12px] font-medium w-24 text-right',
                  isOverdue ? 'text-rose-600' : isSoon ? 'text-amber-600' : 'text-slate-400')}>
                  {isOverdue ? `Venció hace ${Math.abs(d!)}d` : d === 0 ? 'Hoy' : `En ${d}d`}
                </div>
                <div className="text-[12px] text-slate-400 w-24 text-right">{fmtDate(get(r, bindings.deadline))}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientesView({ rows, bindings, colorMaps, onClientClick }: {
  rows: Row[]; bindings: AppConfig['bindings']; colorMaps: AppConfig['colorMaps']; onClientClick: (c: string) => void;
}) {
  const priorityMap = colorMaps.priority ?? {};
  const byClient: Record<string, Row[]> = {};
  for (const r of rows) {
    const c = get(r, bindings.client) || 'Sin cliente';
    if (!byClient[c]) byClient[c] = [];
    byClient[c].push(r);
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">Clientes</span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-20">Tickets</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-20">Urgentes</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Áreas</th>
            <th className="px-4 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {Object.entries(byClient).sort((a, b) => b[1].length - a[1].length).map(([client, clientRows]) => {
            const urgent = clientRows.filter(r => get(r, bindings.priority).toUpperCase() === 'URGENTE').length;
            const areas = [...new Set(clientRows.map(r => get(r, bindings.area)).filter(Boolean))].slice(0, 3);
            return (
              <tr key={client} onClick={() => onClientClick(client)}
                className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={client} />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{client}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{clientRows.length}</td>
                <td className="px-4 py-3">
                  {urgent > 0 ? <Badge value={String(urgent)} colorKey="rose" /> : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {areas.map(a => <Badge key={a} value={a} colorKey="indigo" />)}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">›</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EquipoView({ rows, bindings, colorMaps }: { rows: Row[]; bindings: AppConfig['bindings']; colorMaps: AppConfig['colorMaps'] }) {
  const priorityMap = colorMaps.priority ?? {};
  const byPerson: Record<string, Row[]> = {};
  for (const r of rows) {
    const p = get(r, bindings.assignee) || 'Sin asignar';
    if (!byPerson[p]) byPerson[p] = [];
    byPerson[p].push(r);
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">Carga del equipo</span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-40">Miembro</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-28">Asignados</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">Urgentes</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Distribución por área</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byPerson).sort((a, b) => b[1].length - a[1].length).map(([person, personRows]) => {
            const urgent = personRows.filter(r => get(r, bindings.priority).toUpperCase() === 'URGENTE').length;
            const byArea: Record<string, number> = {};
            for (const r of personRows) {
              const a = get(r, bindings.area) || 'Otro';
              byArea[a] = (byArea[a] ?? 0) + 1;
            }
            return (
              <tr key={person} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={person} />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{person}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{personRows.length}</td>
                <td className="px-4 py-3">
                  {urgent > 0 ? <Badge value={String(urgent)} colorKey="rose" /> : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(byArea).map(([area, cnt]) => (
                      <Badge key={area} value={`${area} (${cnt})`} colorKey="indigo" />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AreasView({ rows, bindings, colorMaps }: { rows: Row[]; bindings: AppConfig['bindings']; colorMaps: AppConfig['colorMaps'] }) {
  const byCarpeta: Record<string, number> = {};
  const byArea: Record<string, number> = {};
  const carpetaColId = Object.keys(rows[0] ?? {}).find(k => k.includes('carpeta')) ?? 'carpeta';
  for (const r of rows) {
    const carpetaVal = get(r, carpetaColId);
    const areaVal = get(r, bindings.area) || 'Sin área';
    if (carpetaVal) byCarpeta[carpetaVal] = (byCarpeta[carpetaVal] ?? 0) + 1;
    byArea[areaVal] = (byArea[areaVal] ?? 0) + 1;
  }
  const maxC = Math.max(...Object.values(byCarpeta), 1);
  const maxA = Math.max(...Object.values(byArea), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
        <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-4">Distribución por Carpeta</div>
        {Object.entries(byCarpeta).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <ChartBar key={k} label={k} value={v} max={maxC} />
        ))}
      </div>
      <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
        <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-4">Distribución por Área (Equipo)</div>
        {Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <ChartBar key={k} label={k} value={v} max={maxA} color="bg-emerald-500" />
        ))}
      </div>
    </div>
  );
}

function TicketDetailView({ row, bindings, colorMaps, onBack }: {
  row: Row; bindings: AppConfig['bindings']; colorMaps: AppConfig['colorMaps']; onBack: () => void;
}) {
  const statusMap = colorMaps.status ?? {};
  const priorityMap = colorMaps.priority ?? {};
  const statusKey = statusMap[get(row, bindings.status)] ?? 'default';
  const priorityKey = priorityMap[get(row, bindings.priority)] ?? 'default';
  const link = get(row, bindings.link);

  // Parse procedure steps
  const procText = get(row, bindings.procedimiento);
  const steps = procText ? procText.split('\n').filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 w-fit">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Volver
      </button>

      <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge value={get(row, bindings.client)} colorKey="indigo" />
          {bindings.area && <Badge value={get(row, bindings.area)} colorKey="violet" />}
          <Badge value={get(row, bindings.status)} colorKey={statusKey} />
          <Badge value={get(row, bindings.priority)} colorKey={priorityKey} />
        </div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1.5 leading-snug whitespace-pre-wrap">
          {get(row, bindings.description)}
        </div>
        <div className="text-[12px] text-slate-400">
          Ticket #{get(row, bindings.identifier) || '—'} · {get(row, bindings.area) || 'Sin área'}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
          {[
            { label: 'Solicitud', val: fmtDate(get(row, bindings.created)) },
            { label: 'Fecha límite', val: fmtDate(get(row, bindings.deadline)) },
            { label: 'Modalidad', val: get(row, bindings.horario) || '—' },
            { label: 'Responsable', val: get(row, bindings.assignee) },
          ].map(({ label, val }) => (
            <div key={label} className="border-r border-black/[0.06] dark:border-white/[0.06] last:border-0 pr-4 last:pr-0">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</div>
              {label === 'Responsable' ? (
                <div className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0', avatarColor(val))}>
                    {initials(val)}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{val || '—'}</span>
                </div>
              ) : (
                <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{val || '—'}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-3">Hechos</div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3.5 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {get(row, bindings.hechos) || '—'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-3">Procedimiento</div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3.5 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {get(row, bindings.procedimiento) || '—'}
          </div>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-3">Pasos</div>
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="text-[13px] text-slate-700 dark:text-slate-300 leading-snug">{step.replace(/^\d+\.\s*/, '')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-3">Referencia técnica</div>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer"
              className="text-indigo-600 hover:underline break-all text-[13px]">{link}</a>
          ) : (
            <span className="text-slate-400 text-[13px]">—</span>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50 mb-3">Observaciones</div>
          <div className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {get(row, bindings.notes) || '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetailView({ client, rows, bindings, colorMaps, onBack, onTicketClick }: {
  client: string; rows: Row[]; bindings: AppConfig['bindings'];
  colorMaps: AppConfig['colorMaps']; onBack: () => void; onTicketClick: (r: Row) => void;
}) {
  const statusMap = colorMaps.status ?? {};
  const priorityMap = colorMaps.priority ?? {};
  const clientRows = rows.filter(r => get(r, bindings.client) === client);

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 w-fit">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Volver a clientes
      </button>

      <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <Avatar name={client} size="lg" />
          <div>
            <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">{client}</div>
            <div className="text-[13px] text-slate-400">{clientRows.length} tickets activos</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">Tickets de este cliente</span>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-10">N°</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Asunto</th>
              {bindings.area && <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">Carpeta</th>}
              {bindings.assignee && <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-28">Responsable</th>}
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-28">Estado</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {clientRows.map((r, i) => {
              const statusKey = statusMap[get(r, bindings.status)] ?? 'default';
              const priorityKey = priorityMap[get(r, bindings.priority)] ?? 'default';
              return (
                <tr key={i} onClick={() => onTicketClick(r)}
                  className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[12px]">{get(r, bindings.identifier) || String(i + 1)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs">
                    <div className="truncate">{truncate(get(r, bindings.description), 60)}</div>
                  </td>
                  {bindings.area && <td className="px-4 py-3 text-slate-500">{get(r, bindings.area)}</td>}
                  {bindings.assignee && <td className="px-4 py-3 text-slate-500">{get(r, bindings.assignee)}</td>}
                  <td className="px-4 py-3"><Badge value={get(r, bindings.status)} colorKey={statusKey} /></td>
                  <td className="px-4 py-3"><Badge value={get(r, bindings.priority)} colorKey={priorityKey} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

const Icons = {
  dashboard: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/><rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".8"/></svg>,
  clients:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 12c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  tickets:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  deadlines: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  team:      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 12c0-2 1.8-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10.5 9c1.5 0 2.5.8 2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  areas:     <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l5-2.5L12 4v6L7 12.5 2 10V4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 1.5v11M2 4l5 2.5L12 4" stroke="currentColor" strokeWidth="1.2"/></svg>,
  code:      <svg viewBox="0 0 18 18" fill="none"><path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── Main Template ────────────────────────────────────────────────────────────

type ViewId = 'dashboard' | 'clientes' | 'tickets' | 'deadlines' | 'equipo' | 'areas' | 'ticket-detail' | 'cliente-detalle';

const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  tickets: 'Tickets',
  deadlines: 'Plazos y vencimientos',
  equipo: 'Equipo',
  areas: 'Distribución por áreas',
  'ticket-detail': 'Detalle del ticket',
  'cliente-detalle': 'Detalle del cliente',
};

interface Props {
  config: AppConfig;
  fileName: string | null;
  onReset: () => void;
}

export function DevSprintTemplate({ config, fileName, onReset }: Props) {
  const { schema, bindings, colorMaps, branding, rows } = config;
  const [view, setView] = useState<ViewId>('dashboard');
  const [prevView, setPrevView] = useState<ViewId>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<Row | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  function goTo(v: ViewId) {
    if (v !== 'ticket-detail' && v !== 'cliente-detalle') setPrevView(v);
    setView(v);
  }

  function openTicket(r: Row) {
    setSelectedTicket(r);
    goTo('ticket-detail');
  }

  function openClient(c: string) {
    setSelectedClient(c);
    goTo('cliente-detalle');
  }

  const urgentCount = rows.filter(r => get(r, bindings.priority)?.toUpperCase() === 'URGENTE').length;
  const overdueCount = rows.filter(r => {
    const d = daysUntil(get(r, bindings.deadline));
    return d !== null && d < 0;
  }).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-56 min-w-56 bg-white dark:bg-slate-800 border-r border-black/[0.08] dark:border-white/[0.08] flex flex-col">
        <div className="px-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm mb-2">
            {Icons.code}
          </div>
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">{branding.name}</div>
          <div className="text-[11px] text-slate-400">{schema.sheetName ?? 'Sprint Backlog'}</div>
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          <div className="text-[10px] text-slate-400 px-2 pt-3 pb-1 uppercase tracking-widest font-semibold">Principal</div>
          <NavItem icon={Icons.dashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => goTo('dashboard')} />
          <NavItem icon={Icons.clients} label="Clientes" active={view === 'clientes' || view === 'cliente-detalle'}
            badge={[...new Set(rows.map(r => get(r, bindings.client)).filter(Boolean))].length} onClick={() => goTo('clientes')} />
          <NavItem icon={Icons.tickets} label="Tickets" active={view === 'tickets' || view === 'ticket-detail'}
            badge={rows.length} onClick={() => goTo('tickets')} />
          <NavItem icon={Icons.deadlines} label="Plazos" active={view === 'deadlines'}
            badge={overdueCount > 0 ? overdueCount : undefined} badgeRed onClick={() => goTo('deadlines')} />

          <div className="text-[10px] text-slate-400 px-2 pt-3 pb-1 uppercase tracking-widest font-semibold">Gestión</div>
          <NavItem icon={Icons.team} label="Equipo" active={view === 'equipo'} onClick={() => goTo('equipo')} />
          <NavItem icon={Icons.areas} label="Áreas" active={view === 'areas'} onClick={() => goTo('areas')} />
        </nav>

        <div className="p-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <div className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate text-[12px]">{fileName ?? 'Datos cargados'}</span>
            </div>
            <div className="text-slate-400 mt-0.5">{rows.length} registros</div>
          </div>
          <button onClick={onReset}
            className="w-full text-left px-2.5 py-2 rounded-lg text-[11px] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-600 transition-colors">
            ↩ Cargar otro XLSX
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-14 bg-white dark:bg-slate-800 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center px-5 gap-3 flex-shrink-0">
          <div className="flex-1 text-[15px] font-semibold text-slate-900 dark:text-slate-50">{VIEW_LABELS[view]}</div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-3 py-1.5 w-52">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#94a3b8" strokeWidth="1.3"/><path d="M9 9l2.5 2.5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tickets, clientes…"
              className="bg-transparent text-[13px] text-slate-900 dark:text-slate-100 outline-none w-full placeholder:text-slate-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === 'dashboard' && (
            <DashboardView rows={rows} bindings={bindings} colorMaps={colorMaps}
              onTicketClick={openTicket} onClientClick={openClient} />
          )}
          {view === 'clientes' && (
            <ClientesView rows={rows} bindings={bindings} colorMaps={colorMaps} onClientClick={openClient} />
          )}
          {view === 'tickets' && (
            <TicketsView rows={rows} bindings={bindings} colorMaps={colorMaps}
              onTicketClick={openTicket} search={search} />
          )}
          {view === 'deadlines' && (
            <DeadlinesView rows={rows} bindings={bindings} colorMaps={colorMaps} onTicketClick={openTicket} />
          )}
          {view === 'equipo' && (
            <EquipoView rows={rows} bindings={bindings} colorMaps={colorMaps} />
          )}
          {view === 'areas' && (
            <AreasView rows={rows} bindings={bindings} colorMaps={colorMaps} />
          )}
          {view === 'ticket-detail' && selectedTicket && (
            <TicketDetailView row={selectedTicket} bindings={bindings} colorMaps={colorMaps}
              onBack={() => goTo(prevView)} />
          )}
          {view === 'cliente-detalle' && selectedClient && (
            <ClientDetailView client={selectedClient} rows={rows} bindings={bindings} colorMaps={colorMaps}
              onBack={() => goTo('clientes')} onTicketClick={openTicket} />
          )}
        </div>
      </div>
    </div>
  );
}

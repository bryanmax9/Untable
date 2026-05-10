const SEMANTIC_COLORS: Record<string, string[]> = {
  positive: ['done', 'completo', 'listo', 'finalizado', 'aprobado', 'won', 'closed', 'completed'],
  negative: ['cancelled', 'cancelado', 'rejected', 'rechazado', 'lost', 'overdue', 'vencido'],
  warning:  ['urgente', 'urgent', 'high', 'alta', 'critical', 'crítico'],
  inProgress: ['en progreso', 'in progress', 'doing', 'activo', 'open', 'abierto', 'en proceso', 'proceso'],
  pending:  ['pendiente', 'pending', 'todo', 'esperando', 'waiting'],
  media:    ['media', 'medium', 'normal'],
  baja:     ['baja', 'low', 'minor'],
};

const PALETTE: Record<string, string> = {
  positive: 'emerald',
  negative: 'rose',
  warning:  'rose',
  inProgress: 'sky',
  pending:  'amber',
  media:    'indigo',
  baja:     'slate',
  default:  'slate',
};

export function assignColors(enumValues: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const val of enumValues) {
    const norm = val.toLowerCase().trim();
    let assigned = 'default';
    for (const [category, terms] of Object.entries(SEMANTIC_COLORS)) {
      if (terms.some(t => norm.includes(t))) { assigned = category; break; }
    }
    result[val] = PALETTE[assigned] ?? PALETTE.default;
  }
  return result;
}

export const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950',  text: 'text-emerald-800 dark:text-emerald-200' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-950',          text: 'text-sky-800 dark:text-sky-200' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950',      text: 'text-amber-800 dark:text-amber-200' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950',        text: 'text-rose-800 dark:text-rose-200' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950',    text: 'text-indigo-800 dark:text-indigo-200' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950',    text: 'text-violet-800 dark:text-violet-200' },
  slate:   { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-700 dark:text-slate-300' },
  default: { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-700 dark:text-slate-300' },
};

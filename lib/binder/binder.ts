import type { Schema, Column, DomainId, Bindings } from '../types';
import type { SemanticRole } from '../types';
import { assignColors } from './colors';

interface TemplateSlot {
  role: SemanticRole | string;
  required: boolean;
  fallback?: 'firstEnum' | 'firstDate' | 'firstText' | 'firstNumber';
}

const TEMPLATE_SLOTS: Record<DomainId, TemplateSlot[]> = {
  dev_sprint: [
    { role: 'identifier', required: false, fallback: 'firstText' },
    { role: 'client',     required: true,  fallback: 'firstText' },
    { role: 'status',     required: true,  fallback: 'firstEnum' },
    { role: 'priority',   required: false, fallback: 'firstEnum' },
    { role: 'assignee',   required: false, fallback: 'firstText' },
    { role: 'deadline',   required: false, fallback: 'firstDate' },
    { role: 'description',required: false, fallback: 'firstText' },
    { role: 'notes',      required: false },
    { role: 'link',       required: false },
    { role: 'area',       required: false, fallback: 'firstEnum' },
    { role: 'action',     required: false, fallback: 'firstEnum' },
    { role: 'pm',         required: false, fallback: 'firstText' },
  ],
  legal_pendings: [
    { role: 'identifier',  required: true,  fallback: 'firstText' },
    { role: 'client',      required: true,  fallback: 'firstText' },
    { role: 'status',      required: true,  fallback: 'firstEnum' },
    { role: 'priority',    required: false, fallback: 'firstEnum' },
    { role: 'assignee',    required: false, fallback: 'firstText' },
    { role: 'deadline',    required: false, fallback: 'firstDate' },
    { role: 'description', required: false, fallback: 'firstText' },
    { role: 'area',        required: false, fallback: 'firstEnum' },
    { role: 'action',      required: false, fallback: 'firstEnum' },
    { role: 'link',        required: false },
    { role: 'pm',          required: false, fallback: 'firstText' },
    { role: 'notes',       required: false },
  ],
  sales_pipeline: [
    { role: 'client',     required: true, fallback: 'firstText' },
    { role: 'status',     required: true, fallback: 'firstEnum' },
    { role: 'priority',   required: false, fallback: 'firstEnum' },
    { role: 'assignee',   required: false, fallback: 'firstText' },
    { role: 'deadline',   required: false, fallback: 'firstDate' },
    { role: 'description',required: false, fallback: 'firstText' },
  ],
  inventory: [
    { role: 'identifier', required: true, fallback: 'firstText' },
    { role: 'description',required: false, fallback: 'firstText' },
    { role: 'status',     required: false, fallback: 'firstEnum' },
    { role: 'notes',      required: false },
  ],
  clinic_patients: [
    { role: 'client',     required: true, fallback: 'firstText' },
    { role: 'status',     required: false, fallback: 'firstEnum' },
    { role: 'assignee',   required: false, fallback: 'firstText' },
    { role: 'deadline',   required: false, fallback: 'firstDate' },
    { role: 'notes',      required: false },
  ],
  hr_roster: [
    { role: 'client',     required: true, fallback: 'firstText' },
    { role: 'status',     required: false, fallback: 'firstEnum' },
    { role: 'description',required: false, fallback: 'firstText' },
    { role: 'notes',      required: false },
  ],
  generic_table: [],
};

function findByRole(columns: Column[], role: string, used: Set<string>): Column | undefined {
  return columns.find(c => c.semanticRole === role && !used.has(c.id));
}

function findFallback(columns: Column[], kind: string, used: Set<string>): Column | undefined {
  switch (kind) {
    case 'firstEnum':   return columns.find(c => c.type === 'enum'   && !used.has(c.id));
    case 'firstDate':   return columns.find(c => c.type === 'date'   && !used.has(c.id));
    case 'firstText':   return columns.find(c => c.type === 'text'   && !used.has(c.id));
    case 'firstNumber': return columns.find(c => c.type === 'number' && !used.has(c.id));
    default: return undefined;
  }
}

// Extra raw column bindings: find a column whose id contains the partial string
const DEV_SPRINT_EXTRA: Record<string, string[]> = {
  hechos:        ['hechos'],
  procedimiento: ['procedimiento'],
  horario:       ['horario'],
  fecha_actual:  ['fecha_actual'],
};

export function bindColumns(schema: Schema, domain: DomainId): Bindings {
  const slots = TEMPLATE_SLOTS[domain] ?? [];
  const bindings: Bindings = {};
  const used = new Set<string>();

  for (const slot of slots) {
    const match = findByRole(schema.columns, slot.role, used);
    if (match) { bindings[slot.role] = match.id; used.add(match.id); continue; }
    if (slot.fallback) {
      const fb = findFallback(schema.columns, slot.fallback, used);
      if (fb) { bindings[slot.role] = fb.id; used.add(fb.id); }
    }
  }

  // Add raw column bindings for known extra fields
  if (domain === 'dev_sprint') {
    for (const [key, partials] of Object.entries(DEV_SPRINT_EXTRA)) {
      if (bindings[key]) continue;
      for (const partial of partials) {
        const col = schema.columns.find(c => c.id.includes(partial));
        if (col) { bindings[key] = col.id; break; }
      }
    }
  }

  return bindings;
}

export function buildColorMaps(
  schema: Schema,
  bindings: Bindings
): Record<string, Record<string, string>> {
  const maps: Record<string, Record<string, string>> = {};
  for (const role of ['status', 'priority', 'action', 'area']) {
    const colId = bindings[role];
    if (!colId) continue;
    const col = schema.columns.find(c => c.id === colId);
    if (col?.options) maps[role] = assignColors(col.options);
  }
  return maps;
}

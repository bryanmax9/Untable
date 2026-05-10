import type { DomainId } from '../types';

interface DomainFingerprint {
  id: DomainId;
  required: string[];
  strong: string[];
  medium: string[];
  weak: string[];
  forbid: string[];
}

const FINGERPRINTS: DomainFingerprint[] = [
  {
    id: 'dev_sprint',
    required: ['cliente', 'responsable', 'estado'],
    strong: ['carpeta', 'área', 'area', 'acción', 'accion', 'procedimiento', 'hechos',
             'desarrollo', 'devops', 'engineering', 'sprint', 'ticket'],
    medium: ['asunto', 'prioridad', 'fecha límite', 'link', 'observaciones', 'responsable pm'],
    weak: ['horario', 'descripción'],
    forbid: ['expediente', 'paciente', 'sku', 'inventario', 'lead', 'opportunity']
  },
  {
    id: 'legal_pendings',
    required: ['expediente', 'caso', 'arbitraje', 'judicial', 'demanda', 'cliente'],
    strong: ['expediente', 'arbitraje', 'demanda', 'audiencia', 'sentencia',
             'fiscal', 'juzgado', 'sunafil', 'denuncia', 'carpeta'],
    medium: ['cliente', 'responsable', 'estado', 'plazo', 'fecha límite',
             'procedimiento', 'hechos'],
    weak: ['observaciones', 'prioridad'],
    forbid: ['sku', 'inventario', 'invoice', 'paciente', 'área', 'area', 'devops']
  },
  {
    id: 'sales_pipeline',
    required: ['lead', 'opportunity', 'deal', 'prospect', 'oportunidad', 'pipeline'],
    strong: ['amount', 'monto', 'stage', 'etapa', 'close date', 'won', 'lost'],
    medium: ['contact', 'company', 'owner', 'rep', 'source'],
    weak: ['notes', 'email', 'phone'],
    forbid: ['expediente', 'paciente', 'sku', 'carpeta']
  },
  {
    id: 'inventory',
    required: ['sku', 'producto', 'stock', 'almacén'],
    strong: ['sku', 'stock', 'precio', 'proveedor', 'inventario', 'cantidad'],
    medium: ['código', 'descripción', 'categoría', 'unidad'],
    weak: ['observaciones', 'fecha'],
    forbid: ['expediente', 'paciente', 'lead', 'cliente']
  },
  {
    id: 'clinic_patients',
    required: ['paciente', 'historia clínica', 'cita', 'diagnóstico', 'médico'],
    strong: ['paciente', 'diagnóstico', 'médico', 'cita', 'historia'],
    medium: ['fecha', 'tratamiento', 'estado'],
    weak: ['observaciones'],
    forbid: ['sku', 'lead', 'expediente']
  },
  {
    id: 'hr_roster',
    required: ['empleado', 'puesto', 'salario', 'fecha ingreso'],
    strong: ['empleado', 'salario', 'puesto', 'departamento', 'contrato'],
    medium: ['fecha ingreso', 'estado', 'jefe'],
    weak: ['observaciones'],
    forbid: ['sku', 'lead', 'paciente']
  }
];

export function classifyDomain(headers: string[]): { domain: DomainId; confidence: number } {
  const normalized = headers.map(h => h.toLowerCase().trim());
  const text = normalized.join(' ');

  const scores = FINGERPRINTS.map(fp => {
    if (fp.forbid.some(f => text.includes(f))) return { id: fp.id, score: 0 };
    if (!fp.required.some(r => normalized.some(h => h.includes(r)))) {
      return { id: fp.id, score: 0 };
    }

    let score = 0;
    for (const h of normalized) {
      if (fp.strong.some(k => h.includes(k))) score += 3;
      else if (fp.medium.some(k => h.includes(k))) score += 2;
      else if (fp.weak.some(k => h.includes(k))) score += 1;
    }

    const maxPossible = fp.strong.length * 3 + fp.medium.length * 2 + fp.weak.length;
    return { id: fp.id, score: score / maxPossible };
  });

  const winner = [...scores].sort((a, b) => b.score - a.score)[0];
  if (!winner || winner.score < 0.2) return { domain: 'generic_table', confidence: 0 };
  return { domain: winner.id as DomainId, confidence: Math.round(winner.score * 100) / 100 };
}

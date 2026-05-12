import type { SemanticRole } from '../types';

const PATTERNS: [SemanticRole, RegExp[]][] = [
  ['identifier',   [/expediente/i, /n[°º]/i, /^id$/i, /ticket/i, /caso/i, /^n°/i, /^n$/i]],
  ['client',       [/cliente/i, /customer/i, /client/i, /empresa/i, /company/i]],
  ['status',       [/estado/i, /status/i, /state/i, /situaci[oó]n/i]],
  ['priority',     [/prioridad/i, /priority/i, /urgenc/i]],
  ['assignee',     [/^responsable$/i, /assigned/i, /owner/i, /encargado/i, /asignad/i]],
  ['pm',           [/responsable pm/i, /pm$/i, /project manager/i, /responsable cali/i, /calité/i, /calite/i]],
  ['deadline',     [/fecha l[ií]mite/i, /deadline/i, /vencimiento/i, /due/i, /plazo/i]],
  ['created',      [/fecha de solicitud/i, /created/i, /fecha de creaci[oó]n/i, /fecha solicitud/i]],
  ['description',  [/descripci[oó]n/i, /description/i, /asunto/i, /servicio/i]],
  ['notes',        [/observaciones/i, /notes/i, /comentarios/i, /comments/i]],
  ['link',         [/^link$/i, /^url$/i, /enlace/i, /referencia/i]],
  ['area',         [/^area$/i, /^área$/i, /department/i, /departamento/i, /equipo/i]],
  ['action',       [/^accion$/i, /^acci[oó]n$/i, /action/i]],
];

export function detectSemanticRole(header: string): SemanticRole | null {
  for (const [role, patterns] of PATTERNS) {
    if (patterns.some(p => p.test(header.trim()))) return role;
  }
  return null;
}

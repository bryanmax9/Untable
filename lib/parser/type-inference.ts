export type ColumnType =
  | 'text' | 'longtext' | 'number' | 'currency'
  | 'date' | 'boolean' | 'enum' | 'url' | 'email' | 'phone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//;
const PHONE_RE = /^\+?[\d\s\-().]{7,}$/;
const BOOL_VALUES = new Set(['true','false','yes','no','sí','si','no','verdadero','falso','1','0']);

// Detect Excel serial date (number like 45000)
function isExcelSerial(v: unknown): boolean {
  return typeof v === 'number' && v > 25569 && v < 60000;
}

function isDateObj(v: unknown): boolean {
  return v instanceof Date && !isNaN(v.getTime());
}

function allMatch(samples: unknown[], test: (v: unknown) => boolean): boolean {
  return samples.length > 0 && samples.every(test);
}

export function inferColumnType(values: unknown[]): ColumnType {
  const nonEmpty = values.filter(v => v != null && v !== '');
  if (nonEmpty.length === 0) return 'text';

  const samples = nonEmpty.slice(0, 100);

  if (allMatch(samples, isDateObj) || allMatch(samples, isExcelSerial)) return 'date';

  const strings = samples.map(String);

  if (allMatch(strings, (v: unknown) => EMAIL_RE.test(String(v)))) return 'email';
  if (allMatch(strings, (v: unknown) => URL_RE.test(String(v)))) return 'url';
  if (allMatch(strings, (v: unknown) => PHONE_RE.test(String(v)) && !/\s{2,}/.test(String(v)))) return 'phone';
  if (allMatch(samples, (v: unknown) => typeof v === 'number' || !isNaN(Number(v)))) return 'number';
  if (allMatch(strings, (v: unknown) => BOOL_VALUES.has(String(v).toLowerCase()))) return 'boolean';

  const unique = new Set(strings);
  const ratio = unique.size / strings.length;
  if (ratio < 0.15 && unique.size <= 25) return 'enum';

  const avgLen = strings.reduce((a, v) => a + v.length, 0) / strings.length;
  if (avgLen > 80) return 'longtext';

  return 'text';
}

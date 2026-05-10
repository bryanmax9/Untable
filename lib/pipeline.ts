'use client';
import { parseExcelBuffer } from './parser/excel';
import { classifyDomain } from './classifier/domain';
import { bindColumns, buildColorMaps } from './binder/binder';
import type { AppConfig } from './types';

const DOMAIN_BRANDING: Record<string, { name: string; primaryColor: string }> = {
  dev_sprint:      { name: 'Dev Tracker',    primaryColor: '#4F46E5' },
  legal_pendings:  { name: 'Legal Tracker',  primaryColor: '#3C3489' },
  sales_pipeline:  { name: 'Sales CRM',      primaryColor: '#0F6E56' },
  inventory:       { name: 'Inventario',     primaryColor: '#B45309' },
  clinic_patients: { name: 'Clínica',        primaryColor: '#0369A1' },
  hr_roster:       { name: 'Equipo',         primaryColor: '#6D28D9' },
  generic_table:   { name: 'Data App',       primaryColor: '#534AB7' },
};

export async function processExcelFile(file: File): Promise<AppConfig> {
  const buffer = await file.arrayBuffer();
  const { schema, rows } = parseExcelBuffer(buffer);

  const { domain } = classifyDomain(schema.columns.map((c) => c.excelHeader));
  const bindings = bindColumns(schema, domain);
  const colorMaps = buildColorMaps(schema, bindings);
  const branding = DOMAIN_BRANDING[domain] ?? DOMAIN_BRANDING.generic_table;

  return { domain, schema, bindings, colorMaps, branding, rows };
}

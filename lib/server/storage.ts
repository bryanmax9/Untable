/**
 * Storage layer — Supabase-backed (PostgreSQL + Storage bucket).
 * Uses the service role key server-side so RLS is bypassed;
 * auth/authorization is handled at the API route level.
 */
import { createClient } from '@supabase/supabase-js';
import type { StoredProject, ProjectSection, Row } from '../types';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Projects ─────────────────────────────────────────────────

export async function listProjects(orgId?: string): Promise<StoredProject[]> {
  const client = sb();
  let q = client.from('projects').select('*').order('created_at', { ascending: false });
  if (orgId) q = q.eq('org_id', orgId);

  const { data: projects, error } = await q;
  if (error) throw new Error(error.message);

  return Promise.all((projects ?? []).map(async p => {
    const { data: sections } = await client.from('sections')
      .select('section_idx,sheet_name,domain,schema_json,bindings_json,color_maps_json')
      .eq('project_id', p.id).order('section_idx');

    return {
      id: p.id,
      orgId: p.org_id ?? undefined,
      name: p.name,
      originalFilename: p.original_filename,
      createdAt: p.created_at,
      sections: (sections ?? []).map(sectionRow),
    } satisfies StoredProject;
  }));
}

export async function getProject(id: string): Promise<StoredProject | null> {
  const client = sb();
  const { data: p } = await client.from('projects').select('*').eq('id', id).maybeSingle();
  if (!p) return null;

  const { data: sections } = await client.from('sections')
    .select('section_idx,sheet_name,domain,schema_json,bindings_json,color_maps_json')
    .eq('project_id', id).order('section_idx');

  return {
    id: p.id,
    orgId: p.org_id ?? undefined,
    name: p.name,
    originalFilename: p.original_filename,
    createdAt: p.created_at,
    sections: (sections ?? []).map(sectionRow),
  };
}

function sectionRow(s: any): ProjectSection {
  return {
    sheetName:  s.sheet_name,
    domain:     s.domain,
    schema:     s.schema_json,
    bindings:   s.bindings_json,
    colorMaps:  s.color_maps_json,
  };
}

export async function saveProject(project: StoredProject, userId?: string): Promise<void> {
  const client = sb();

  await client.from('projects').upsert({
    id:                project.id,
    org_id:            project.orgId ?? null,
    name:              project.name,
    original_filename: project.originalFilename,
    created_by:        userId ?? null,
    created_at:        project.createdAt,
  }, { onConflict: 'id' });

  for (let i = 0; i < project.sections.length; i++) {
    const sec = project.sections[i];
    await client.from('sections').upsert({
      project_id:      project.id,
      section_idx:     i,
      sheet_name:      sec.sheetName,
      domain:          sec.domain,
      schema_json:     sec.schema,
      bindings_json:   sec.bindings,
      color_maps_json: sec.colorMaps,
    }, { onConflict: 'project_id,section_idx' });
  }
}

export async function deleteProject(id: string): Promise<void> {
  const client = sb();
  // Cascade deletes sections + records via FK
  await client.from('projects').delete().eq('id', id);
  // Also remove Excel file from storage
  await client.storage.from('excel-files').remove([`${id}/source.xlsx`]);
}

// ─── Excel file storage ────────────────────────────────────────

export async function saveExcelBuffer(projectId: string, buffer: Buffer): Promise<void> {
  const { error } = await sb().storage.from('excel-files').upload(
    `${projectId}/source.xlsx`,
    buffer,
    {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    },
  );
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

export async function readExcelBuffer(projectId: string): Promise<Buffer | null> {
  const { data, error } = await sb().storage.from('excel-files').download(`${projectId}/source.xlsx`);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

// ─── Records ──────────────────────────────────────────────────

async function getSectionId(client: ReturnType<typeof sb>, projectId: string, sectionIdx: number): Promise<string | null> {
  const { data } = await client.from('sections')
    .select('id').eq('project_id', projectId).eq('section_idx', sectionIdx).maybeSingle();
  return data?.id ?? null;
}

export async function readRecords(projectId: string, sectionIdx: number): Promise<Row[]> {
  const client = sb();
  const sectionId = await getSectionId(client, projectId, sectionIdx);
  if (!sectionId) return [];

  const { data, error } = await client.from('records')
    .select('id,row_data').eq('section_id', sectionId).order('created_at');
  if (error) throw new Error(error.message);

  return (data ?? []).map(r => ({ _id: r.id, ...r.row_data }));
}

export async function writeRecords(projectId: string, sectionIdx: number, rows: Row[]): Promise<void> {
  const client = sb();
  const sectionId = await getSectionId(client, projectId, sectionIdx);
  if (!sectionId) throw new Error(`Section ${sectionIdx} not found for project ${projectId}`);

  // Delete existing then bulk-insert in batches of 500
  await client.from('records').delete().eq('section_id', sectionId);

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map(row => {
      const { _id, ...rowData } = row;
      return { ...(_id ? { id: _id } : {}), section_id: sectionId, row_data: rowData };
    });
    const { error } = await client.from('records').insert(batch);
    if (error) throw new Error(`Insert batch failed: ${error.message}`);
  }
}

export async function addRecord(projectId: string, sectionIdx: number, row: Row): Promise<Row> {
  const client = sb();
  const sectionId = await getSectionId(client, projectId, sectionIdx);
  if (!sectionId) throw new Error('Section not found');

  const { _id, ...rowData } = row;
  const { data, error } = await client.from('records')
    .insert({ section_id: sectionId, row_data: rowData })
    .select('id,row_data').single();
  if (error) throw new Error(error.message);

  return { _id: data.id, ...data.row_data };
}

export async function updateRecord(projectId: string, sectionIdx: number, rowId: string, patch: Partial<Row>): Promise<Row | null> {
  const client = sb();
  const { data: existing } = await client.from('records').select('row_data').eq('id', rowId).maybeSingle();
  if (!existing) return null;

  const { _id, ...patchData } = patch;
  const newRowData = { ...existing.row_data, ...patchData };

  const { data, error } = await client.from('records')
    .update({ row_data: newRowData }).eq('id', rowId).select('id,row_data').single();
  if (error) throw new Error(error.message);

  return { _id: data.id, ...data.row_data };
}

export async function deleteRecord(_projectId: string, _sectionIdx: number, rowId: string): Promise<boolean> {
  const { error } = await sb().from('records').delete().eq('id', rowId);
  return !error;
}

// ─── Misc ─────────────────────────────────────────────────────

export async function getTotalRowCount(projectId: string): Promise<number> {
  const client = sb();
  const { data: sections } = await client.from('sections').select('id').eq('project_id', projectId);
  const ids = (sections ?? []).map(s => s.id);
  if (ids.length === 0) return 0;

  const { count } = await client.from('records')
    .select('id', { count: 'exact', head: true }).in('section_id', ids);
  return count ?? 0;
}

// Legacy alias kept for any import that passes the project object
export { getTotalRowCount as getTotalRowCountById };

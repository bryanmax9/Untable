import fs from 'fs';
import path from 'path';
import type { StoredProject, Row } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

function ensureDataDir(projectId?: string) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (projectId) {
    fs.mkdirSync(path.join(DATA_DIR, 'projects', projectId, 'records'), { recursive: true });
  }
}

function readProjectsIndex(): StoredProject[] {
  ensureDataDir();
  if (!fs.existsSync(PROJECTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeProjectsIndex(projects: StoredProject[]) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export function listProjects(): StoredProject[] {
  return readProjectsIndex().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getProject(id: string): StoredProject | null {
  const all = readProjectsIndex();
  return all.find(p => p.id === id) ?? null;
}

export function saveProject(project: StoredProject) {
  ensureDataDir(project.id);
  const all = readProjectsIndex();
  const idx = all.findIndex(p => p.id === project.id);
  if (idx >= 0) all[idx] = project;
  else all.push(project);
  writeProjectsIndex(all);
}

export function deleteProject(id: string) {
  const all = readProjectsIndex().filter(p => p.id !== id);
  writeProjectsIndex(all);
  const dir = path.join(DATA_DIR, 'projects', id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
}

// ─── Excel file storage ───────────────────────────────────────────────────────

export function getExcelPath(projectId: string): string {
  return path.join(DATA_DIR, 'projects', projectId, 'source.xlsx');
}

export function saveExcelBuffer(projectId: string, buffer: Buffer) {
  ensureDataDir(projectId);
  fs.writeFileSync(getExcelPath(projectId), buffer);
}

export function readExcelBuffer(projectId: string): Buffer | null {
  const p = getExcelPath(projectId);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

// ─── Records (per section) ────────────────────────────────────────────────────

function recordsPath(projectId: string, sectionIdx: number): string {
  return path.join(DATA_DIR, 'projects', projectId, 'records', `section_${sectionIdx}.json`);
}

export function readRecords(projectId: string, sectionIdx: number): Row[] {
  const p = recordsPath(projectId, sectionIdx);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return [];
  }
}

export function writeRecords(projectId: string, sectionIdx: number, rows: Row[]) {
  ensureDataDir(projectId);
  fs.writeFileSync(recordsPath(projectId, sectionIdx), JSON.stringify(rows, null, 2));
}

export function addRecord(projectId: string, sectionIdx: number, row: Row): Row {
  const rows = readRecords(projectId, sectionIdx);
  rows.push(row);
  writeRecords(projectId, sectionIdx, rows);
  return row;
}

export function updateRecord(projectId: string, sectionIdx: number, rowId: string, patch: Partial<Row>): Row | null {
  const rows = readRecords(projectId, sectionIdx);
  const idx = rows.findIndex(r => r._id === rowId);
  if (idx < 0) return null;
  rows[idx] = { ...rows[idx], ...patch, _id: rowId };
  writeRecords(projectId, sectionIdx, rows);
  return rows[idx];
}

export function deleteRecord(projectId: string, sectionIdx: number, rowId: string): boolean {
  const rows = readRecords(projectId, sectionIdx);
  const filtered = rows.filter(r => r._id !== rowId);
  if (filtered.length === rows.length) return false;
  writeRecords(projectId, sectionIdx, filtered);
  return true;
}

export function getTotalRowCount(projectId: string, project: StoredProject): number {
  return project.sections.reduce((total, _, i) => total + readRecords(projectId, i).length, 0);
}

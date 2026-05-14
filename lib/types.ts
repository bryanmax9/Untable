// ─── Column / Schema ─────────────────────────────────────────────────────────

export type ColumnType =
  | 'text' | 'longtext' | 'number' | 'currency'
  | 'date' | 'datetime' | 'boolean'
  | 'enum' | 'multiselect'
  | 'user' | 'url' | 'email' | 'phone'
  | 'formula';

export type SemanticRole =
  | 'identifier' | 'client' | 'status' | 'priority'
  | 'assignee' | 'deadline' | 'created' | 'description'
  | 'notes' | 'link' | 'area' | 'action' | 'pm';

export interface Column {
  id: string;
  excelHeader: string;
  label: string;
  type: ColumnType;
  semanticRole: SemanticRole | null;
  options?: string[];
  required?: boolean;
}

// How a sheet's data is structured — drives which view renders it
export type SheetStructure =
  | 'records'          // standard header + rows (sprint backlog, CRM, etc.)
  | 'kv_table'         // param / value / note  (Assumptions, Unit Economics)
  | 'financial_report' // row labels + period columns with ALL-CAPS section headers (P&L)
  | 'timeseries'       // month/quarter rows + metric columns (Monthly Forecast)
  | 'budget';          // category / amount / % / purpose (Use of Funds)

export interface Schema {
  columns: Column[];
  language: 'es' | 'en' | 'pt';
  rowCount: number;
  sheetName?: string;
  structure: SheetStructure;
}

export interface Row {
  _id: string;
  [columnId: string]: string | number | boolean | null;
}

// ─── Domain ──────────────────────────────────────────────────────────────────

export type DomainId =
  | 'dev_sprint'
  | 'legal_pendings'
  | 'sales_pipeline'
  | 'inventory'
  | 'clinic_patients'
  | 'hr_roster'
  | 'generic_table';

export interface ClassificationResult {
  domain: DomainId;
  confidence: number;
}

export interface Bindings {
  [role: string]: string; // role → columnId
}

// ─── App Config (in-memory rendering) ────────────────────────────────────────

export interface AppConfig {
  domain: DomainId;
  schema: Schema;
  bindings: Bindings;
  colorMaps: Record<string, Record<string, string>>;
  branding: {
    name: string;
    primaryColor: string;
  };
  rows: Row[];
}

// ─── Project (persisted) ─────────────────────────────────────────────────────

export interface SheetInfo {
  name: string;
  rowCount: number;
  headers: string[];
}

export interface ProjectSection {
  sheetName: string;
  domain: DomainId;
  schema: Schema;
  bindings: Bindings;
  colorMaps: Record<string, Record<string, string>>;
}

export interface StoredProject {
  id: string;
  orgId?: string;
  name: string;
  originalFilename: string;
  createdAt: string;
  sections: ProjectSection[];
  spreadsheetId?: string;
  sheetTab?: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  originalFilename: string;
  createdAt: string;
  sectionCount: number;
  totalRows: number;
  domains: DomainId[];
}

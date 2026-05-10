# Sheetshift — Product & Engineering Blueprint

> A complete specification for building an AI-powered B2B SaaS platform that converts companies' Excel files into custom-branded internal applications, with bidirectional real-time sync. Designed to be readable end-to-end by an AI coding agent (Claude Code, Cursor, etc.) or by a human engineering team to bootstrap the product.

---

## 0. How To Use This Document

This file is the **single source of truth** for the product vision, architecture, and execution plan. If you are an AI coding assistant building this product:

1. Read the entire document before writing code.
2. Treat Section 4 (Architecture) and Section 5 (Data Model) as binding.
3. Build features in the order specified in Section 9 (Roadmap).
4. When in doubt about UX, refer to Section 7 (Reference Example: LexDesk).
5. Ask the human operator before deviating from the technical stack in Section 4.2.

---

## 1. Executive Summary

### 1.1 What we're building

A SaaS platform where any company — from a 5-person law firm to a 500-person logistics operation — can upload an existing Excel file and receive, in under 90 seconds, a fully custom, branded, multi-user web application tailored to that workflow. Every change made in the web app syncs back to the underlying Excel file in real time, and the up-to-date `.xlsx` is downloadable at any moment.

### 1.2 Two-sentence pitch

Sheetshift is the no-code platform that turns companies' archaic Excel files into beautiful, AI-generated internal applications without any migration or developer work. Companies keep Excel as the source of truth while their teams use a clean, branded interface that updates the spreadsheet in real time.

### 1.3 Why this exists

Most SMBs run critical operations on Excel: case trackers, inventory, schedules, customer lists, project pendings. These files are fragile, hard to share, ugly, and unfriendly to non-technical workers. Building a real internal tool costs $20K–$200K and months of dev time. Sheetshift collapses that to one upload.

### 1.4 Why now

- Modern LLMs (Claude, GPT-4-class) can reliably classify domains, infer schemas, and generate React UIs from structured data.
- Real-time collaboration tech (CRDTs, websockets) is mature and open-source.
- Excel parsing libraries (SheetJS, openpyxl, HyperFormula) handle 95%+ of real-world files.
- SMBs in LATAM, Southern Europe, and Asia have massive Excel-dependence and are underserved by US-centric tools (Airtable, Notion, Glide).

---

## 2. Market & Competitive Positioning

### 2.1 Target customers

**Primary (Year 1):** SMB law firms in LATAM (Peru, Mexico, Colombia, Argentina, Chile). They run case-tracking on Spanish-language Excels with columns like CLIENTE, CARPETA, ESTADO, RESPONSABLE, FECHA LÍMITE. They have 5–50 employees, no IT department, and acute pain.

**Secondary (Year 2):** Construction subcontractors, dental clinics, small logistics operators, real estate agencies, accounting firms.

**Tertiary (Year 3+):** Departments inside larger enterprises (HR, ops, finance) that want internal tools without IT involvement.

### 2.2 Competitive landscape

| Competitor | What they do | Why we beat them |
|---|---|---|
| Airtable | Nice spreadsheet-database hybrid | They make you migrate. We keep Excel as source of truth. |
| Glide | Apps from Google Sheets | Generic templates, no domain awareness, English-first. |
| Stackby, Rows | Spreadsheet-first databases | Same generic-grid problem. |
| Retool | Internal tools for devs | Requires engineers. We require zero. |
| Microsoft Lists | MS-native list app | Limited to MS ecosystem, no AI generation. |
| Power Apps | Low-code MS platform | Steep learning curve, ugly UIs, not SMB-friendly. |

### 2.3 Our defensible wedge

1. **Excel stays canonical.** No migration friction. This is unique.
2. **Domain-aware AI generation.** The platform recognizes "this is a legal pendings tracker" and ships a legal-vocabulary UI, not a generic table.
3. **LATAM-first localization.** Spanish-native, with templates designed around Spanish-language workflows.
4. **Bidirectional sync.** True roundtrip — edit web, Excel updates; edit Excel, web updates.

---

## 3. Product Vision & Feature Spec

### 3.1 The core user journey

1. **Sign up** with workspace name and email.
2. **Upload** an `.xlsx` file via drag-and-drop.
3. **Wait ~60 seconds** as the AI parses, classifies the domain, infers the schema, and generates a custom UI.
4. **Land in the new app**, which has:
   - A branded sidebar with domain-appropriate navigation
   - Dashboard with relevant KPIs (e.g., "12 cases due this week")
   - Main data view (table, kanban, calendar — chosen by domain)
   - Filters, search, and grouping that match the data
   - Detail views for individual records
5. **Invite teammates** with role-based permissions (admin, editor, viewer).
6. **Workers edit data** through the clean UI; Excel updates in real time.
7. **Download the updated Excel** at any moment, byte-compatible with the original.

### 3.2 MVP feature list (must-have for launch)

- Workspace creation, email/password auth, password reset
- Excel upload (`.xlsx`, `.xlsm`, `.xls` via conversion)
- AI domain classifier (legal / sales / inventory / HR / project / generic)
- AI schema inference (column types, validations, relationships, formulas)
- AI UI generator producing a domain-specific React app
- Auto-generated table view with sort, filter, search, inline edit
- Detail view per row (auto-generated form layout)
- Real-time multi-user sync (websockets)
- Bidirectional Excel ↔ web sync
- Download up-to-date `.xlsx` anytime
- User invitations, basic roles
- Version history (last 30 days)
- Audit log (who changed what, when)

### 3.3 V2 features (months 4–8)

- Domain template library: opinionated UIs for legal, real estate, construction, clinic, HR
- Custom views: kanban, calendar, gallery, dashboard charts
- Form view (mobile-friendly data entry)
- Field-level permissions
- Automations: "when X status, do Y" (email, Slack, webhook)
- Public branded subdomain (e.g., `clientname.sheetshift.app`)
- Custom domain support (paid)
- Mobile responsive UI (PWA)

### 3.4 V3 features (months 8–12)

- Native mobile apps (iOS, Android)
- API access and Zapier/Make integration
- AI assistant inside the app ("show me all urgent cases for SANSON")
- Multi-sheet Excel support with auto-relationships
- Enterprise: SSO (SAML, OIDC), audit log export, on-prem option
- White-label mode for resellers

### 3.5 Explicit non-goals (for MVP)

- Not building a spreadsheet editor (Google Sheets, Excel Online exist)
- Not building a generic database (Airtable exists)
- Not supporting Google Sheets in MVP (Excel-first is our wedge)
- Not building a workflow engine like Zapier (integrate later)

---

## 4. Technical Architecture

### 4.1 High-level system diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐    │
│  │ Auto-generated│  │  Generic      │  │ Workspace admin   │    │
│  │ domain app UI │  │  table view   │  │ (settings, users) │    │
│  └───────┬───────┘  └───────┬───────┘  └─────────┬─────────┘    │
│          │ websocket (Yjs / OT)                  │              │
└──────────┼──────────────────────────────────────┼──────────────┘
           │                                       │
┌──────────▼───────────────────────────────────────▼──────────────┐
│                    APPLICATION SERVER                            │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────────────┐  │
│  │ Auth / RBAC │  │ Realtime   │  │ Generated-app server      │  │
│  │ (NextAuth)  │  │ sync hub   │  │ (renders custom UI)        │  │
│  └─────────────┘  └─────┬──────┘  └──────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────┐    │
│  │            Excel sync engine (bidirectional)             │    │
│  └──────────────────────┬──────────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    AI PIPELINE (async)                          │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────────────┐  │
│  │ Excel       │→ │ Domain     │→ │ UI generator (Claude /    │  │
│  │ parser      │  │ classifier │  │ GPT-4) → React scaffold   │  │
│  └─────────────┘  └────────────┘  └──────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                       DATA LAYER                                │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────────┐   │
│  │ Postgres │  │ Redis   │  │ S3      │  │ ClickHouse       │   │
│  │ (rows,   │  │ (sync,  │  │ (orig.  │  │ (audit, events)  │   │
│  │ schema)  │  │ presence│  │ .xlsx)  │  │                  │   │
│  └──────────┘  └─────────┘  └─────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Technology stack (binding)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) + React 18 | Mature, SSR, great DX |
| UI library | Tailwind + shadcn/ui | Composable, beautiful defaults |
| State | Zustand + Yjs (CRDT) | Yjs handles realtime conflict-free |
| Backend | Node.js + tRPC + Fastify | Typesafe end-to-end |
| Database | PostgreSQL 16 + Prisma | Reliability, JSONB for flexible schema |
| Realtime | y-websocket + Redis pub/sub | Battle-tested CRDT sync |
| File storage | S3-compatible (R2 / MinIO) | Cheap, durable |
| Excel parsing | SheetJS (community) + openpyxl (Python microservice) | SheetJS for fast reads, openpyxl for fidelity-preserving writes |
| Formula engine | HyperFormula | Open source, 380+ Excel functions |
| AI / LLM | Claude (primary), GPT-4 (fallback) | Anthropic API for classification + generation |
| Auth | NextAuth.js + email/password + magic link | Standard |
| Background jobs | BullMQ + Redis | Simple, robust |
| Hosting | Vercel (frontend) + Fly.io (backend services) + Neon (Postgres) | Solo-founder friendly to start |
| Analytics | PostHog (product) + Sentry (errors) | Self-hostable later |
| Monitoring | Grafana + Prometheus | Standard |

### 4.3 Excel ingestion pipeline

```
Upload .xlsx
    │
    ▼
┌─────────────────────────────────────────────┐
│ 1. Persist original to S3 (canonical copy)  │
└─────────────┬───────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│ 2. Parse with openpyxl (Python worker)      │
│    Extract: sheets, headers, types,         │
│    formulas, validations, dropdowns,        │
│    conditional formats, named ranges        │
└─────────────┬───────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│ 3. Schema inference                         │
│    For each column: detect type             │
│    (string, number, date, enum, formula),   │
│    detect dropdowns → enum field,           │
│    detect dates with mixed formats,         │
│    detect probable foreign keys             │
└─────────────┬───────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│ 4. Domain classifier (LLM call)             │
│    Input: column names + 5 sample rows      │
│    Output: {domain, confidence, rationale}  │
│    Example: {"domain":"legal_pendings",     │
│              "confidence":0.93,             │
│              "language":"es"}               │
└─────────────┬───────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│ 5. Template selection                       │
│    if domain in known templates:            │
│      use vetted template                    │
│    else:                                    │
│      use generic table template             │
└─────────────┬───────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│ 6. UI generation (LLM call)                 │
│    Generate React components for:           │
│    - Sidebar/nav                            │
│    - Dashboard with KPIs                    │
│    - Main view (table/kanban/calendar)      │
│    - Detail view                            │
│    Output validated against TS types        │
└─────────────┬───────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│ 7. Persist row data to Postgres             │
│    Each row → record in `records` table     │
│    Schema → `app_schemas` table             │
└─────────────┬───────────────────────────────┘
              ▼
┌─────────────────────────────────────────────┐
│ 8. Notify user → app ready                  │
└─────────────────────────────────────────────┘
```

### 4.4 Bidirectional sync engine

The hardest part of the product. Approach:

- **Source of truth:** Postgres `records` table is canonical at runtime.
- **Excel as snapshot:** the `.xlsx` in S3 is regenerated on demand from Postgres state, using openpyxl with the original file as a template (preserves formatting, formulas, named ranges).
- **Web edit flow:** user edits in UI → optimistic update → Yjs diff → server → Postgres → broadcast to other clients via Redis pub/sub.
- **Excel edit flow (V2):** user re-uploads modified `.xlsx` → diff against last known canonical → merge into Postgres with conflict resolution (last-write-wins for MVP, with audit log).
- **Download:** on demand, regenerate `.xlsx` from current Postgres state, served from S3 with a signed URL.

### 4.5 AI UI generation: prompt strategy

The UI generator is the magic. It must be:

- **Constrained**: never produce arbitrary code; only emit JSON describing layouts, which the runtime renders via a fixed component library.
- **Validated**: output passes through a Zod schema; invalid responses retry up to 3 times.
- **Domain-aware**: receives the domain classification + sample data + curated examples for that domain.

Prompt template (sketch):

```
You are designing an internal tool for a small business.
Domain: {domain}
Language: {language}
Columns: {columns}
Sample rows: {rows}

Output a JSON config matching this schema: {AppConfigSchema}
- Choose the best primary view (table, kanban, calendar)
- Select 3–5 KPIs for the dashboard
- Group columns into logical sections in the detail view
- Pick badge colors for status/priority columns
- Pick navigation items based on natural groupings in the data

Reference UI for similar domains:
{few_shot_examples}
```

The output is **never raw HTML/JSX**. It's a structured config the runtime renders deterministically.

---

## 5. Data Model

### 5.1 Core tables (Prisma schema sketch)

```prisma
model Workspace {
  id          String   @id @default(cuid())
  name        String
  plan        Plan     @default(FREE)
  createdAt   DateTime @default(now())
  members     Member[]
  apps        App[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  members   Member[]
}

model Member {
  id          String     @id @default(cuid())
  userId      String
  workspaceId String
  role        Role       @default(EDITOR)
  user        User       @relation(fields: [userId], references: [id])
  workspace   Workspace  @relation(fields: [workspaceId], references: [id])
}

enum Role { ADMIN EDITOR VIEWER }
enum Plan { FREE STARTER PRO BUSINESS ENTERPRISE }

model App {
  id            String   @id @default(cuid())
  workspaceId   String
  name          String
  domain        String   // "legal_pendings", "sales_pipeline", etc.
  language      String   // "en", "es", "pt"
  schema        Json     // AppSchema (see below)
  uiConfig      Json     // AppConfig (see below)
  excelOrigKey  String   // S3 key of original .xlsx
  records       Record[]
  createdAt     DateTime @default(now())
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
}

model Record {
  id        String   @id @default(cuid())
  appId    String
  data     Json     // {columnId: value, ...}
  version  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  app       App      @relation(fields: [appId], references: [id])
  events    Event[]

  @@index([appId])
}

model Event {
  id        String   @id @default(cuid())
  recordId  String
  userId    String
  type      String   // "create", "update", "delete"
  diff      Json
  createdAt DateTime @default(now())
  record    Record   @relation(fields: [recordId], references: [id])
}
```

### 5.2 AppSchema (JSON)

```ts
type AppSchema = {
  columns: Column[];
  primaryKey: string;
};

type Column = {
  id: string;          // stable identifier
  excelHeader: string; // original header from Excel
  label: string;       // display label
  type: ColumnType;
  required: boolean;
  options?: string[];  // for enums (from Excel data validation)
  formula?: string;    // for derived columns
};

type ColumnType =
  | 'text' | 'longtext' | 'number' | 'currency'
  | 'date' | 'datetime' | 'boolean'
  | 'enum' | 'multiselect'
  | 'user'  // RESPONSABLE column
  | 'url' | 'email' | 'phone'
  | 'formula';
```

### 5.3 AppConfig (JSON)

```ts
type AppConfig = {
  branding: {
    name: string;
    primaryColor: string;
    accentColors: Record<string, string>; // for badges
  };
  navigation: NavItem[];
  dashboard: {
    kpis: KPI[];
    charts: Chart[];
  };
  views: View[]; // table, kanban, calendar, gallery
  detailView: {
    sections: DetailSection[];
  };
};

type View = {
  id: string;
  type: 'table' | 'kanban' | 'calendar' | 'gallery';
  title: string;
  filters: Filter[];
  sorting: Sort[];
  groupBy?: string;
  // type-specific config
};
```

---

## 6. Domain Templates Library

The platform ships with curated templates for high-value domains. Each template has:

- A domain ID and detection heuristics
- A vetted `AppConfig` skeleton
- Sample KPIs, views, and detail layouts
- Example UI shown to users during onboarding

### 6.1 Template: `legal_pendings` (LATAM beachhead)

**Detection cues:** columns containing CLIENTE, CARPETA, EXPEDIENTE, ESTADO, FECHA LÍMITE, RESPONSABLE, ARBITRAJE, PROCESOS JUDICIALES.

**Suggested UI:**
- Sidebar: Dashboard, Casos, Clientes, Audiencias, Equipo
- Dashboard KPIs: Total cases, Urgent this week, Hearings next 7 days, By client, By status
- Primary view: Kanban grouped by ESTADO with priority badges
- Secondary view: Calendar of FECHA LÍMITE
- Detail view sections: Identificación, Hechos, Procedimiento, Plazos, Notas
- Color coding:
  - Status: EN PROGRESO (purple), PENDIENTE (amber), SEGUIMIENTO (blue), LISTO (green)
  - Priority: URGENTE (red), ALTA (amber), MEDIA (blue), BAJA (gray)

### 6.2 Template: `sales_pipeline`

**Detection cues:** columns containing LEAD, OPPORTUNITY, AMOUNT, STAGE, OWNER, CLOSE DATE.

**Suggested UI:**
- Kanban by stage, dashboard with pipeline value, win rate, by-rep breakdown.

### 6.3 Template: `construction_pendings`

**Detection cues:** OBRA, CONTRATO, MILESTONE, FECHA, AVANCE, RESPONSABLE.

### 6.4 Template: `clinic_patients`

**Detection cues:** PACIENTE, HISTORIA CLÍNICA, CITA, DIAGNÓSTICO, MÉDICO.

### 6.5 Template: `inventory`

**Detection cues:** SKU, PRODUCTO, STOCK, PROVEEDOR, PRECIO.

### 6.6 Template: `hr_roster`

**Detection cues:** EMPLEADO, PUESTO, SALARIO, FECHA INGRESO, ESTADO.

### 6.7 Fallback: `generic_table`

Any data. Generates a clean table view with auto-detected filters and a basic dashboard counting rows by enum columns.

---

## 7. Reference UI Example: LexDesk

When designing the legal template, model the UX after the LexDesk reference:

- **Sidebar (220px wide):** logo + workspace name, sections "PRINCIPAL" (Dashboard, Pendientes, Calendario) and "GESTIÓN" (Clientes, Equipo, Configuración)
- **Top bar:** breadcrumbs, search, user avatar
- **Dashboard:** 4 KPI cards in a row (Total, Urgentes, Esta Semana, Vencidos), then "Próximas Audiencias" card with calendar mini, then "Actividad Reciente" feed
- **Pendientes view:** filterable table grouped by CLIENTE, badges for ESTADO and PRIORIDAD, click row → drawer with full detail
- **Detail drawer:** client avatar, case ID, status pills, sections for Hechos / Procedimiento / Plazos / Observaciones / Link, edit-in-place
- **Color palette:**
  - Purple #534AB7 / #3C3489 — primary brand
  - Teal #0F6E56 — completed/ok
  - Amber #854F0B — warning/in-progress
  - Coral #993C1D — high-priority
  - Red #A32D2D — urgent/overdue
  - Backgrounds: #ffffff / #f5f4f0 / #eeede9
- **Typography:** system font stack, 14px base, 1.5 line height, 11–13px secondary text
- **Component patterns:** rounded 8–12px corners, 0.5px borders rgba(0,0,0,0.12), generous whitespace, no heavy shadows

This aesthetic should set the bar for all templates: calm, professional, slightly editorial, never SaaS-generic.

---

## 8. Pricing & Business Model

### 8.1 Tiers

| Tier | Price (USD/mo) | Apps | Users | Rows | Features |
|---|---|---|---|---|---|
| Free | $0 | 1 | 3 | 500 | Generic template, watermark |
| Starter | $49 | 5 | 10 | 10K | All generic features |
| Pro | $149 | Unlimited | 25 | 100K | **Domain templates, automations, custom branding** |
| Business | $399 | Unlimited | 100 | 1M | White-label, custom domain, priority support |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited | SSO, audit export, on-prem, SLA |

### 8.2 Why Pro is the wedge

Domain-aware AI templates are 10x more valuable than a generic table. Most paying customers should land on Pro ($149) — high enough to be a real business, low enough to be a no-brainer for a 10-person law firm.

### 8.3 Unit economics targets (year 1)

- CAC: < $300 (content + outbound to LATAM SMB)
- ARPA: $120/mo blended
- Gross margin: > 75% (LLM costs amortized over many users per workspace)
- Payback: < 4 months
- NRR target: > 110%

---

## 9. Roadmap

### 9.1 Phase 1 — Foundation (Months 0–3)

- [ ] Monorepo setup (pnpm + Turborepo)
- [ ] Auth, workspaces, members
- [ ] Excel upload + parse (openpyxl worker)
- [ ] Schema inference engine
- [ ] Generic table view with filter, sort, search, inline edit
- [ ] Realtime sync via Yjs + websockets
- [ ] Excel regeneration on demand
- [ ] Basic dashboard
- [ ] Closed beta with 5 friendly law firms

**Exit criteria:** A user can upload an Excel and use a working multi-user app within 2 minutes.

### 9.2 Phase 2 — AI generation + first vertical (Months 3–6)

- [ ] Domain classifier (Claude API)
- [ ] AI UI generator (constrained JSON output)
- [ ] Legal template ("LexDesk-quality")
- [ ] Kanban, calendar views
- [ ] Detail drawer with sections
- [ ] Branded subdomain
- [ ] Public landing page + onboarding flow
- [ ] 20 paying legal customers in Peru/Mexico

**Exit criteria:** $5K MRR, NPS > 40 from legal beta cohort.

### 9.3 Phase 3 — Expansion (Months 6–9)

- [ ] Construction template
- [ ] Clinic template
- [ ] Sales pipeline template
- [ ] Automations (status-based triggers, email)
- [ ] Mobile-responsive PWA
- [ ] Hire first sales/CS rep
- [ ] 100 paying customers across 3 verticals

**Exit criteria:** $25K MRR, organic referral coefficient > 0.3.

### 9.4 Phase 4 — Scale (Months 9–12)

- [ ] Native mobile apps
- [ ] API + Zapier
- [ ] Enterprise SSO
- [ ] White-label tier
- [ ] Open AI generator to free-form domains
- [ ] 300+ paying customers

**Exit criteria:** $75K+ MRR, ready for Series A or profitable bootstrapping.

---

## 10. Go-To-Market

### 10.1 Beachhead: LATAM legal SMBs

- **Why:** Acute Excel pain (visible in real files like the reference upload), Spanish-speaking market underserved by US tools, easy reference customers, high willingness to pay for "looks professional" software.
- **How:** Direct outbound to 200 firms in Lima, CDMX, Bogotá. Free legal-template demo videos in Spanish. Partnership with bar associations.
- **Goal:** 20 paying firms by month 6.

### 10.2 Channels

1. **Content + SEO:** "Excel alternative for law firms," "Plantilla pendientes legales" — Spanish-language SEO is uncrowded.
2. **YouTube demos:** "Watch this Excel become an app in 60 seconds."
3. **LinkedIn outbound:** target managing partners at 10–50 person firms.
4. **Referrals:** every paying customer gets 2 free months for a referral.
5. **Vertical communities:** sponsor LATAM legal-tech podcasts, attend bar association events.

### 10.3 Sales motion

- Self-serve for Free / Starter (credit card, no human touch)
- Inside sales for Pro / Business (15-min demo, 7-day trial)
- Field sales for Enterprise (50+ users)

---

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| LLM-generated UIs look generic / break | High | High | Constrained JSON output + curated templates |
| Excel formula coverage gaps | Medium | High | Use HyperFormula (380+ funcs); gracefully degrade rest |
| Roundtrip Excel fidelity bugs | High | Medium | Keep original as template; only diff changed cells |
| Microsoft / Google ships competing AI | Medium | High | Move fast, own SMB niche, deep LATAM localization |
| Concurrent web + desktop Excel edits conflict | Medium | Medium | Lock-on-edit warning + audit log; merge UI in V2 |
| LLM cost spikes | Low | Medium | Cache classification results, charge by tier |
| Privacy/compliance (legal data sensitive) | High | High | SOC 2 plan from day 1, EU + LATAM data residency, encryption at rest |

---

## 12. Engineering Conventions

For any AI agent or developer building this:

- **TypeScript everywhere.** No JS in the codebase except generated files.
- **tRPC for all client-server calls.** No REST.
- **Zod for runtime validation** of all external inputs (uploads, LLM outputs, webhooks).
- **Prisma migrations** checked into the repo.
- **No `any`** in production code; use `unknown` and narrow.
- **Tests:** unit (Vitest) for logic, Playwright for critical flows (upload → app generation → edit → download).
- **Conventional Commits** for changelog automation.
- **Branch model:** trunk-based with short-lived feature branches.
- **CI:** lint, typecheck, test, build on every PR. No merge without green.
- **Observability:** structured logs (pino), traces (OpenTelemetry), errors (Sentry).
- **Secrets:** never in repo; use Doppler or Vercel env vars.
- **Accessibility:** WCAG 2.1 AA minimum; semantic HTML, keyboard nav, screen-reader labels.

---

## 13. Naming, Brand, and Voice

### 13.1 Suggested name

**Sheetshift** — descriptive, memorable, available across most TLDs at time of writing. Alternatives: Forma (Spanish-friendly), Liftly, Cellforge.

### 13.2 Brand voice

- Calm, professional, slightly editorial (not "rocketship 🚀 SaaS")
- Spanish and English first-class from day 1
- Customer language, not engineer language ("your tracker," not "your database")
- Lead with the *outcome* (a beautiful app for your team) not the *mechanism* (AI-generated React)

### 13.3 Visual identity

- Inspired by the LexDesk reference: warm off-white backgrounds (#f5f4f0), restrained accent colors, rounded but not playful corners, generous whitespace, system typography.
- Avoid: gradients, neon, 3D illustrations, robot-themed imagery.

---

## 14. Glossary

- **Workspace:** a tenant — usually one company.
- **App:** one Excel file, turned into one application.
- **Record:** one row in an app's data.
- **Schema:** the typed description of an app's columns.
- **Template:** a pre-built AppConfig for a known domain (legal, sales, etc.).
- **Domain classification:** the LLM step that identifies what kind of workflow an Excel represents.
- **Roundtrip:** the bidirectional sync between web app state and the canonical .xlsx.
- **CRDT:** Conflict-free Replicated Data Type, used for realtime multi-user editing without locks.

---

## 15. Open Questions for the Founder

These are decisions the human must make before or during build:

1. **Hosting jurisdiction:** US, EU, or LATAM data residency for v1? (Affects compliance scope.)
2. **Free tier generosity:** how much before it cannibalizes paid?
3. **First-template breadth:** ship one polished legal template, or three rougher ones?
4. **LLM provider:** Anthropic-only, or also OpenAI from day 1 for redundancy?
5. **Open source any of it?** (E.g., the Excel parser as a credibility play.)
6. **Co-founder needs:** does the founder need a technical co-founder, or hire contractors?

---

## 16. Definition of Done (for the MVP)

The MVP is shippable when:

1. A non-technical user can sign up, upload a real-world Excel, and have a working app in under 2 minutes.
2. Three concurrent users can edit the same app and see each other's changes within 500ms.
3. The downloaded .xlsx opens in Excel without errors and reflects the latest state.
4. The legal template ships with a UI of LexDesk quality.
5. Five paying customers are using it daily.
6. Sentry error rate is < 0.5% of sessions.
7. Median upload-to-app time is < 90 seconds.

---

## 17. Appendix: Reference real-world Excel

A real-world example of a target file (legal pendings, Spanish, 130+ rows):

**Columns:** N°, CLIENTE, CARPETA, FECHA DE SOLICITUD, RESPONSABLE CALITÉ, ACCION, DESCRIPCIÓN DEL SERVICIO, HECHOS, PROCEDIMIENTO, PLAZO ACTUAL, FECHA LÍMITE, HORARIO, RESPONSABLE, ESTADO, PRIORIDAD, LINK, OBSERVACIONES.

**Sample values:**
- ESTADO: EN PROGRESO, PENDIENTE, SEGUIMIENTO, EN PROCESO, LISTO
- PRIORIDAD: URGENTE, ALTA
- CARPETA: ARBITRAJE, PROCESOS JUDICIALES, SERVICIOS GENERALES, RNP, REGISTROS PUBLICOS, VERIFICACION SUNAFIL, LEGAL, SERVICIO PENAL
- HORARIO: OFICINA, MESA DE PARTES, TODO EL DIA, URGENTE
- ACCION: RECORDAR, REVISAR, HACER

This is the Rosetta Stone for the legal template. Any AI agent designing the legal UI should re-read this list before generating components.

---

**End of blueprint.** Build with care.

module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/parser/type-inference.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "inferColumnType",
    ()=>inferColumnType
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//;
const PHONE_RE = /^\+?[\d\s\-().]{7,}$/;
const BOOL_VALUES = new Set([
    'true',
    'false',
    'yes',
    'no',
    'sí',
    'si',
    'no',
    'verdadero',
    'falso',
    '1',
    '0'
]);
// Detect Excel serial date (number like 45000)
function isExcelSerial(v) {
    return typeof v === 'number' && v > 25569 && v < 60000;
}
function isDateObj(v) {
    return v instanceof Date && !isNaN(v.getTime());
}
function allMatch(samples, test) {
    return samples.length > 0 && samples.every(test);
}
function inferColumnType(values) {
    const nonEmpty = values.filter((v)=>v != null && v !== '');
    if (nonEmpty.length === 0) return 'text';
    const samples = nonEmpty.slice(0, 100);
    if (allMatch(samples, isDateObj) || allMatch(samples, isExcelSerial)) return 'date';
    const strings = samples.map(String);
    if (allMatch(strings, (v)=>EMAIL_RE.test(String(v)))) return 'email';
    if (allMatch(strings, (v)=>URL_RE.test(String(v)))) return 'url';
    if (allMatch(strings, (v)=>PHONE_RE.test(String(v)) && !/\s{2,}/.test(String(v)))) return 'phone';
    if (allMatch(samples, (v)=>typeof v === 'number' || !isNaN(Number(v)))) return 'number';
    if (allMatch(strings, (v)=>BOOL_VALUES.has(String(v).toLowerCase()))) return 'boolean';
    const unique = new Set(strings);
    const ratio = unique.size / strings.length;
    if (ratio < 0.15 && unique.size <= 25) return 'enum';
    const avgLen = strings.reduce((a, v)=>a + v.length, 0) / strings.length;
    if (avgLen > 80) return 'longtext';
    return 'text';
}
}),
"[project]/lib/parser/semantic-detection.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectSemanticRole",
    ()=>detectSemanticRole
]);
const PATTERNS = [
    [
        'identifier',
        [
            /expediente/i,
            /n[°º]/i,
            /^id$/i,
            /ticket/i,
            /caso/i,
            /^n°/i,
            /^n$/i
        ]
    ],
    [
        'client',
        [
            /cliente/i,
            /customer/i,
            /client/i,
            /empresa/i,
            /company/i
        ]
    ],
    [
        'status',
        [
            /estado/i,
            /status/i,
            /state/i,
            /situaci[oó]n/i
        ]
    ],
    [
        'priority',
        [
            /prioridad/i,
            /priority/i,
            /urgenc/i
        ]
    ],
    [
        'assignee',
        [
            /^responsable$/i,
            /assigned/i,
            /owner/i,
            /encargado/i,
            /asignad/i
        ]
    ],
    [
        'pm',
        [
            /responsable pm/i,
            /pm$/i,
            /project manager/i,
            /responsable cali/i,
            /calité/i,
            /calite/i
        ]
    ],
    [
        'deadline',
        [
            /fecha l[ií]mite/i,
            /deadline/i,
            /vencimiento/i,
            /due/i,
            /plazo/i
        ]
    ],
    [
        'created',
        [
            /fecha de solicitud/i,
            /created/i,
            /fecha de creaci[oó]n/i,
            /fecha solicitud/i
        ]
    ],
    [
        'description',
        [
            /descripci[oó]n/i,
            /description/i,
            /asunto/i,
            /servicio/i
        ]
    ],
    [
        'notes',
        [
            /observaciones/i,
            /notes/i,
            /comentarios/i,
            /comments/i
        ]
    ],
    [
        'link',
        [
            /^link$/i,
            /^url$/i,
            /enlace/i,
            /referencia/i
        ]
    ],
    [
        'area',
        [
            /^area$/i,
            /^área$/i,
            /department/i,
            /departamento/i,
            /equipo/i
        ]
    ],
    [
        'action',
        [
            /^accion$/i,
            /^acci[oó]n$/i,
            /action/i
        ]
    ]
];
function detectSemanticRole(header) {
    for (const [role, patterns] of PATTERNS){
        if (patterns.some((p)=>p.test(header.trim()))) return role;
    }
    return null;
}
}),
"[project]/lib/server/excel-reader.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSheetInfos",
    ()=>getSheetInfos,
    "parseSheet",
    ()=>parseSheet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xlsx/xlsx.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$parser$2f$type$2d$inference$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/parser/type-inference.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$parser$2f$semantic$2d$detection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/parser/semantic-detection.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist-node/v4.js [app-route] (ecmascript) <export default as v4>");
;
;
;
;
function slugify(header) {
    return header.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'col';
}
function detectLanguage(headers, samples) {
    const text = [
        ...headers,
        ...samples
    ].join(' ').toLowerCase();
    const es = [
        'cliente',
        'estado',
        'fecha',
        'responsable',
        'prioridad',
        'ingresos',
        'gastos',
        'precio',
        'carpeta',
        'expediente',
        'empresa',
        'gestión'
    ].filter((w)=>text.includes(w)).length;
    const en = [
        'client',
        'status',
        'date',
        'owner',
        'priority',
        'revenue',
        'expense',
        'price',
        'budget',
        'amount',
        'estimated',
        'total',
        'grant',
        'disbursement',
        'investment',
        'withholding'
    ].filter((w)=>text.includes(w)).length;
    const pt = [
        'cliente',
        'data',
        'respons',
        'prioridade',
        'receita',
        'despesas',
        'empresa'
    ].filter((w)=>text.includes(w)).length;
    // Only classify as Spanish/Portuguese if there's actual evidence; default to English
    if (es > 0 && es > en && es >= pt) return 'es';
    if (pt > 0 && pt > en) return 'pt';
    return 'en';
}
// ─── Structure detection ──────────────────────────────────────────────────────
function detectStructure(colLabels, rows, colIds) {
    const h = colLabels.map((s)=>s.toLowerCase());
    const colCount = colLabels.length;
    // Budget: has a cost/amount column + (has description/items col OR small column count)
    // The % column is optional — grant budgets, use-of-funds sheets, etc. rarely have %
    const hasCostCol = h.some((x)=>/\bamount\b|\bcost\b|\$|budget|monto|\bprecio\b|\bprice\b/i.test(x));
    const hasItemsCol = h.some((x)=>/item|service|descripci|description|category|purpose|concept|concepto/i.test(x));
    if (hasCostCol && (hasItemsCol || colCount <= 5)) return 'budget';
    // Financial report OR timeseries: columns 1+ are year/period-based
    // Use strict pattern so "cumul." doesn't trigger it
    const YEAR_PERIOD = /\byear\b|\byr\b|^Q[1-4]\s+\d{4}|\bH[12]\b.*\d{4}|3-year|3 year|\btotal\b/i;
    const periodCols = colLabels.slice(1).filter(Boolean);
    const yearPeriodCount = periodCols.filter((h)=>YEAR_PERIOD.test(h)).length;
    if (yearPeriodCount >= 2) {
        // Does the first column contain ALL-CAPS section headers? → financial_report
        const firstId = colIds[0];
        if (firstId) {
            const hasSections = rows.some((r)=>{
                const v = String(r[firstId] ?? '').trim();
                return v.length > 4 && v === v.toUpperCase() && /[A-Z]{3}/.test(v) && !/^\d/.test(v) && !/^(FULL|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JAN|FEB|MAR)/i.test(v);
            });
            if (hasSections) return 'financial_report';
        }
    }
    // Timeseries: first column contains month/date strings in data
    const firstId = colIds[0];
    if (firstId && rows.length >= 4) {
        const MONTH_PATTERN = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|ene|abr|ago|ene|dic)\b.*\d{4}|\d{4}.*\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;
        const monthCount = rows.slice(0, 8).filter((r)=>MONTH_PATTERN.test(String(r[firstId] ?? ''))).length;
        if (monthCount >= 4) return 'timeseries';
    }
    // KV table: 2–4 columns, first col is all strings, second has numbers
    if (colCount >= 2 && colCount <= 4) {
        const firstAllText = rows.every((r)=>{
            const v = r[colIds[0]];
            return v == null || v === '' || typeof v === 'string';
        });
        const secondHasNums = rows.some((r)=>{
            const v = r[colIds[1]];
            return v != null && v !== '' && !isNaN(Number(v));
        });
        if (firstAllText && secondHasNums) return 'kv_table';
    }
    return 'records';
}
function looksLikeDataValue(s) {
    // Currency string like $5,000.00 or -$1,200
    if (/^-?\$[\d,]+(\.\d+)?$/.test(s.trim())) return true;
    // Pure numeric string with commas (1,200.00)
    if (/^-?[\d]{1,3}(,\d{3})*(\.\d+)?$/.test(s.trim()) && s.includes(',')) return true;
    // Percentage
    if (/^-?\d+(\.\d+)?%$/.test(s.trim())) return true;
    return false;
}
function scoreHeaderCandidate(nonEmpty) {
    // Prefer rows whose cells look like typical column names
    let score = 0;
    for (const s of nonEmpty){
        if (looksLikeDataValue(s)) score -= 5;
        if (s.length <= 30 && /^[A-Za-z#]/.test(s)) score += 1;
        if (/^(#|n[°o]|item|name|date|status|cost|amount|description|service|category|type|priority|area|client|id)/i.test(s)) score += 3;
    }
    return score;
}
function findHeaderRow(raw) {
    const maxSearch = Math.min(15, raw.length);
    // Pass 1: row where ALL non-null cells are strings → definite header
    // Collect all candidates then pick the best-scoring one (avoids picking data rows that happen to be all-strings)
    const candidates = [];
    for(let i = 0; i < maxSearch; i++){
        const row = raw[i];
        const nonEmpty = row.filter((c)=>c != null && c !== '');
        if (nonEmpty.length < 2) continue;
        const allStrings = nonEmpty.every((c)=>typeof c === 'string');
        if (!allStrings) continue;
        const hasNextData = raw.slice(i + 1, i + 5).some((r)=>r.some((c)=>c != null && c !== ''));
        if (!hasNextData) continue;
        const strVals = nonEmpty.map(String);
        const score = scoreHeaderCandidate(strVals);
        const source = row.map((h)=>h != null && String(h).trim() !== '' ? String(h).replace(/\n/g, ' ').trim() : null);
        candidates.push({
            i,
            score,
            source
        });
    }
    if (candidates.length > 0) {
        // Prefer highest-scoring candidate; if scores tied prefer the earlier one unless a later one scores significantly better
        candidates.sort((a, b)=>b.score !== a.score ? b.score - a.score : a.i - b.i);
        const best = candidates[0];
        return {
            idx: best.i,
            source: best.source,
            dataStart: best.i + 1
        };
    }
    // Pass 2: row where first col is null but rest are year/period strings
    for(let i = 0; i < maxSearch; i++){
        const row = raw[i];
        const nonEmpty = row.filter((c)=>c != null && c !== '');
        if (nonEmpty.length < 2) continue;
        const firstIsNull = row[0] == null || row[0] === '';
        const restStrings = nonEmpty.every((c)=>typeof c === 'string');
        const hasPeriods = nonEmpty.some((c)=>/year|yr|quarter|Q[1-4]|total|H[12]/i.test(String(c)));
        if (firstIsNull && restStrings && hasPeriods) {
            const source = row.map((h)=>h != null && String(h).trim() !== '' ? String(h).replace(/\n/g, ' ').trim() : null);
            return {
                idx: i,
                source,
                dataStart: i + 1
            };
        }
    }
    // Pass 3: no header found → KV-style table; generate implicit headers
    for(let i = 0; i < maxSearch; i++){
        const row = raw[i];
        const nonEmpty = row.filter((c)=>c != null && c !== '');
        if (nonEmpty.length < 2) continue;
        const maxCols = Math.max(...raw.slice(i, i + 20).map((r)=>r.filter((c)=>c != null && c !== '').length));
        const implicit = maxCols >= 3 ? [
            'Parameter',
            'Value',
            'Notes'
        ] : [
            'Parameter',
            'Value'
        ];
        return {
            idx: i,
            source: implicit,
            dataStart: i
        };
    }
    return {
        idx: 0,
        source: [],
        dataStart: 1
    };
}
function getSheetInfos(buffer) {
    const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["read"](buffer, {
        type: 'buffer',
        cellDates: true
    });
    return wb.SheetNames.map((name)=>{
        const ws = wb.Sheets[name];
        const raw = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].sheet_to_json(ws, {
            header: 1,
            raw: true,
            defval: null
        });
        const { source, dataStart } = findHeaderRow(raw);
        const headers = source.filter(Boolean).map(String).filter((h)=>h.trim().length > 0);
        const dataRows = raw.slice(dataStart).filter((r)=>r && r.some((c)=>c != null && c !== ''));
        return {
            name,
            rowCount: dataRows.length,
            headers
        };
    });
}
function parseSheet(buffer, sheetName) {
    const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["read"](buffer, {
        type: 'buffer',
        cellDates: true
    });
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error(`Sheet "${sheetName}" not found`);
    // Pre-extract hyperlinks: map "R<row>C<col>" → URL
    const hyperlinkMap = new Map();
    const range = ws['!ref'] ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].decode_range(ws['!ref']) : null;
    if (range) {
        for(let r = range.s.r; r <= range.e.r; r++){
            for(let c = range.s.c; c <= range.e.c; c++){
                const addr = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].encode_cell({
                    r,
                    c
                });
                const cell = ws[addr];
                if (cell?.l?.Target) hyperlinkMap.set(`${r},${c}`, cell.l.Target);
            }
        }
    }
    const raw = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].sheet_to_json(ws, {
        header: 1,
        raw: true,
        defval: null
    });
    const { source: headerSource, dataStart } = findHeaderRow(raw);
    // Keep track of original row indices for hyperlink lookups
    const dataRowsWithIdx = raw.map((r, i)=>({
            row: r,
            rawIdx: i
        })).slice(dataStart).filter(({ row })=>row && row.some((c)=>c != null && c !== ''));
    const dataRows = dataRowsWithIdx.map(({ row })=>row);
    // Determine actual column count from data
    const maxDataWidth = Math.max(headerSource.length, ...dataRows.map((r)=>r.length));
    // Build column labels: null cells in header → auto-generate
    const colLabels = Array.from({
        length: maxDataWidth
    }, (_, i)=>{
        const h = headerSource[i];
        if (h != null && h.trim() !== '') return h.trim();
        const hasData = dataRows.some((r)=>r[i] != null && r[i] !== '');
        if (i === 0 && hasData) return 'Item';
        if (hasData) return `Column ${i + 1}`;
        return '';
    });
    // Collect values per column for type inference
    const colValues = Array.from({
        length: maxDataWidth
    }, ()=>[]);
    for (const row of dataRows){
        for(let i = 0; i < maxDataWidth; i++){
            colValues[i].push(row[i] ?? null);
        }
    }
    const sampleStrings = [];
    for (const row of dataRows.slice(0, 5)){
        for (const v of row){
            if (typeof v === 'string' && v.length > 2 && v.length < 60) sampleStrings.push(v);
        }
    }
    // Build columns (skip truly empty columns)
    const columns = [];
    const colIndexMap = [];
    const usedIds = new Set();
    for(let i = 0; i < maxDataWidth; i++){
        const label = colLabels[i];
        if (!label) continue;
        let id = slugify(label);
        if (usedIds.has(id)) id = `${id}_${i}`;
        usedIds.add(id);
        const type = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$parser$2f$type$2d$inference$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["inferColumnType"])(colValues[i]);
        const semanticRole = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$parser$2f$semantic$2d$detection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["detectSemanticRole"])(label);
        const options = type === 'enum' ? [
            ...new Set(colValues[i].filter((v)=>v != null && v !== '').map(String))
        ].slice(0, 30) : undefined;
        columns.push({
            id,
            excelHeader: label,
            label,
            type,
            semanticRole,
            options
        });
        colIndexMap.push(i);
    }
    const language = detectLanguage(columns.map((c)=>c.label), sampleStrings);
    // Build row objects (use rawIdx to look up hyperlinks per cell)
    const rows = dataRowsWithIdx.map(({ row: rawRow, rawIdx: rowIdx })=>{
        const row = {
            _id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])()
        };
        for(let ci = 0; ci < columns.length; ci++){
            const colIdx = colIndexMap[ci];
            const col = columns[ci];
            // Prefer hyperlink URL over cell text for url/link columns
            const hyperlink = hyperlinkMap.get(`${rowIdx},${colIdx}`);
            let val = rawRow[colIdx] ?? null;
            if (hyperlink && (col.semanticRole === 'link' || col.type === 'url')) {
                val = hyperlink;
            } else if (val instanceof Date) {
                val = val.toISOString().slice(0, 10);
            } else if (typeof val === 'string') {
                val = val.trim() || null;
            } else if (val !== null && val !== undefined) {
            // keep numbers as-is
            } else {
                val = null;
            }
            row[col.id] = val;
        }
        return row;
    });
    const colIds = columns.map((c)=>c.id);
    const structure = detectStructure(columns.map((c)=>c.label), rows, colIds);
    const schema = {
        columns,
        language,
        rowCount: rows.length,
        sheetName,
        structure
    };
    return {
        schema,
        rows
    };
}
}),
"[project]/lib/classifier/domain.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "classifyDomain",
    ()=>classifyDomain
]);
const FINGERPRINTS = [
    {
        id: 'dev_sprint',
        required: [
            'cliente',
            'responsable',
            'estado'
        ],
        strong: [
            'área',
            'area',
            'desarrollo',
            'devops',
            'engineering',
            'sprint',
            'ticket'
        ],
        medium: [
            'asunto',
            'prioridad',
            'fecha límite',
            'link',
            'observaciones',
            'responsable pm'
        ],
        weak: [
            'horario',
            'descripción'
        ],
        forbid: [
            'expediente',
            'paciente',
            'sku',
            'inventario',
            'lead',
            'opportunity',
            'hechos',
            'procedimiento'
        ]
    },
    {
        id: 'legal_pendings',
        required: [
            'carpeta',
            'hechos',
            'procedimiento',
            'cliente'
        ],
        strong: [
            'expediente',
            'arbitraje',
            'demanda',
            'audiencia',
            'sentencia',
            'fiscal',
            'juzgado',
            'sunafil',
            'denuncia',
            'carpeta',
            'hechos',
            'procedimiento'
        ],
        medium: [
            'cliente',
            'responsable',
            'estado',
            'plazo',
            'fecha límite',
            'accion',
            'acción',
            'horario'
        ],
        weak: [
            'observaciones',
            'prioridad',
            'area',
            'área'
        ],
        forbid: [
            'sku',
            'inventario',
            'invoice',
            'paciente',
            'devops',
            'sprint',
            'ticket'
        ]
    },
    {
        id: 'sales_pipeline',
        required: [
            'lead',
            'opportunity',
            'deal',
            'prospect',
            'oportunidad',
            'pipeline'
        ],
        strong: [
            'amount',
            'monto',
            'stage',
            'etapa',
            'close date',
            'won',
            'lost'
        ],
        medium: [
            'contact',
            'company',
            'owner',
            'rep',
            'source'
        ],
        weak: [
            'notes',
            'email',
            'phone'
        ],
        forbid: [
            'expediente',
            'paciente',
            'sku',
            'carpeta'
        ]
    },
    {
        id: 'inventory',
        required: [
            'sku',
            'producto',
            'stock',
            'almacén'
        ],
        strong: [
            'sku',
            'stock',
            'precio',
            'proveedor',
            'inventario',
            'cantidad'
        ],
        medium: [
            'código',
            'descripción',
            'categoría',
            'unidad'
        ],
        weak: [
            'observaciones',
            'fecha'
        ],
        forbid: [
            'expediente',
            'paciente',
            'lead',
            'cliente'
        ]
    },
    {
        id: 'clinic_patients',
        required: [
            'paciente',
            'historia clínica',
            'cita',
            'diagnóstico',
            'médico'
        ],
        strong: [
            'paciente',
            'diagnóstico',
            'médico',
            'cita',
            'historia'
        ],
        medium: [
            'fecha',
            'tratamiento',
            'estado'
        ],
        weak: [
            'observaciones'
        ],
        forbid: [
            'sku',
            'lead',
            'expediente'
        ]
    },
    {
        id: 'hr_roster',
        required: [
            'empleado',
            'puesto',
            'salario',
            'fecha ingreso'
        ],
        strong: [
            'empleado',
            'salario',
            'puesto',
            'departamento',
            'contrato'
        ],
        medium: [
            'fecha ingreso',
            'estado',
            'jefe'
        ],
        weak: [
            'observaciones'
        ],
        forbid: [
            'sku',
            'lead',
            'paciente'
        ]
    }
];
function classifyDomain(headers) {
    const normalized = headers.map((h)=>h.toLowerCase().trim());
    const text = normalized.join(' ');
    const scores = FINGERPRINTS.map((fp)=>{
        if (fp.forbid.some((f)=>text.includes(f))) return {
            id: fp.id,
            score: 0
        };
        if (!fp.required.some((r)=>normalized.some((h)=>h.includes(r)))) {
            return {
                id: fp.id,
                score: 0
            };
        }
        let score = 0;
        for (const h of normalized){
            if (fp.strong.some((k)=>h.includes(k))) score += 3;
            else if (fp.medium.some((k)=>h.includes(k))) score += 2;
            else if (fp.weak.some((k)=>h.includes(k))) score += 1;
        }
        const maxPossible = fp.strong.length * 3 + fp.medium.length * 2 + fp.weak.length;
        return {
            id: fp.id,
            score: score / maxPossible
        };
    });
    const winner = [
        ...scores
    ].sort((a, b)=>b.score - a.score)[0];
    if (!winner || winner.score < 0.2) return {
        domain: 'generic_table',
        confidence: 0
    };
    return {
        domain: winner.id,
        confidence: Math.round(winner.score * 100) / 100
    };
}
}),
"[project]/lib/binder/colors.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COLOR_CLASSES",
    ()=>COLOR_CLASSES,
    "assignColors",
    ()=>assignColors
]);
const SEMANTIC_COLORS = {
    positive: [
        'done',
        'completo',
        'listo',
        'finalizado',
        'aprobado',
        'won',
        'closed',
        'completed'
    ],
    negative: [
        'cancelled',
        'cancelado',
        'rejected',
        'rechazado',
        'lost',
        'overdue',
        'vencido'
    ],
    warning: [
        'urgente',
        'urgent',
        'high',
        'alta',
        'critical',
        'crítico'
    ],
    inProgress: [
        'en progreso',
        'in progress',
        'doing',
        'activo',
        'open',
        'abierto',
        'en proceso',
        'proceso'
    ],
    pending: [
        'pendiente',
        'pending',
        'todo',
        'esperando',
        'waiting'
    ],
    media: [
        'media',
        'medium',
        'normal'
    ],
    baja: [
        'baja',
        'low',
        'minor'
    ]
};
const PALETTE = {
    positive: 'emerald',
    negative: 'rose',
    warning: 'rose',
    inProgress: 'sky',
    pending: 'amber',
    media: 'indigo',
    baja: 'slate',
    default: 'slate'
};
function assignColors(enumValues) {
    const result = {};
    for (const val of enumValues){
        const norm = val.toLowerCase().trim();
        let assigned = 'default';
        for (const [category, terms] of Object.entries(SEMANTIC_COLORS)){
            if (terms.some((t)=>norm.includes(t))) {
                assigned = category;
                break;
            }
        }
        result[val] = PALETTE[assigned] ?? PALETTE.default;
    }
    return result;
}
const COLOR_CLASSES = {
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-950',
        text: 'text-emerald-800 dark:text-emerald-200'
    },
    sky: {
        bg: 'bg-sky-50 dark:bg-sky-950',
        text: 'text-sky-800 dark:text-sky-200'
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-950',
        text: 'text-amber-800 dark:text-amber-200'
    },
    rose: {
        bg: 'bg-rose-50 dark:bg-rose-950',
        text: 'text-rose-800 dark:text-rose-200'
    },
    indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-950',
        text: 'text-indigo-800 dark:text-indigo-200'
    },
    violet: {
        bg: 'bg-violet-50 dark:bg-violet-950',
        text: 'text-violet-800 dark:text-violet-200'
    },
    slate: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300'
    },
    default: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300'
    }
};
}),
"[project]/lib/binder/binder.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bindColumns",
    ()=>bindColumns,
    "buildColorMaps",
    ()=>buildColorMaps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$binder$2f$colors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/binder/colors.ts [app-route] (ecmascript)");
;
const TEMPLATE_SLOTS = {
    dev_sprint: [
        {
            role: 'identifier',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'client',
            required: true,
            fallback: 'firstText'
        },
        {
            role: 'status',
            required: true,
            fallback: 'firstEnum'
        },
        {
            role: 'priority',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'assignee',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'deadline',
            required: false,
            fallback: 'firstDate'
        },
        {
            role: 'description',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'notes',
            required: false
        },
        {
            role: 'link',
            required: false
        },
        {
            role: 'area',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'action',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'pm',
            required: false,
            fallback: 'firstText'
        }
    ],
    legal_pendings: [
        {
            role: 'identifier',
            required: true,
            fallback: 'firstText'
        },
        {
            role: 'client',
            required: true,
            fallback: 'firstText'
        },
        {
            role: 'status',
            required: true,
            fallback: 'firstEnum'
        },
        {
            role: 'priority',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'assignee',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'deadline',
            required: false,
            fallback: 'firstDate'
        },
        {
            role: 'description',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'area',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'action',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'link',
            required: false
        },
        {
            role: 'pm',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'notes',
            required: false
        }
    ],
    sales_pipeline: [
        {
            role: 'client',
            required: true,
            fallback: 'firstText'
        },
        {
            role: 'status',
            required: true,
            fallback: 'firstEnum'
        },
        {
            role: 'priority',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'assignee',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'deadline',
            required: false,
            fallback: 'firstDate'
        },
        {
            role: 'description',
            required: false,
            fallback: 'firstText'
        }
    ],
    inventory: [
        {
            role: 'identifier',
            required: true,
            fallback: 'firstText'
        },
        {
            role: 'description',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'status',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'notes',
            required: false
        }
    ],
    clinic_patients: [
        {
            role: 'client',
            required: true,
            fallback: 'firstText'
        },
        {
            role: 'status',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'assignee',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'deadline',
            required: false,
            fallback: 'firstDate'
        },
        {
            role: 'notes',
            required: false
        }
    ],
    hr_roster: [
        {
            role: 'client',
            required: true,
            fallback: 'firstText'
        },
        {
            role: 'status',
            required: false,
            fallback: 'firstEnum'
        },
        {
            role: 'description',
            required: false,
            fallback: 'firstText'
        },
        {
            role: 'notes',
            required: false
        }
    ],
    generic_table: []
};
function findByRole(columns, role, used) {
    return columns.find((c)=>c.semanticRole === role && !used.has(c.id));
}
function findFallback(columns, kind, used) {
    switch(kind){
        case 'firstEnum':
            return columns.find((c)=>c.type === 'enum' && !used.has(c.id));
        case 'firstDate':
            return columns.find((c)=>c.type === 'date' && !used.has(c.id));
        case 'firstText':
            return columns.find((c)=>c.type === 'text' && !used.has(c.id));
        case 'firstNumber':
            return columns.find((c)=>c.type === 'number' && !used.has(c.id));
        default:
            return undefined;
    }
}
// Extra raw column bindings: find a column whose id contains the partial string
const DEV_SPRINT_EXTRA = {
    hechos: [
        'hechos'
    ],
    procedimiento: [
        'procedimiento'
    ],
    horario: [
        'horario'
    ],
    fecha_actual: [
        'fecha_actual'
    ]
};
function bindColumns(schema, domain) {
    const slots = TEMPLATE_SLOTS[domain] ?? [];
    const bindings = {};
    const used = new Set();
    for (const slot of slots){
        const match = findByRole(schema.columns, slot.role, used);
        if (match) {
            bindings[slot.role] = match.id;
            used.add(match.id);
            continue;
        }
        if (slot.fallback) {
            const fb = findFallback(schema.columns, slot.fallback, used);
            if (fb) {
                bindings[slot.role] = fb.id;
                used.add(fb.id);
            }
        }
    }
    // Add raw column bindings for known extra fields
    if (domain === 'dev_sprint') {
        for (const [key, partials] of Object.entries(DEV_SPRINT_EXTRA)){
            if (bindings[key]) continue;
            for (const partial of partials){
                const col = schema.columns.find((c)=>c.id.includes(partial));
                if (col) {
                    bindings[key] = col.id;
                    break;
                }
            }
        }
    }
    return bindings;
}
function buildColorMaps(schema, bindings) {
    const maps = {};
    for (const role of [
        'status',
        'priority',
        'action',
        'area'
    ]){
        const colId = bindings[role];
        if (!colId) continue;
        const col = schema.columns.find((c)=>c.id === colId);
        if (col?.options) maps[role] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$binder$2f$colors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["assignColors"])(col.options);
    }
    return maps;
}
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/lib/server/storage.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addRecord",
    ()=>addRecord,
    "deleteProject",
    ()=>deleteProject,
    "deleteRecord",
    ()=>deleteRecord,
    "getExcelPath",
    ()=>getExcelPath,
    "getProject",
    ()=>getProject,
    "getTotalRowCount",
    ()=>getTotalRowCount,
    "listProjects",
    ()=>listProjects,
    "readExcelBuffer",
    ()=>readExcelBuffer,
    "readRecords",
    ()=>readRecords,
    "saveExcelBuffer",
    ()=>saveExcelBuffer,
    "saveProject",
    ()=>saveProject,
    "updateRecord",
    ()=>updateRecord,
    "writeRecords",
    ()=>writeRecords
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const DATA_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'data');
const PROJECTS_FILE = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'projects.json');
function ensureDataDir(projectId) {
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(DATA_DIR, {
        recursive: true
    });
    if (projectId) {
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'projects', projectId, 'records'), {
            recursive: true
        });
    }
}
function readProjectsIndex() {
    ensureDataDir();
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(PROJECTS_FILE)) return [];
    try {
        return JSON.parse(__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(PROJECTS_FILE, 'utf-8'));
    } catch  {
        return [];
    }
}
function writeProjectsIndex(projects) {
    ensureDataDir();
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}
function listProjects() {
    return readProjectsIndex().sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
function getProject(id) {
    const all = readProjectsIndex();
    return all.find((p)=>p.id === id) ?? null;
}
function saveProject(project) {
    ensureDataDir(project.id);
    const all = readProjectsIndex();
    const idx = all.findIndex((p)=>p.id === project.id);
    if (idx >= 0) all[idx] = project;
    else all.push(project);
    writeProjectsIndex(all);
}
function deleteProject(id) {
    const all = readProjectsIndex().filter((p)=>p.id !== id);
    writeProjectsIndex(all);
    const dir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'projects', id);
    if (__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(dir)) __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].rmSync(dir, {
        recursive: true
    });
}
function getExcelPath(projectId) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'projects', projectId, 'source.xlsx');
}
function saveExcelBuffer(projectId, buffer) {
    ensureDataDir(projectId);
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(getExcelPath(projectId), buffer);
}
function readExcelBuffer(projectId) {
    const p = getExcelPath(projectId);
    return __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(p) ? __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(p) : null;
}
// ─── Records (per section) ────────────────────────────────────────────────────
function recordsPath(projectId, sectionIdx) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'projects', projectId, 'records', `section_${sectionIdx}.json`);
}
function readRecords(projectId, sectionIdx) {
    const p = recordsPath(projectId, sectionIdx);
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(p)) return [];
    try {
        return JSON.parse(__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(p, 'utf-8'));
    } catch  {
        return [];
    }
}
function writeRecords(projectId, sectionIdx, rows) {
    ensureDataDir(projectId);
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(recordsPath(projectId, sectionIdx), JSON.stringify(rows, null, 2));
}
function addRecord(projectId, sectionIdx, row) {
    const rows = readRecords(projectId, sectionIdx);
    rows.push(row);
    writeRecords(projectId, sectionIdx, rows);
    return row;
}
function updateRecord(projectId, sectionIdx, rowId, patch) {
    const rows = readRecords(projectId, sectionIdx);
    const idx = rows.findIndex((r)=>r._id === rowId);
    if (idx < 0) return null;
    rows[idx] = {
        ...rows[idx],
        ...patch,
        _id: rowId
    };
    writeRecords(projectId, sectionIdx, rows);
    return rows[idx];
}
function deleteRecord(projectId, sectionIdx, rowId) {
    const rows = readRecords(projectId, sectionIdx);
    const filtered = rows.filter((r)=>r._id !== rowId);
    if (filtered.length === rows.length) return false;
    writeRecords(projectId, sectionIdx, filtered);
    return true;
}
function getTotalRowCount(projectId, project) {
    return project.sections.reduce((total, _, i)=>total + readRecords(projectId, i).length, 0);
}
}),
"[project]/app/api/projects/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist-node/v4.js [app-route] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$excel$2d$reader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/server/excel-reader.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$classifier$2f$domain$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/classifier/domain.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$binder$2f$binder$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/binder/binder.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/server/storage.ts [app-route] (ecmascript)");
;
;
;
;
;
;
const runtime = 'nodejs';
async function GET(request) {
    try {
        const orgId = request.nextUrl.searchParams.get('org');
        let projects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listProjects"])();
        if (orgId) projects = projects.filter((p)=>p.orgId === orgId);
        const items = projects.map((p)=>({
                id: p.id,
                orgId: p.orgId,
                name: p.name,
                originalFilename: p.originalFilename,
                createdAt: p.createdAt,
                sectionCount: p.sections.length,
                totalRows: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getTotalRowCount"])(p.id, p),
                domains: p.sections.map((s)=>s.domain)
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(items);
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: String(e)
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const selectedSheets = formData.get('sheets')?.split(',').filter(Boolean) ?? [];
        const name = formData.get('name')?.trim() || 'Mi proyecto';
        if (!file) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'No file provided'
        }, {
            status: 400
        });
        if (selectedSheets.length === 0) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'No sheets selected'
        }, {
            status: 400
        });
        const orgId = formData.get('orgId')?.trim() || undefined;
        const buffer = Buffer.from(await file.arrayBuffer());
        const projectId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        // Save original Excel
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["saveExcelBuffer"])(projectId, buffer);
        // Parse each selected sheet
        const sections = [];
        for (const sheetName of selectedSheets){
            const { schema, rows } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$excel$2d$reader$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseSheet"])(buffer, sheetName);
            const { domain } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$classifier$2f$domain$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["classifyDomain"])(schema.columns.map((c)=>c.excelHeader));
            const bindings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$binder$2f$binder$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bindColumns"])(schema, domain);
            const colorMaps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$binder$2f$binder$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildColorMaps"])(schema, bindings);
            sections.push({
                sheetName,
                domain,
                schema,
                bindings,
                colorMaps
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeRecords"])(projectId, sections.length - 1, rows);
        }
        const project = {
            id: projectId,
            orgId,
            name,
            originalFilename: file.name,
            createdAt: new Date().toISOString(),
            sections
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["saveProject"])(project);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            id: projectId,
            name
        }, {
            status: 201
        });
    } catch (e) {
        console.error('Create project error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: String(e)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0jq5_6p._.js.map
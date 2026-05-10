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
"[project]/app/api/projects/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/server/storage.ts [app-route] (ecmascript)");
;
;
const runtime = 'nodejs';
async function GET(_req, { params }) {
    const { id } = await params;
    const project = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProject"])(id);
    if (!project) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Not found'
    }, {
        status: 404
    });
    const sections = project.sections.map((section, i)=>({
            ...section,
            records: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readRecords"])(id, i)
        }));
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ...project,
        sections
    });
}
async function DELETE(_req, { params }) {
    const { id } = await params;
    const project = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProject"])(id);
    if (!project) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Not found'
    }, {
        status: 404
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deleteProject"])(id);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__10qu498._.js.map
module.exports = [
"[project]/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "avatarColor",
    ()=>avatarColor,
    "cn",
    ()=>cn,
    "daysUntil",
    ()=>daysUntil,
    "fmtDate",
    ()=>fmtDate,
    "initials",
    ()=>initials,
    "truncate",
    ()=>truncate
]);
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
function initials(name) {
    if (!name) return '??';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
const AVATAR_COLORS = [
    'bg-indigo-100 text-indigo-800',
    'bg-emerald-100 text-emerald-800',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-800',
    'bg-sky-100 text-sky-800',
    'bg-violet-100 text-violet-800'
];
function avatarColor(name) {
    let h = 0;
    for (const c of String(name ?? ''))h = h * 31 + c.charCodeAt(0) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function fmtDate(s) {
    if (!s) return '—';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(s);
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
function daysUntil(s) {
    if (!s) return null;
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const target = new Date(+m[1], +m[2] - 1, +m[3]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
}
function truncate(s, n) {
    if (!s) return '';
    const flat = String(s).replace(/\n/g, ' ');
    return flat.length > n ? flat.slice(0, n) + '…' : flat;
}
}),
"[project]/components/StructuredViews.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BudgetView",
    ()=>BudgetView,
    "FinancialReportView",
    ()=>FinancialReportView,
    "KVTableView",
    ()=>KVTableView,
    "TimeSeriesView",
    ()=>TimeSeriesView,
    "scenarioVerdictStyle",
    ()=>scenarioVerdictStyle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
// ─── Colour palette (LexDesk) ─────────────────────────────────────────────────
const C = {
    bg: '#fff',
    bg2: '#f5f7fa',
    bg3: '#eef1f5',
    text: '#0f172a',
    text2: '#475569',
    text3: '#94a3b8',
    border: 'rgba(15,23,42,0.10)',
    borderMd: 'rgba(15,23,42,0.18)',
    green: '#065F46',
    greenBg: '#D1FAE5',
    red: '#9F1239',
    redBg: '#FFE4E6',
    amber: '#78350F',
    amberBg: '#FEF3C7',
    indigo: '#4F46E5',
    indigoBg: '#EEF2FF',
    violet: '#5B21B6',
    violetBg: '#EDE9FE'
};
const CHART_COLORS = [
    '#4F46E5',
    '#7C3AED',
    '#059669',
    '#B45309',
    '#E11D48',
    '#0EA5E9',
    '#8B5CF6',
    '#F59E0B'
];
// ─── Number formatting ────────────────────────────────────────────────────────
function fmt(raw, header = '') {
    if (raw == null || raw === '') return '—';
    const s = String(raw).trim();
    if (s === '—' || s === '') return '—';
    const n = Number(s);
    if (isNaN(n)) return s;
    const h = header.toLowerCase();
    // Percentage: header has % or the value is between -1 and 1 with many decimals
    if (/%|percent|rate|margin|penetration|churn/i.test(h) || Math.abs(n) < 1 && s.includes('.')) {
        const pct = Math.abs(n) <= 1 ? n * 100 : n;
        return `${pct >= 0 ? '' : ''}${pct.toFixed(1)}%`;
    }
    // Ratio
    if (/ratio|ltv.*cac/i.test(h)) return `${n.toFixed(1)}×`;
    // Currency / large number
    if (/\$|amount|revenue|income|expense|cost|price|budget|grant|profit|loss|cogs|mrr|arr|arpu|ltv|cac|payback/i.test(h) || Math.abs(n) >= 100) {
        const abs = Math.abs(n);
        const formatted = abs >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : abs >= 1000 ? `$${n.toLocaleString('en-US', {
            maximumFractionDigits: 0
        })}` : `$${n.toFixed(2)}`;
        return formatted;
    }
    // Years / months
    if (/year|month|lifetime|period/i.test(h)) return n.toFixed(1);
    return n.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        maximumSignificantDigits: 4
    });
}
function numColor(raw) {
    const n = Number(String(raw ?? '').replace(/[,$%]/g, ''));
    if (isNaN(n)) return undefined;
    if (n < 0) return C.red;
    if (n > 0) return C.green;
    return undefined;
}
function isSectionHeader(row, cols) {
    // A row where the first value is ALL-CAPS text and all other values are empty
    if (!cols.length) return false;
    const firstVal = String(row[cols[0].id] ?? '').trim();
    const rest = cols.slice(1).map((c)=>row[c.id]);
    const otherEmpty = rest.every((v)=>v == null || v === '');
    return otherEmpty && firstVal.length > 3 && firstVal === firstVal.toUpperCase() && /[A-Z]{2}/.test(firstVal) && !/^\d/.test(firstVal);
}
function isTotalRow(row, cols) {
    const firstVal = String(row[cols[0]?.id] ?? '').toUpperCase();
    return /^(total|gross|net|operating|full year|SUBTOTAL)/i.test(firstVal);
}
function KVTableView({ section, onEditRow }) {
    const cols = section.schema.columns;
    const rows = section.records;
    const paramCol = cols[0];
    const valueCol = cols[1];
    const notesCol = cols[2];
    // Group rows by section headers
    const groups = [];
    let current = {
        header: null,
        rows: []
    };
    for (const row of rows){
        if (isSectionHeader(row, cols)) {
            if (current.rows.length > 0 || current.header) groups.push(current);
            current = {
                header: String(row[paramCol?.id] ?? ''),
                rows: []
            };
        } else if (row[paramCol?.id] != null && row[paramCol?.id] !== '') {
            current.rows.push(row);
        }
    }
    if (current.rows.length > 0 || current.header) groups.push(current);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-5",
        children: groups.map((grp, gi)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl overflow-hidden",
                style: {
                    background: C.bg,
                    border: `0.5px solid ${C.border}`
                },
                children: [
                    grp.header && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-5 py-3 flex items-center gap-2",
                        style: {
                            background: C.indigoBg,
                            borderBottom: `0.5px solid ${C.border}`
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[11px] font-bold uppercase tracking-widest",
                            style: {
                                color: C.indigo
                            },
                            children: grp.header
                        }, void 0, false, {
                            fileName: "[project]/components/StructuredViews.tsx",
                            lineNumber: 120,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/StructuredViews.tsx",
                        lineNumber: 118,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: grp.rows.map((row, i)=>{
                                const param = String(row[paramCol?.id] ?? '');
                                const value = row[valueCol?.id];
                                const note = notesCol ? String(row[notesCol.id] ?? '') : '';
                                const fmtVal = fmt(value, param);
                                const color = numColor(value);
                                const isLastRow = i === grp.rows.length - 1;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    onClick: ()=>onEditRow(row),
                                    style: {
                                        borderBottom: isLastRow ? 'none' : `0.5px solid ${C.border}`,
                                        cursor: 'pointer'
                                    },
                                    onMouseEnter: (e)=>e.currentTarget.style.background = C.bg2,
                                    onMouseLeave: (e)=>e.currentTarget.style.background = '',
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-5 py-3",
                                            style: {
                                                width: '45%',
                                                color: C.text,
                                                fontSize: 13,
                                                fontWeight: 500
                                            },
                                            children: param
                                        }, void 0, false, {
                                            fileName: "[project]/components/StructuredViews.tsx",
                                            lineNumber: 139,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-5 py-3",
                                            style: {
                                                width: '20%',
                                                textAlign: 'right'
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-[14px]",
                                                style: {
                                                    color: color ?? C.text,
                                                    fontVariantNumeric: 'tabular-nums'
                                                },
                                                children: fmtVal
                                            }, void 0, false, {
                                                fileName: "[project]/components/StructuredViews.tsx",
                                                lineNumber: 143,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/StructuredViews.tsx",
                                            lineNumber: 142,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-5 py-3",
                                            style: {
                                                width: '35%',
                                                color: C.text3,
                                                fontSize: 12,
                                                lineHeight: 1.4
                                            },
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(note, 80)
                                        }, void 0, false, {
                                            fileName: "[project]/components/StructuredViews.tsx",
                                            lineNumber: 147,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, row._id ?? i, true, {
                                    fileName: "[project]/components/StructuredViews.tsx",
                                    lineNumber: 134,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/components/StructuredViews.tsx",
                            lineNumber: 124,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/StructuredViews.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this)
                ]
            }, gi, true, {
                fileName: "[project]/components/StructuredViews.tsx",
                lineNumber: 116,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/components/StructuredViews.tsx",
        lineNumber: 114,
        columnNumber: 5
    }, this);
}
function FinancialReportView({ section }) {
    const cols = section.schema.columns;
    const rows = section.records;
    if (!cols.length) return null;
    const rowLabelCol = cols[0];
    const periodCols = cols.slice(1);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl overflow-hidden",
        style: {
            background: C.bg,
            border: `0.5px solid ${C.border}`
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "overflow-x-auto",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                className: "w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            style: {
                                background: C.bg2,
                                borderBottom: `0.5px solid ${C.border}`
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "px-5 py-3 text-left",
                                    style: {
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: C.text3,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        width: '35%'
                                    },
                                    children: rowLabelCol.label || 'Item'
                                }, void 0, false, {
                                    fileName: "[project]/components/StructuredViews.tsx",
                                    lineNumber: 177,
                                    columnNumber: 15
                                }, this),
                                periodCols.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-4 py-3 text-right",
                                        style: {
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: C.text3,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            whiteSpace: 'nowrap'
                                        },
                                        children: col.label.replace(/\n/g, ' ')
                                    }, col.id, false, {
                                        fileName: "[project]/components/StructuredViews.tsx",
                                        lineNumber: 181,
                                        columnNumber: 17
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/StructuredViews.tsx",
                            lineNumber: 176,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/StructuredViews.tsx",
                        lineNumber: 175,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                        children: rows.map((row, i)=>{
                            const firstVal = String(row[rowLabelCol.id] ?? '').trim();
                            const isSection = isSectionHeader(row, cols);
                            const isTotal = !isSection && isTotalRow(row, cols);
                            const isMargin = firstVal.toLowerCase().includes('margin') || firstVal.toLowerCase().includes('%');
                            if (isSection) {
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        colSpan: periodCols.length + 1,
                                        className: "px-5 pt-5 pb-2",
                                        style: {
                                            background: '#fafafa',
                                            borderBottom: `0.5px solid ${C.borderMd}`
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-bold uppercase tracking-widest",
                                            style: {
                                                color: C.text3
                                            },
                                            children: firstVal
                                        }, void 0, false, {
                                            fileName: "[project]/components/StructuredViews.tsx",
                                            lineNumber: 199,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/StructuredViews.tsx",
                                        lineNumber: 197,
                                        columnNumber: 21
                                    }, this)
                                }, row._id ?? i, false, {
                                    fileName: "[project]/components/StructuredViews.tsx",
                                    lineNumber: 196,
                                    columnNumber: 19
                                }, this);
                            }
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                style: {
                                    borderBottom: `0.5px solid ${C.border}`,
                                    background: isTotal ? C.bg2 : 'transparent',
                                    fontWeight: isTotal ? 700 : 400
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "px-5 py-2.5",
                                        style: {
                                            fontSize: 13,
                                            color: C.text,
                                            paddingLeft: firstVal.startsWith('  ') ? 28 : 20
                                        },
                                        children: firstVal.trim() || '—'
                                    }, void 0, false, {
                                        fileName: "[project]/components/StructuredViews.tsx",
                                        lineNumber: 211,
                                        columnNumber: 19
                                    }, this),
                                    periodCols.map((col)=>{
                                        const v = row[col.id];
                                        const fmtd = fmt(v, isMargin ? '%' : col.label);
                                        const clr = isTotal || isMargin ? numColor(v) : undefined;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-2.5 text-right",
                                            style: {
                                                fontSize: 13,
                                                color: clr ?? C.text,
                                                fontVariantNumeric: 'tabular-nums',
                                                whiteSpace: 'nowrap'
                                            },
                                            children: fmtd
                                        }, col.id, false, {
                                            fileName: "[project]/components/StructuredViews.tsx",
                                            lineNumber: 222,
                                            columnNumber: 23
                                        }, this);
                                    })
                                ]
                            }, row._id ?? i, true, {
                                fileName: "[project]/components/StructuredViews.tsx",
                                lineNumber: 206,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/components/StructuredViews.tsx",
                        lineNumber: 187,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/StructuredViews.tsx",
                lineNumber: 174,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/StructuredViews.tsx",
            lineNumber: 173,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/StructuredViews.tsx",
        lineNumber: 171,
        columnNumber: 5
    }, this);
}
function TimeSeriesView({ section }) {
    const cols = section.schema.columns;
    const rows = section.records;
    if (!cols.length) return null;
    const [highlight, setHighlight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Detect which column is "net income" for color coding
    const netCol = cols.find((c)=>/net|income|profit|loss/i.test(c.label) && c !== cols[0]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl overflow-hidden",
        style: {
            background: C.bg,
            border: `0.5px solid ${C.border}`
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                style: {
                                    background: C.bg2,
                                    borderBottom: `0.5px solid ${C.border}`
                                },
                                children: cols.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        onClick: ()=>setHighlight((h)=>h === col.id ? null : col.id),
                                        className: "px-4 py-3 text-left whitespace-nowrap cursor-pointer select-none",
                                        style: {
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: highlight === col.id ? C.indigo : C.text3,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            background: highlight === col.id ? C.indigoBg : 'transparent'
                                        },
                                        children: col.label.replace(/\n/g, ' ')
                                    }, col.id, false, {
                                        fileName: "[project]/components/StructuredViews.tsx",
                                        lineNumber: 257,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/StructuredViews.tsx",
                                lineNumber: 255,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/StructuredViews.tsx",
                            lineNumber: 254,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: rows.map((row, i)=>{
                                const firstVal = String(row[cols[0]?.id] ?? '').toUpperCase();
                                const isTotal = /^(full|total|annual|sum)/i.test(firstVal);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    style: {
                                        borderBottom: `0.5px solid ${C.border}`,
                                        fontWeight: isTotal ? 700 : 400,
                                        background: isTotal ? '#fffbeb' : 'transparent'
                                    },
                                    children: cols.map((col, ci)=>{
                                        const v = row[col.id];
                                        const fmtd = ci === 0 ? String(v ?? '—') : fmt(v, col.label);
                                        let color;
                                        if (col === netCol && typeof v === 'number') color = numColor(v);
                                        else if (highlight === col.id) color = C.indigo;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-2.5",
                                            style: {
                                                fontSize: 13,
                                                color: color ?? C.text,
                                                textAlign: ci === 0 ? 'left' : 'right',
                                                background: highlight === col.id ? '#fafaff' : 'transparent',
                                                fontVariantNumeric: 'tabular-nums',
                                                whiteSpace: 'nowrap'
                                            },
                                            children: fmtd
                                        }, col.id, false, {
                                            fileName: "[project]/components/StructuredViews.tsx",
                                            lineNumber: 289,
                                            columnNumber: 23
                                        }, this);
                                    })
                                }, row._id ?? i, false, {
                                    fileName: "[project]/components/StructuredViews.tsx",
                                    lineNumber: 276,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/components/StructuredViews.tsx",
                            lineNumber: 270,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/StructuredViews.tsx",
                    lineNumber: 253,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/StructuredViews.tsx",
                lineNumber: 252,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-2 text-[11px]",
                style: {
                    color: C.text3,
                    borderTop: `0.5px solid ${C.border}`,
                    background: C.bg2
                },
                children: "Click any column header to highlight it"
            }, void 0, false, {
                fileName: "[project]/components/StructuredViews.tsx",
                lineNumber: 307,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/StructuredViews.tsx",
        lineNumber: 251,
        columnNumber: 5
    }, this);
}
function BudgetView({ section, onEditRow, onAddRow }) {
    const cols = section.schema.columns;
    const rows = section.records;
    const catCol = cols[0];
    const amtCol = cols.find((c)=>/amount|cost|\$|monto/i.test(c.label)) ?? cols[1];
    const pctCol = cols.find((c)=>/%|percent/i.test(c.label)) ?? cols[2];
    const purposeCol = cols.find((c)=>/purpose|description|note|reason/i.test(c.label)) ?? cols[3];
    const totalAmt = rows.reduce((s, r)=>{
        const v = Number(r[amtCol?.id] ?? 0);
        return isNaN(v) ? s : s + v;
    }, 0);
    // Filter out "TOTAL" rows from items list
    const items = rows.filter((r)=>!/^total/i.test(String(r[catCol?.id] ?? '')));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl p-5 flex items-center justify-between",
                style: {
                    background: C.indigoBg,
                    border: `0.5px solid rgba(79,70,229,0.2)`
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[11px] font-bold uppercase tracking-widest mb-1",
                                style: {
                                    color: C.indigo
                                },
                                children: "Total Budget"
                            }, void 0, false, {
                                fileName: "[project]/components/StructuredViews.tsx",
                                lineNumber: 341,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[32px] font-semibold leading-none",
                                style: {
                                    color: C.indigo
                                },
                                children: fmt(totalAmt, '$')
                            }, void 0, false, {
                                fileName: "[project]/components/StructuredViews.tsx",
                                lineNumber: 342,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/StructuredViews.tsx",
                        lineNumber: 340,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onAddRow,
                        className: "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90",
                        style: {
                            background: C.indigo,
                            boxShadow: '0 2px 8px rgba(79,70,229,0.25)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "13",
                                height: "13",
                                viewBox: "0 0 13 13",
                                fill: "none",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M6.5 1.5v10M1.5 6.5h10",
                                    stroke: "currentColor",
                                    strokeWidth: "1.7",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/components/StructuredViews.tsx",
                                    lineNumber: 347,
                                    columnNumber: 71
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/StructuredViews.tsx",
                                lineNumber: 347,
                                columnNumber: 11
                            }, this),
                            "Add item"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/StructuredViews.tsx",
                        lineNumber: 344,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/StructuredViews.tsx",
                lineNumber: 339,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-2.5",
                children: items.map((row, i)=>{
                    const cat = String(row[catCol?.id] ?? '');
                    const amt = Number(row[amtCol?.id] ?? 0);
                    const pct = pctCol ? Number(row[pctCol.id] ?? 0) : totalAmt > 0 ? amt / totalAmt : 0;
                    const pctDisplay = (Math.abs(pct) <= 1 ? pct * 100 : pct).toFixed(1);
                    const purpose = purposeCol ? String(row[purposeCol.id] ?? '') : '';
                    const barPct = totalAmt > 0 ? amt / totalAmt * 100 : 0;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: ()=>onEditRow(row),
                        className: "rounded-xl p-4 cursor-pointer transition-colors",
                        style: {
                            background: C.bg,
                            border: `0.5px solid ${C.border}`
                        },
                        onMouseEnter: (e)=>e.currentTarget.style.background = C.bg2,
                        onMouseLeave: (e)=>e.currentTarget.style.background = C.bg,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between mb-2.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[14px] font-semibold",
                                                style: {
                                                    color: C.text
                                                },
                                                children: cat
                                            }, void 0, false, {
                                                fileName: "[project]/components/StructuredViews.tsx",
                                                lineNumber: 373,
                                                columnNumber: 19
                                            }, this),
                                            purpose && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[12px] mt-0.5 leading-snug",
                                                style: {
                                                    color: C.text3
                                                },
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(purpose, 80)
                                            }, void 0, false, {
                                                fileName: "[project]/components/StructuredViews.tsx",
                                                lineNumber: 374,
                                                columnNumber: 31
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/StructuredViews.tsx",
                                        lineNumber: 372,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-right flex-shrink-0 ml-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[18px] font-semibold",
                                                style: {
                                                    color: C.text,
                                                    fontVariantNumeric: 'tabular-nums'
                                                },
                                                children: fmt(amt, '$')
                                            }, void 0, false, {
                                                fileName: "[project]/components/StructuredViews.tsx",
                                                lineNumber: 377,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] font-medium",
                                                style: {
                                                    color: C.text3
                                                },
                                                children: [
                                                    pctDisplay,
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/StructuredViews.tsx",
                                                lineNumber: 380,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/StructuredViews.tsx",
                                        lineNumber: 376,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/StructuredViews.tsx",
                                lineNumber: 371,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-1.5 rounded-full",
                                style: {
                                    background: C.bg3
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-full rounded-full transition-all duration-700",
                                    style: {
                                        width: `${barPct}%`,
                                        background: CHART_COLORS[i % CHART_COLORS.length]
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/StructuredViews.tsx",
                                    lineNumber: 385,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/StructuredViews.tsx",
                                lineNumber: 384,
                                columnNumber: 15
                            }, this)
                        ]
                    }, row._id ?? i, true, {
                        fileName: "[project]/components/StructuredViews.tsx",
                        lineNumber: 365,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/components/StructuredViews.tsx",
                lineNumber: 353,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/StructuredViews.tsx",
        lineNumber: 337,
        columnNumber: 5
    }, this);
}
function scenarioVerdictStyle(val) {
    const v = (val || '').toLowerCase();
    if (/healthy|strong|good/i.test(v)) return {
        background: '#D1FAE5',
        color: '#065F46'
    };
    if (/profitable|profit/i.test(v)) return {
        background: '#EEF2FF',
        color: '#3730A3'
    };
    if (/breakeven|restructure/i.test(v)) return {
        background: '#FEF3C7',
        color: '#78350F'
    };
    if (/loss|fail|critical/i.test(v)) return {
        background: '#FFE4E6',
        color: '#9F1239'
    };
    return {
        background: '#F1F5F9',
        color: '#1E293B'
    };
}
}),
"[project]/components/ProjectApp.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProjectApp",
    ()=>ProjectApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StructuredViews$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/StructuredViews.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
// ─── LexDesk exact colours (from intra-app.html CSS vars) ──────────────────
const C = {
    indigo50: '#EEF2FF',
    indigo600: '#4F46E5',
    indigo800: '#3730A3',
    indigo900: '#1E1B4B',
    emerald50: '#D1FAE5',
    emerald600: '#059669',
    emerald800: '#065F46',
    amber50: '#FEF3C7',
    amber600: '#B45309',
    amber800: '#78350F',
    rose50: '#FFE4E6',
    rose600: '#E11D48',
    rose800: '#9F1239',
    sky50: '#E0F2FE',
    sky800: '#075985',
    violet50: '#EDE9FE',
    violet800: '#5B21B6',
    slate50: '#F1F5F9',
    slate800: '#1E293B',
    bg: '#ffffff',
    bg2: '#f5f7fa',
    bg3: '#eef1f5',
    text: '#0f172a',
    text2: '#475569',
    text3: '#94a3b8',
    border: 'rgba(15,23,42,0.10)',
    borderMd: 'rgba(15,23,42,0.18)'
};
const CHART_COLORS = [
    C.indigo600,
    '#7C3AED',
    C.emerald600,
    C.amber600,
    C.rose600,
    '#0EA5E9',
    '#8B5CF6'
];
// ─── i18n ────────────────────────────────────────────────────────────────────
function T(l) {
    const base = {
        dashboard: 'Overview',
        records: 'Records',
        plazos: 'Deadlines',
        equipo: 'Team',
        add: 'Add row',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit row',
        back: 'Projects',
        download: 'Download Excel',
        downloading: 'Downloading…',
        search: 'Search all fields…',
        all: 'All',
        total: 'Total',
        noRows: 'No rows yet — click «Add row» above to add the first one.',
        noResults: 'No results match your filter.',
        confirmDel: 'Delete this record?',
        essential: 'Key fields',
        extra: 'More fields',
        notes: 'Long text fields',
        addAnother: 'Add another row after saving',
        auto: 'Auto',
        sel: 'Select…',
        overdue: 'Overdue',
        today: 'Today',
        thisWeek: 'This week',
        next30: 'Next 30 days',
        later: 'Later',
        noDeadlines: 'No deadlines found.',
        teamLoad: 'Team workload',
        noTeam: 'No assignee column detected.',
        dIn: (n)=>`In ${n}d`,
        dAgo: (n)=>`${n}d overdue`,
        notFound: 'Project not found',
        loading: 'Loading project…',
        recientes: 'Recent rows',
        upcoming: 'Upcoming deadlines',
        kpiUrgent: 'High priority',
        kpiOverdue: 'Overdue',
        kpiWeek: 'Due this week',
        byGroup: 'Breakdown',
        areas: 'Areas',
        main: 'MAIN',
        manage: 'MANAGE',
        steps: 'Steps',
        reference: 'Reference',
        observations: 'Notes',
        tasksDone: (n)=>`${n} steps`,
        addRowTitle: 'New row',
        editRowTitle: 'Edit row'
    };
    if (l === 'es') return {
        dashboard: 'Panel',
        records: 'Registros',
        plazos: 'Plazos',
        equipo: 'Equipo',
        add: 'Agregar fila',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar fila',
        back: 'Proyectos',
        download: 'Descargar Excel',
        downloading: 'Descargando…',
        search: 'Buscar en todos los campos…',
        all: 'Todos',
        total: 'Total',
        noRows: 'Aún no hay filas — haz clic en «Agregar fila» para empezar.',
        noResults: 'Sin resultados para ese filtro.',
        confirmDel: '¿Eliminar este registro?',
        essential: 'Campos principales',
        extra: 'Más campos',
        notes: 'Campos de texto largo',
        addAnother: 'Agregar otra fila al guardar',
        auto: 'Auto',
        sel: 'Seleccionar…',
        overdue: 'Vencidos',
        today: 'Hoy',
        thisWeek: 'Esta semana',
        next30: 'Próximos 30 días',
        later: 'Más adelante',
        noDeadlines: 'Sin plazos registrados.',
        teamLoad: 'Carga del equipo',
        noTeam: 'Sin columna de responsable.',
        dIn: (n)=>`En ${n}d`,
        dAgo: (n)=>`Venció hace ${n}d`,
        notFound: 'Proyecto no encontrado',
        loading: 'Cargando proyecto…',
        recientes: 'Actividad reciente',
        upcoming: 'Próximos plazos',
        kpiUrgent: 'Alta prioridad',
        kpiOverdue: 'Vencidos',
        kpiWeek: 'Esta semana',
        byGroup: 'Distribución',
        areas: 'Áreas',
        main: 'PRINCIPAL',
        manage: 'GESTIÓN',
        steps: 'Pasos',
        reference: 'Referencia técnica',
        observations: 'Observaciones',
        tasksDone: (n)=>`${n} pasos`,
        addRowTitle: 'Nueva fila',
        editRowTitle: 'Editar fila'
    };
    if (l === 'pt') return {
        ...base,
        dashboard: 'Painel',
        records: 'Registros',
        plazos: 'Prazos',
        equipo: 'Equipe',
        add: 'Adicionar linha',
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar linha',
        back: 'Projetos',
        download: 'Baixar Excel',
        downloading: 'Baixando…',
        search: 'Buscar em todos os campos…',
        all: 'Todos',
        noRows: 'Sem linhas — clique em «Adicionar linha» para começar.',
        noResults: 'Sem resultados.',
        confirmDel: 'Excluir este registro?',
        essential: 'Campos principais',
        extra: 'Mais campos',
        overdue: 'Vencidos',
        today: 'Hoje',
        thisWeek: 'Esta semana',
        next30: 'Próximos 30 dias',
        later: 'Mais tarde',
        main: 'PRINCIPAL',
        manage: 'GERENCIAR',
        dIn: (n)=>`Em ${n}d`,
        dAgo: (n)=>`Venceu há ${n}d`,
        addRowTitle: 'Nova linha',
        editRowTitle: 'Editar linha'
    };
    return base;
}
// ─── Column utilities ─────────────────────────────────────────────────────────
const TABLE_SKIP = new Set([
    'longtext',
    'url',
    'formula'
]);
const ROLE_ORDER = [
    'identifier',
    'client',
    'description',
    'status',
    'priority',
    'assignee',
    'deadline',
    'area',
    'action',
    'pm',
    'created'
];
/** Columns to show in the summary table (no longtext/url, max 7, sorted by importance) */ function summaryCols(cols) {
    const ok = cols.filter((c)=>!TABLE_SKIP.has(c.type));
    if (ok.length <= 7) return ok;
    return [
        ...ok
    ].sort((a, b)=>{
        const ai = a.semanticRole ? ROLE_ORDER.indexOf(a.semanticRole) : 99;
        const bi = b.semanticRole ? ROLE_ORDER.indexOf(b.semanticRole) : 99;
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    }).slice(0, 7);
}
/** Fields that are auto-filled and hidden from the add-row form */ function autoFields(cols, rows) {
    const s = new Set();
    for (const c of cols){
        if (c.type === 'formula') {
            s.add(c.id);
            continue;
        }
        // Sequential numeric identifier (N°, #, row number)
        if (c.semanticRole === 'identifier' && (c.type === 'number' || c.type === 'text')) {
            const vals = rows.map((r)=>r[c.id]).filter((v)=>v != null && v !== '');
            if (vals.length === 0 || vals.every((v)=>/^\d+$/.test(String(v)))) {
                s.add(c.id);
            }
        }
        // "Current date" columns (fecha actual, today, etc.)
        if (c.type === 'date' && /fecha.actual|current.?date|data.?atual|hoy|today/i.test(c.excelHeader)) {
            s.add(c.id);
        }
    }
    return s;
}
/** Auto-fill value for a hidden field */ function autoVal(col, rows) {
    if (col.semanticRole === 'identifier') {
        const nums = rows.map((r)=>Number(r[col.id])).filter((n)=>!isNaN(n) && n > 0);
        return String(nums.length > 0 ? Math.max(...nums) + 1 : 1);
    }
    if (col.type === 'date') return new Date().toISOString().slice(0, 10);
    return '';
}
/** Group form columns: essential (semantic roles) / extra / notes (longtext) */ function formGroups(cols, skip) {
    const essential = [], extra = [], notes = [];
    for (const c of cols){
        if (skip.has(c.id)) continue;
        if (c.type === 'longtext') {
            notes.push(c);
            continue;
        }
        if (c.type === 'url') {
            extra.push(c);
            continue;
        }
        if (c.semanticRole && ROLE_ORDER.indexOf(c.semanticRole) >= 0) essential.push(c);
        else extra.push(c);
    }
    // Sort essential by role priority
    essential.sort((a, b)=>{
        const ai = a.semanticRole ? ROLE_ORDER.indexOf(a.semanticRole) : 99;
        const bi = b.semanticRole ? ROLE_ORDER.indexOf(b.semanticRole) : 99;
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    return {
        essential,
        extra,
        notes
    };
}
// ─── Status + priority colour helpers (match intra-app.html) ─────────────────
function statusStyle(val) {
    const v = (val || '').toLowerCase();
    if (/progres/.test(v)) return {
        background: C.sky50,
        color: C.sky800
    };
    if (/proce/.test(v)) return {
        background: C.emerald50,
        color: C.emerald800
    };
    if (/pend|wait/.test(v)) return {
        background: C.amber50,
        color: C.amber800
    };
    if (/listo|done|complet|cerrad|closed/.test(v)) return {
        background: C.slate50,
        color: C.slate800
    };
    if (/cancel|rechaz/.test(v)) return {
        background: C.rose50,
        color: C.rose800
    };
    return {
        background: C.slate50,
        color: C.slate800
    };
}
function priorityStyle(val) {
    const v = (val || '').toLowerCase();
    if (/urgent/.test(v)) return {
        background: C.rose50,
        color: C.rose800
    };
    if (/alta|high/.test(v)) return {
        background: C.amber50,
        color: C.amber800
    };
    if (/media|medium/.test(v)) return {
        background: C.indigo50,
        color: C.indigo800
    };
    if (/baja|low/.test(v)) return {
        background: C.slate50,
        color: C.slate800
    };
    return {
        background: C.slate50,
        color: C.slate800
    };
}
function enumStyle(col, val) {
    if (col.semanticRole === 'status') return statusStyle(val);
    if (col.semanticRole === 'priority') return priorityStyle(val);
    return {
        background: C.indigo50,
        color: C.indigo800
    };
}
// ─── Small atoms ─────────────────────────────────────────────────────────────
const g = (row, id)=>{
    if (!id) return '';
    const x = row[id];
    return x == null ? '' : String(x);
};
function Av({ name, size = 32 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('rounded-lg flex items-center justify-center font-semibold flex-shrink-0', (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["avatarColor"])(name || '?')),
        style: {
            width: size,
            height: size,
            minWidth: size,
            fontSize: size * 0.34
        },
        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initials"])(name || '?')
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 185,
        columnNumber: 5
    }, this);
}
function StatusBadge({ val, col }) {
    if (!val) return null;
    const style = col ? enumStyle(col, val) : statusStyle(val);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
        style: {
            ...style,
            fontSize: 10,
            padding: '2px 8px'
        },
        children: val
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 196,
        columnNumber: 5
    }, this);
}
function KpiCard({ label, value, sub, accent, onClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: onClick,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('rounded-xl p-4 flex flex-col gap-1.5', onClick && 'cursor-pointer'),
        style: {
            background: C.bg,
            border: `0.5px solid ${C.border}`
        },
        onMouseEnter: (e)=>onClick && (e.currentTarget.style.transform = 'translateY(-1px)'),
        onMouseLeave: (e)=>onClick && (e.currentTarget.style.transform = ''),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[11px] font-semibold uppercase tracking-wider",
                style: {
                    color: C.text3
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 212,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[28px] font-semibold leading-none tracking-tight",
                style: {
                    color: accent ?? C.text
                },
                children: value
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 213,
                columnNumber: 7
            }, this),
            sub && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[11px]",
                style: {
                    color: C.text3
                },
                children: sub
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 214,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 207,
        columnNumber: 5
    }, this);
}
// ─── Smart field input ────────────────────────────────────────────────────────
function FieldInput({ col, value, onChange }) {
    const inputCls = "w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all";
    const inputStyle = {
        background: C.bg,
        border: `0.5px solid ${C.borderMd}`,
        color: C.text
    };
    // Enum → pill selector
    if (col.type === 'enum' && col.options?.length) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap gap-1.5",
            children: col.options.map((opt)=>{
                const active = value === opt;
                const st = active ? enumStyle(col, opt) : {
                    background: C.bg2,
                    color: C.text2
                };
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: ()=>onChange(active ? '' : opt),
                    className: "px-3 py-1 rounded-full text-[12px] font-medium border transition-all",
                    style: {
                        ...st,
                        borderColor: active ? 'transparent' : C.border,
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                    },
                    children: opt
                }, opt, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 232,
                    columnNumber: 13
                }, this);
            })
        }, void 0, false, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 227,
            columnNumber: 7
        }, this);
    }
    if (col.type === 'date') return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: "date",
        value: value,
        onChange: (e)=>onChange(e.target.value),
        className: inputCls,
        style: inputStyle
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 243,
        columnNumber: 5
    }, this);
    if (col.type === 'longtext') return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
        rows: 4,
        value: value,
        onChange: (e)=>onChange(e.target.value),
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(inputCls, 'resize-none leading-relaxed'),
        style: inputStyle,
        placeholder: "…"
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 247,
        columnNumber: 5
    }, this);
    if (col.type === 'url') return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: "url",
        value: value,
        onChange: (e)=>onChange(e.target.value),
        placeholder: "https://",
        className: inputCls,
        style: inputStyle
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 252,
        columnNumber: 5
    }, this);
    if (col.type === 'number' || col.type === 'currency') return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: "number",
        value: value,
        onChange: (e)=>onChange(e.target.value),
        className: inputCls,
        style: inputStyle
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 256,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: "text",
        value: value,
        onChange: (e)=>onChange(e.target.value),
        className: inputCls,
        style: inputStyle
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 260,
        columnNumber: 5
    }, this);
}
// ─── Add / Edit modal ─────────────────────────────────────────────────────────
function RowModal({ title, columns, initial, rows, onSubmit, onClose, onDelete, tx }) {
    const skip = autoFields(columns, rows);
    const { essential, extra, notes } = formGroups(columns, skip);
    const autoColMap = new Map(columns.filter((c)=>skip.has(c.id)).map((c)=>[
            c.id,
            autoVal(c, rows)
        ]));
    const [vals, setVals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>({
            ...Object.fromEntries(autoColMap),
            ...initial
        }));
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showExtra, setShowExtra] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [again, setAgain] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const set = (id, v)=>setVals((p)=>({
                ...p,
                [id]: v
            }));
    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await onSubmit({
                ...Object.fromEntries(autoColMap),
                ...vals
            });
            if (!again) onClose();
            else setVals({
                ...Object.fromEntries(autoColMap),
                ...Object.fromEntries(columns.map((c)=>[
                        c.id,
                        ''
                    ]))
            });
        } catch (e) {
            setError(String(e));
        } finally{
            setSaving(false);
        }
    }
    const Label = ({ col })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-[11px] font-semibold uppercase tracking-widest mb-1.5",
            style: {
                color: C.text3
            },
            children: col.label
        }, void 0, false, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 299,
            columnNumber: 5
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        style: {
            background: 'rgba(15,23,42,0.35)',
            backdropFilter: 'blur(6px)'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col",
            style: {
                boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
                border: `0.5px solid ${C.border}`
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between px-6 py-5 border-b",
                    style: {
                        borderColor: C.border
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-[16px] font-semibold",
                                    style: {
                                        color: C.text
                                    },
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 313,
                                    columnNumber: 13
                                }, this),
                                skip.size > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[11px] mt-0.5",
                                    style: {
                                        color: C.text3
                                    },
                                    children: [
                                        tx.auto,
                                        ": ",
                                        [
                                            ...skip
                                        ].map((id)=>columns.find((c)=>c.id === id)?.label).filter(Boolean).join(', ')
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 315,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 312,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            style: {
                                color: C.text3
                            },
                            onMouseEnter: (e)=>e.currentTarget.style.background = C.bg2,
                            onMouseLeave: (e)=>e.currentTarget.style.background = '',
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 14 14",
                                fill: "none",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M2 12L12 2M12 12L2 2",
                                    stroke: "currentColor",
                                    strokeWidth: "1.5",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 325,
                                    columnNumber: 73
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 325,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 320,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 311,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    onSubmit: submit,
                    className: "flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4",
                    children: [
                        essential.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Label, {
                                        col: col
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 333,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldInput, {
                                        col: col,
                                        value: vals[col.id] ?? '',
                                        onChange: (v)=>set(col.id, v)
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 334,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, col.id, true, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 332,
                                columnNumber: 13
                            }, this)),
                        extra.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setShowExtra((p)=>!p),
                                    className: "flex items-center gap-2 text-[12px] font-medium mb-2 transition-colors",
                                    style: {
                                        color: C.text3
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "12",
                                            height: "12",
                                            viewBox: "0 0 12 12",
                                            fill: "none",
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('transition-transform', showExtra && 'rotate-90'),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M4 2l4 4-4 4",
                                                stroke: "currentColor",
                                                strokeWidth: "1.3",
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 346,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 344,
                                            columnNumber: 17
                                        }, this),
                                        showExtra ? tx.extra : `${tx.extra} (${extra.length})`
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 341,
                                    columnNumber: 15
                                }, this),
                                showExtra && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-4 pl-4",
                                    style: {
                                        borderLeft: `2px solid ${C.bg2}`
                                    },
                                    children: extra.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Label, {
                                                    col: col
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 354,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldInput, {
                                                    col: col,
                                                    value: vals[col.id] ?? '',
                                                    onChange: (v)=>set(col.id, v)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 355,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, col.id, true, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 353,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 351,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 340,
                            columnNumber: 13
                        }, this),
                        notes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-[11px] font-semibold uppercase tracking-widest pt-2",
                                    style: {
                                        color: C.text3
                                    },
                                    children: tx.notes
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 366,
                                    columnNumber: 15
                                }, this),
                                notes.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Label, {
                                                col: col
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 369,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldInput, {
                                                col: col,
                                                value: vals[col.id] ?? '',
                                                onChange: (v)=>set(col.id, v)
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 370,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, col.id, true, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 368,
                                        columnNumber: 17
                                    }, this))
                            ]
                        }, void 0, true),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[12px] rounded-lg px-3 py-2",
                            style: {
                                color: C.rose800,
                                background: C.rose50
                            },
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 376,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 329,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-6 py-4 flex items-center gap-3",
                    style: {
                        borderTop: `0.5px solid ${C.border}`,
                        background: C.bg2,
                        borderRadius: '0 0 16px 16px'
                    },
                    children: [
                        onDelete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: onDelete,
                            className: "text-[12px] px-3 py-2 rounded-lg transition-colors",
                            style: {
                                color: C.text3
                            },
                            onMouseEnter: (e)=>{
                                e.currentTarget.style.color = C.rose800;
                                e.currentTarget.style.background = C.rose50;
                            },
                            onMouseLeave: (e)=>{
                                e.currentTarget.style.color = C.text3;
                                e.currentTarget.style.background = '';
                            },
                            children: tx.delete
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 381,
                            columnNumber: 13
                        }, this),
                        !onDelete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "flex items-center gap-2 text-[12px] cursor-pointer select-none",
                            style: {
                                color: C.text3
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setAgain((p)=>!p),
                                    className: "w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors",
                                    style: {
                                        background: again ? C.indigo600 : '',
                                        borderColor: again ? C.indigo600 : C.borderMd
                                    },
                                    children: again && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "8",
                                        height: "8",
                                        viewBox: "0 0 8 8",
                                        fill: "none",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M1 4l2 2 4-4",
                                            stroke: "white",
                                            strokeWidth: "1.3",
                                            strokeLinecap: "round"
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 392,
                                            columnNumber: 83
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 392,
                                        columnNumber: 27
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 389,
                                    columnNumber: 15
                                }, this),
                                tx.addAnother
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 388,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 397,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: onClose,
                            className: "px-4 py-2 rounded-lg text-[13px] transition-colors",
                            style: {
                                border: `0.5px solid ${C.borderMd}`,
                                color: C.text2
                            },
                            onMouseEnter: (e)=>e.currentTarget.style.background = C.bg3,
                            onMouseLeave: (e)=>e.currentTarget.style.background = '',
                            children: tx.cancel
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 398,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: submit,
                            disabled: saving,
                            className: "px-6 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-60",
                            style: {
                                background: C.indigo600,
                                boxShadow: `0 2px 8px rgba(79,70,229,0.25)`
                            },
                            children: saving ? '…' : tx.save
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 404,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 379,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 307,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 305,
        columnNumber: 5
    }, this);
}
// ─── Full record detail view (LexDesk case-detail style) ──────────────────────
function DetailView({ row, section, projectId, sectionIdx, allRows, onBack, onUpdated, onDeleted, tx }) {
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const cols = section.schema.columns;
    const { bindings, colorMaps } = section;
    const titleId = bindings.description ?? bindings.client ?? bindings.identifier ?? cols[0]?.id;
    const title = g(row, titleId);
    const clientVal = g(row, bindings.client);
    const statusVal = g(row, bindings.status);
    const priorityVal = g(row, bindings.priority);
    const idVal = g(row, bindings.identifier);
    const areaVal = g(row, bindings.area);
    const deadlineVal = g(row, bindings.deadline);
    const statusCol = cols.find((c)=>c.semanticRole === 'status');
    const priorityCol = cols.find((c)=>c.semanticRole === 'priority');
    // Info grid: short columns excluding title/status/priority/identifier shown above
    const topIds = new Set([
        titleId,
        bindings.status,
        bindings.priority,
        bindings.identifier
    ].filter(Boolean));
    const infoGridCols = cols.filter((c)=>!TABLE_SKIP.has(c.type) && !topIds.has(c.id));
    // Content sections: longtext columns
    const contentCols = cols.filter((c)=>c.type === 'longtext');
    // URL columns
    const urlCols = cols.filter((c)=>c.type === 'url');
    // Parse numbered steps from "procedimiento" type fields
    function parseSteps(text) {
        return text.split('\n').map((s)=>s.trim()).filter((s)=>/^\d+\./.test(s) || s.length > 5);
    }
    async function doDelete() {
        if (!confirm(tx.confirmDel)) return;
        await fetch(`/api/projects/${projectId}/records/${row._id}?section=${sectionIdx}`, {
            method: 'DELETE'
        });
        onDeleted(row._id);
        onBack();
    }
    async function save(vals) {
        const res = await fetch(`/api/projects/${projectId}/records/${row._id}?section=${sectionIdx}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vals)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onUpdated(data);
        setEditing(false);
    }
    const initial = Object.fromEntries(cols.map((c)=>[
            c.id,
            g(row, c.id)
        ]));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onBack,
                className: "flex items-center gap-1.5 text-[13px] w-fit transition-colors",
                style: {
                    color: C.text2,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                },
                onMouseEnter: (e)=>e.currentTarget.style.color = C.text,
                onMouseLeave: (e)=>e.currentTarget.style.color = C.text2,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        width: "12",
                        height: "12",
                        viewBox: "0 0 12 12",
                        fill: "none",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: "M7.5 2L3.5 6l4 4",
                            stroke: "currentColor",
                            strokeWidth: "1.5",
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 475,
                            columnNumber: 69
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 475,
                        columnNumber: 9
                    }, this),
                    "Back"
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 471,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl p-6",
                style: {
                    background: C.bg,
                    border: `0.5px solid ${C.border}`
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 flex-wrap mb-3",
                        children: [
                            clientVal && clientVal !== title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "rounded-full text-[10px] font-semibold px-2 py-0.5",
                                style: {
                                    background: C.indigo50,
                                    color: C.indigo800
                                },
                                children: clientVal
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 484,
                                columnNumber: 13
                            }, this),
                            areaVal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "rounded-full text-[10px] font-semibold px-2 py-0.5",
                                style: {
                                    background: C.violet50,
                                    color: C.violet800
                                },
                                children: areaVal
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 487,
                                columnNumber: 13
                            }, this),
                            statusVal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                val: statusVal,
                                col: statusCol
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 489,
                                columnNumber: 25
                            }, this),
                            priorityVal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                val: priorityVal,
                                col: priorityCol
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 490,
                                columnNumber: 27
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 482,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[18px] font-semibold leading-snug mb-1.5 whitespace-pre-wrap",
                        style: {
                            color: C.text
                        },
                        children: title || '—'
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 493,
                        columnNumber: 9
                    }, this),
                    idVal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[12px]",
                        style: {
                            color: C.text3
                        },
                        children: [
                            "#",
                            idVal,
                            areaVal ? ` · ${areaVal}` : ''
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 495,
                        columnNumber: 11
                    }, this),
                    infoGridCols.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 pt-4 grid gap-4",
                        style: {
                            borderTop: `0.5px solid ${C.border}`,
                            gridTemplateColumns: `repeat(${Math.min(infoGridCols.length, 4)}, minmax(0,1fr))`
                        },
                        children: infoGridCols.map((col, i)=>{
                            const val = g(row, col.id);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                style: {
                                    paddingRight: i < Math.min(infoGridCols.length, 4) - 1 ? 14 : 0,
                                    borderRight: i < Math.min(infoGridCols.length, 4) - 1 ? `0.5px solid ${C.border}` : 'none'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[10px] font-semibold uppercase tracking-widest mb-1",
                                        style: {
                                            color: C.text3
                                        },
                                        children: col.label
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 507,
                                        columnNumber: 19
                                    }, this),
                                    col.semanticRole === 'assignee' && val ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('rounded-full flex items-center justify-center font-semibold', (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["avatarColor"])(val)),
                                                style: {
                                                    width: 24,
                                                    height: 24,
                                                    fontSize: 9,
                                                    flexShrink: 0
                                                },
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initials"])(val)
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 510,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[13px] font-semibold",
                                                style: {
                                                    color: C.text
                                                },
                                                children: val
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 511,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 509,
                                        columnNumber: 21
                                    }, this) : col.type === 'enum' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                        val: val,
                                        col: col
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 514,
                                        columnNumber: 21
                                    }, this) : col.type === 'date' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[13px] font-medium",
                                        style: {
                                            color: C.text
                                        },
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtDate"])(val) || '—'
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 516,
                                        columnNumber: 21
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[13px] font-medium",
                                        style: {
                                            color: val ? C.text : C.text3
                                        },
                                        children: val || '—'
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 518,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, col.id, true, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 506,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 502,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 480,
                columnNumber: 7
            }, this),
            contentCols.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('grid gap-4', contentCols.length === 1 ? 'grid-cols-1' : 'grid-cols-2'),
                children: contentCols.map((col)=>{
                    const val = g(row, col.id);
                    const steps = val ? parseSteps(val) : [];
                    const isSteps = steps.length > 1 && steps.some((s)=>/^\d+\./.test(s));
                    // Determine left-border colour from priority
                    const priVal = priorityVal.toLowerCase();
                    const leftColor = /urgent/.test(priVal) ? C.rose600 : /alta|high/.test(priVal) ? C.amber600 : undefined;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl p-4 flex flex-col gap-2",
                        style: {
                            background: C.bg,
                            border: `0.5px solid ${C.border}`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[13px] font-semibold",
                                style: {
                                    color: C.text
                                },
                                children: col.label
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 540,
                                columnNumber: 17
                            }, this),
                            isSteps ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col divide-y",
                                style: {
                                    borderColor: C.border
                                },
                                children: steps.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start gap-2.5 py-2.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-full flex items-center justify-center font-semibold flex-shrink-0 text-[11px] mt-0.5",
                                                style: {
                                                    width: 22,
                                                    height: 22,
                                                    background: C.indigo50,
                                                    color: C.indigo800
                                                },
                                                children: i + 1
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 545,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[13px] leading-snug",
                                                style: {
                                                    color: C.text2
                                                },
                                                children: s.replace(/^\d+\.\s*/, '')
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 547,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 544,
                                        columnNumber: 23
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 542,
                                columnNumber: 19
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-lg px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap",
                                style: {
                                    background: C.bg2,
                                    color: C.text2,
                                    ...leftColor ? {
                                        borderLeft: `3px solid ${leftColor}`
                                    } : {}
                                },
                                children: val || `—`
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 552,
                                columnNumber: 19
                            }, this)
                        ]
                    }, col.id, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 539,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 529,
                columnNumber: 9
            }, this),
            (urlCols.length > 0 || g(row, bindings.notes)) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-4",
                children: [
                    urlCols.map((col)=>{
                        const href = g(row, col.id);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-xl p-4",
                            style: {
                                background: C.bg,
                                border: `0.5px solid ${C.border}`
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-[13px] font-semibold mb-2",
                                    style: {
                                        color: C.text
                                    },
                                    children: col.label
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 570,
                                    columnNumber: 17
                                }, this),
                                href ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: href,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "text-[13px] break-all hover:underline",
                                    style: {
                                        color: C.indigo600
                                    },
                                    children: href
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 572,
                                    columnNumber: 19
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color: C.text3,
                                        fontSize: 13
                                    },
                                    children: "—"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 574,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, col.id, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 569,
                            columnNumber: 15
                        }, this);
                    }),
                    bindings.notes && g(row, bindings.notes) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl p-4",
                        style: {
                            background: C.bg,
                            border: `0.5px solid ${C.border}`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[13px] font-semibold mb-2",
                                style: {
                                    color: C.text
                                },
                                children: cols.find((c)=>c.id === bindings.notes)?.label ?? 'Notes'
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 580,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[13px] leading-relaxed whitespace-pre-wrap",
                                style: {
                                    color: C.text2
                                },
                                children: g(row, bindings.notes)
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 581,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 579,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 565,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: doDelete,
                        className: "px-4 py-2 rounded-lg text-[13px] transition-colors",
                        style: {
                            border: `0.5px solid ${C.border}`,
                            color: C.text3
                        },
                        onMouseEnter: (e)=>{
                            e.currentTarget.style.color = C.rose800;
                            e.currentTarget.style.background = C.rose50;
                        },
                        onMouseLeave: (e)=>{
                            e.currentTarget.style.color = C.text3;
                            e.currentTarget.style.background = '';
                        },
                        children: tx.delete
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 589,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setEditing(true),
                        className: "px-5 py-2 rounded-lg text-[13px] font-semibold text-white",
                        style: {
                            background: C.indigo600,
                            boxShadow: `0 2px 8px rgba(79,70,229,0.2)`
                        },
                        children: tx.edit
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 594,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 588,
                columnNumber: 7
            }, this),
            editing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RowModal, {
                title: tx.editRowTitle,
                columns: cols,
                initial: initial,
                rows: allRows,
                onSubmit: save,
                onClose: ()=>setEditing(false),
                onDelete: doDelete,
                tx: tx
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 602,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 469,
        columnNumber: 5
    }, this);
}
// ─── Dashboard / Overview ─────────────────────────────────────────────────────
function DashboardView({ section, onViewRow, onGoRecords, onGoPlazos, tx }) {
    const { bindings, colorMaps, records: rows } = section;
    const cols = section.schema.columns;
    const total = rows.length;
    const urgent = rows.filter((r)=>/urgent|alta|high/i.test(g(r, bindings.priority))).length;
    const overdue = rows.filter((r)=>{
        const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["daysUntil"])(g(r, bindings.deadline));
        return d !== null && d < 0;
    }).length;
    const week = rows.filter((r)=>{
        const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["daysUntil"])(g(r, bindings.deadline));
        return d !== null && d >= 0 && d <= 7;
    }).length;
    // Breakdown: prefer status, else first enum
    const bkCol = cols.find((c)=>c.semanticRole === 'status') ?? cols.find((c)=>c.type === 'enum');
    const bkMap = {};
    if (bkCol) rows.forEach((r)=>{
        const v = g(r, bkCol.id) || '—';
        bkMap[v] = (bkMap[v] ?? 0) + 1;
    });
    const bkSorted = Object.entries(bkMap).sort((a, b)=>b[1] - a[1]);
    const bkMax = Math.max(...Object.values(bkMap), 1);
    // Upcoming deadlines (next 14 days + overdue)
    const titleId = bindings.description ?? bindings.client ?? bindings.identifier ?? cols[0]?.id;
    const upcoming = bindings.deadline ? [
        ...rows
    ].map((r, i)=>({
            r,
            d: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["daysUntil"])(g(r, bindings.deadline)),
            i
        })).filter((x)=>x.d !== null && x.d <= 14).sort((a, b)=>(a.d ?? 9999) - (b.d ?? 9999)).slice(0, 6) : [];
    // Recent rows
    const recent = [
        ...rows
    ].slice(-6).reverse();
    // By group (secondary enum: area, action, etc.)
    const grpCol = cols.find((c)=>c.semanticRole === 'area') ?? cols.find((c)=>c.type === 'enum' && c !== bkCol);
    const grpMap = {};
    if (grpCol) rows.forEach((r)=>{
        const v = g(r, grpCol.id) || '—';
        grpMap[v] = (grpMap[v] ?? 0) + 1;
    });
    const grpSorted = Object.entries(grpMap).sort((a, b)=>b[1] - a[1]);
    const grpMax = Math.max(...Object.values(grpMap), 1);
    const statusCol = cols.find((c)=>c.semanticRole === 'status');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-4 gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                        label: `${tx.total} ${cols[0]?.label ?? 'rows'}`,
                        value: total,
                        onClick: onGoRecords,
                        sub: section.sheetName
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 653,
                        columnNumber: 9
                    }, this),
                    overdue > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                        label: tx.overdue,
                        value: overdue,
                        accent: C.rose600,
                        onClick: onGoPlazos,
                        sub: "Acción inmediata"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 654,
                        columnNumber: 25
                    }, this),
                    urgent > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                        label: tx.kpiUrgent,
                        value: urgent,
                        accent: C.amber600,
                        onClick: onGoRecords,
                        sub: `De ${total} total`
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 655,
                        columnNumber: 24
                    }, this),
                    week > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KpiCard, {
                        label: tx.kpiWeek,
                        value: week,
                        onClick: onGoPlazos
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 656,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 652,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-4",
                children: [
                    bkSorted.length > 0 && bkCol && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl p-5",
                        style: {
                            background: C.bg,
                            border: `0.5px solid ${C.border}`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[13px] font-semibold mb-4",
                                style: {
                                    color: C.text
                                },
                                children: bkCol.label
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 663,
                                columnNumber: 13
                            }, this),
                            bkSorted.slice(0, 8).map(([label, count])=>{
                                const st = enumStyle(bkCol, label);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2.5 mb-2.5 last:mb-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-[12px] w-28 flex-shrink-0 truncate",
                                            style: {
                                                color: C.text2
                                            },
                                            children: label
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 668,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 h-1.5 rounded-full",
                                            style: {
                                                background: C.bg3
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-full rounded-full transition-all duration-700",
                                                style: {
                                                    width: `${count / bkMax * 100}%`,
                                                    background: st.color
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 670,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 669,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-[12px] font-medium w-5 text-right",
                                            style: {
                                                color: C.text2
                                            },
                                            children: count
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 672,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, label, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 667,
                                    columnNumber: 17
                                }, this);
                            })
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 662,
                        columnNumber: 11
                    }, this),
                    upcoming.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl p-5",
                        style: {
                            background: C.bg,
                            border: `0.5px solid ${C.border}`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[13px] font-semibold",
                                        style: {
                                            color: C.text
                                        },
                                        children: tx.upcoming
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 683,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onGoPlazos,
                                        className: "text-[12px] hover:underline",
                                        style: {
                                            color: C.indigo600,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer'
                                        },
                                        children: "Ver todos →"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 684,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 682,
                                columnNumber: 13
                            }, this),
                            upcoming.map(({ r, d }, i)=>{
                                const isOD = d !== null && d < 0, isSoon = d !== null && d >= 0 && d <= 3;
                                const dotC = isOD ? C.rose600 : isSoon ? C.amber600 : C.indigo600;
                                const dLabel = d === null ? '' : d === 0 ? tx.today : isOD ? tx.dAgo(Math.abs(d)) : tx.dIn(d);
                                const sVal = g(r, bindings.status);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    onClick: ()=>onViewRow(r),
                                    className: "flex items-start gap-2.5 py-2.5 cursor-pointer",
                                    style: {
                                        borderBottom: i < upcoming.length - 1 ? `0.5px solid ${C.border}` : 'none'
                                    },
                                    onMouseEnter: (e)=>e.currentTarget.style.background = C.bg2,
                                    onMouseLeave: (e)=>e.currentTarget.style.background = '',
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                            style: {
                                                background: dotC
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 697,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[13px] font-medium truncate",
                                                    style: {
                                                        color: C.text
                                                    },
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(g(r, titleId), 50)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 699,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[11px] mt-0.5",
                                                    style: {
                                                        color: C.text3
                                                    },
                                                    children: [
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtDate"])(g(r, bindings.deadline)),
                                                        " · ",
                                                        g(r, bindings.client)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 700,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 698,
                                            columnNumber: 19
                                        }, this),
                                        sVal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                            val: sVal,
                                            col: statusCol
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 702,
                                            columnNumber: 28
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-[11px] font-semibold ml-1 flex-shrink-0",
                                            style: {
                                                color: isOD ? C.rose600 : isSoon ? C.amber600 : C.text3
                                            },
                                            children: dLabel
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 703,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 692,
                                    columnNumber: 17
                                }, this);
                            })
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 681,
                        columnNumber: 11
                    }, this) : /* Recent rows (fallback when no deadline col) */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl p-5",
                        style: {
                            background: C.bg,
                            border: `0.5px solid ${C.border}`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[13px] font-semibold mb-3",
                                style: {
                                    color: C.text
                                },
                                children: tx.recientes
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 711,
                                columnNumber: 13
                            }, this),
                            recent.map((r, i)=>{
                                const t = g(r, titleId), sub = g(r, bindings.client);
                                const sVal = g(r, bindings.status);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    onClick: ()=>onViewRow(r),
                                    className: "flex items-center gap-2.5 py-2 cursor-pointer",
                                    style: {
                                        borderBottom: i < recent.length - 1 ? `0.5px solid ${C.border}` : 'none'
                                    },
                                    onMouseEnter: (e)=>e.currentTarget.style.background = C.bg2,
                                    onMouseLeave: (e)=>e.currentTarget.style.background = '',
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Av, {
                                            name: g(r, bindings.client) || g(r, cols[0]?.id),
                                            size: 26
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 720,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[13px] font-medium truncate",
                                                    style: {
                                                        color: C.text
                                                    },
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(t, 40)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 722,
                                                    columnNumber: 21
                                                }, this),
                                                sub && sub !== t && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[11px]",
                                                    style: {
                                                        color: C.text3
                                                    },
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(sub, 30)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 723,
                                                    columnNumber: 42
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 721,
                                            columnNumber: 19
                                        }, this),
                                        sVal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                            val: sVal,
                                            col: statusCol
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 725,
                                            columnNumber: 28
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 716,
                                    columnNumber: 17
                                }, this);
                            }),
                            recent.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[13px] py-4",
                                style: {
                                    color: C.text3
                                },
                                children: tx.noRows
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 729,
                                columnNumber: 37
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 710,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 659,
                columnNumber: 7
            }, this),
            grpSorted.length > 0 && grpCol && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl p-5",
                style: {
                    background: C.bg,
                    border: `0.5px solid ${C.border}`
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[13px] font-semibold mb-4",
                        style: {
                            color: C.text
                        },
                        children: [
                            grpCol.label,
                            " — ",
                            tx.byGroup
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 737,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-x-8 gap-y-2",
                        children: grpSorted.slice(0, 10).map(([label, count], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[12px] w-36 flex-shrink-0 truncate",
                                        style: {
                                            color: C.text2
                                        },
                                        children: label
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 741,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 h-1.5 rounded-full",
                                        style: {
                                            background: C.bg3
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-full rounded-full",
                                            style: {
                                                width: `${count / grpMax * 100}%`,
                                                background: CHART_COLORS[i % CHART_COLORS.length]
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 743,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 742,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[12px] font-medium w-5 text-right",
                                        style: {
                                            color: C.text2
                                        },
                                        children: count
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 745,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, label, true, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 740,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 738,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 736,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 650,
        columnNumber: 5
    }, this);
}
// ─── Records table ─────────────────────────────────────────────────────────────
function RecordsView({ section, projectId, sectionIdx, search, rows, setRows, onViewRow, tx }) {
    const [addOpen, setAddOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [filters, setFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const allCols = section.schema.columns;
    const visCols = summaryCols(allCols);
    const enumCols = allCols.filter((c)=>c.type === 'enum');
    const { bindings, colorMaps } = section;
    const blank = Object.fromEntries(allCols.map((c)=>[
            c.id,
            ''
        ]));
    const newRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const statusCol = allCols.find((c)=>c.semanticRole === 'status');
    const displayed = rows.filter((r)=>{
        for (const [id, v] of Object.entries(filters))if (v && g(r, id) !== v) return false;
        if (search) {
            const q = search.toLowerCase();
            return Object.values(r).some((x)=>x != null && String(x).toLowerCase().includes(q));
        }
        return true;
    });
    function cellNode(col, raw) {
        if (raw == null || raw === '') return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            style: {
                color: C.text3,
                fontSize: 12
            },
            children: "—"
        }, void 0, false, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 778,
            columnNumber: 43
        }, this);
        const s = String(raw);
        if (col.type === 'enum') return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
            val: s,
            col: col
        }, void 0, false, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 780,
            columnNumber: 37
        }, this);
        if (col.type === 'date') return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            style: {
                fontSize: 12,
                color: C.text2,
                whiteSpace: 'nowrap'
            },
            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtDate"])(s)
        }, void 0, false, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 781,
            columnNumber: 37
        }, this);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            style: {
                fontSize: 13,
                color: C.text
            },
            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(s, 40)
        }, void 0, false, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 782,
            columnNumber: 12
        }, this);
    }
    // Client column: show with avatar
    const clientId = bindings.client;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 flex-wrap",
                children: [
                    enumCols.slice(0, 5).map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: filters[col.id] ?? '',
                                    onChange: (e)=>setFilters((p)=>({
                                                ...p,
                                                [col.id]: e.target.value
                                            })),
                                    className: "text-[12px] pl-3 pr-7 py-1.5 rounded-lg appearance-none outline-none cursor-pointer transition-colors",
                                    style: {
                                        border: `0.5px solid ${C.border}`,
                                        background: filters[col.id] ? C.indigo50 : C.bg,
                                        color: filters[col.id] ? C.indigo800 : C.text2,
                                        fontWeight: filters[col.id] ? 600 : 400
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: [
                                                col.label,
                                                ": ",
                                                tx.all
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 797,
                                            columnNumber: 15
                                        }, this),
                                        col.options?.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: o,
                                                children: o
                                            }, o, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 798,
                                                columnNumber: 38
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 794,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none",
                                    width: "10",
                                    height: "10",
                                    viewBox: "0 0 10 10",
                                    fill: "none",
                                    style: {
                                        color: C.text3
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M2 3.5l3 3 3-3",
                                        stroke: "currentColor",
                                        strokeWidth: "1.2",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 801,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 800,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, col.id, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 793,
                            columnNumber: 11
                        }, this)),
                    Object.values(filters).some(Boolean) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setFilters({}),
                        className: "text-[12px] hover:underline",
                        style: {
                            color: C.indigo600,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        },
                        children: [
                            tx.all,
                            " ×"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 806,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 810,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[12px] mr-1",
                        style: {
                            color: C.text3
                        },
                        children: [
                            displayed.length,
                            " / ",
                            rows.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 811,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setAddOpen(true),
                        className: "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]",
                        style: {
                            background: C.indigo600,
                            boxShadow: `0 2px 8px rgba(79,70,229,0.25)`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "13",
                                height: "13",
                                viewBox: "0 0 13 13",
                                fill: "none",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M6.5 1.5v10M1.5 6.5h10",
                                    stroke: "currentColor",
                                    strokeWidth: "1.7",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 815,
                                    columnNumber: 71
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 815,
                                columnNumber: 11
                            }, this),
                            tx.add
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 812,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 791,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl overflow-hidden",
                style: {
                    background: C.bg,
                    border: `0.5px solid ${C.border}`
                },
                children: rows.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "py-20 flex flex-col items-center gap-4 text-center px-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-14 h-14 rounded-2xl flex items-center justify-center",
                            style: {
                                background: C.indigo50
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-7 h-7",
                                style: {
                                    color: C.indigo600
                                },
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 1.4,
                                    d: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 826,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 825,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 824,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[14px] font-semibold mb-1",
                                    style: {
                                        color: C.text
                                    },
                                    children: "No rows yet"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 830,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[13px] max-w-xs",
                                    style: {
                                        color: C.text3
                                    },
                                    children: tx.noRows
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 831,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 829,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setAddOpen(true),
                            className: "px-5 py-2 rounded-lg text-[13px] font-semibold text-white",
                            style: {
                                background: C.indigo600
                            },
                            children: tx.add
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 833,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 823,
                    columnNumber: 11
                }, this) : displayed.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "py-14 text-center text-[13px]",
                    style: {
                        color: C.text3
                    },
                    children: tx.noResults
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 836,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-x-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                style: {
                                    borderBottom: `0.5px solid ${C.border}`,
                                    background: C.bg2
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        visCols.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-4 py-3 text-left",
                                                style: {
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: C.text3,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                    whiteSpace: 'nowrap'
                                                },
                                                children: col.label
                                            }, col.id, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 843,
                                                columnNumber: 21
                                            }, this)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            style: {
                                                width: 32
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 847,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 841,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 840,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: displayed.map((row, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        onClick: ()=>onViewRow(row),
                                        style: {
                                            borderBottom: `0.5px solid ${C.border}`,
                                            cursor: 'pointer'
                                        },
                                        onMouseEnter: (e)=>e.currentTarget.style.background = '#fafaff',
                                        onMouseLeave: (e)=>e.currentTarget.style.background = '',
                                        children: [
                                            visCols.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-4 py-3 align-middle",
                                                    style: {
                                                        maxWidth: 200
                                                    },
                                                    children: col.id === clientId && g(row, clientId) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Av, {
                                                                name: g(row, clientId),
                                                                size: 22
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/ProjectApp.tsx",
                                                                lineNumber: 860,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    fontSize: 13,
                                                                    color: C.text,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                },
                                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(g(row, clientId), 28)
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/ProjectApp.tsx",
                                                                lineNumber: 861,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/ProjectApp.tsx",
                                                        lineNumber: 859,
                                                        columnNumber: 27
                                                    }, this) : cellNode(col, row[col.id])
                                                }, col.id, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 857,
                                                    columnNumber: 23
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-2",
                                                style: {
                                                    color: C.text3,
                                                    fontSize: 13
                                                },
                                                children: "›"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 866,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, row._id ?? i, true, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 852,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 850,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 839,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 838,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 821,
                columnNumber: 7
            }, this),
            addOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RowModal, {
                title: tx.addRowTitle,
                columns: allCols,
                initial: blank,
                rows: rows,
                onSubmit: async (vals)=>{
                    const res = await fetch(`/api/projects/${projectId}/records?section=${sectionIdx}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(vals)
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    newRef.current = data._id;
                    setRows((p)=>[
                            ...p,
                            data
                        ]);
                },
                onClose: ()=>setAddOpen(false),
                tx: tx
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 876,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 789,
        columnNumber: 5
    }, this);
}
// ─── Deadlines view (grouped by bucket) ──────────────────────────────────────
function PlazosView({ section, onViewRow, tx }) {
    const { bindings, records: rows } = section;
    const cols = section.schema.columns;
    const titleId = bindings.description ?? bindings.client ?? bindings.identifier ?? cols[0]?.id;
    const statusCol = cols.find((c)=>c.semanticRole === 'status');
    if (!bindings.deadline) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl p-8 text-center",
        style: {
            background: C.bg,
            border: `0.5px solid ${C.border}`,
            color: C.text3
        },
        children: tx.noDeadlines
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 899,
        columnNumber: 5
    }, this);
    const buckets = {
        [tx.overdue]: {
            rows: [],
            color: C.rose600
        },
        [tx.today]: {
            rows: [],
            color: C.rose600
        },
        [tx.thisWeek]: {
            rows: [],
            color: C.amber600
        },
        [tx.next30]: {
            rows: [],
            color: C.indigo600
        },
        [tx.later]: {
            rows: [],
            color: C.text3
        }
    };
    rows.filter((r)=>g(r, bindings.deadline)).forEach((r)=>{
        const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["daysUntil"])(g(r, bindings.deadline));
        if (d === null) return;
        if (d < 0) buckets[tx.overdue].rows.push(r);
        else if (d === 0) buckets[tx.today].rows.push(r);
        else if (d <= 7) buckets[tx.thisWeek].rows.push(r);
        else if (d <= 30) buckets[tx.next30].rows.push(r);
        else buckets[tx.later].rows.push(r);
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-5",
        children: [
            Object.entries(buckets).filter(([, b])=>b.rows.length > 0).map(([name, bucket])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[11px] font-semibold uppercase tracking-widest mb-2",
                            style: {
                                color: C.text3
                            },
                            children: [
                                name,
                                " (",
                                bucket.rows.length,
                                ")"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 926,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-xl overflow-hidden",
                            style: {
                                background: C.bg,
                                border: `0.5px solid ${C.border}`
                            },
                            children: bucket.rows.map((r, i)=>{
                                const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["daysUntil"])(g(r, bindings.deadline));
                                const dLabel = d === null ? '' : d === 0 ? tx.today : d < 0 ? tx.dAgo(Math.abs(d)) : tx.dIn(d);
                                const sVal = g(r, bindings.status);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    onClick: ()=>onViewRow(r),
                                    className: "flex items-start gap-2.5 px-4 py-3 cursor-pointer",
                                    style: {
                                        borderBottom: i < bucket.rows.length - 1 ? `0.5px solid ${C.border}` : 'none'
                                    },
                                    onMouseEnter: (e)=>e.currentTarget.style.background = C.bg2,
                                    onMouseLeave: (e)=>e.currentTarget.style.background = '',
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                            style: {
                                                background: bucket.color
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 940,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[13px] font-medium",
                                                    style: {
                                                        color: C.text
                                                    },
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["truncate"])(g(r, titleId), 80)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 942,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[11px] mt-0.5",
                                                    style: {
                                                        color: C.text3
                                                    },
                                                    children: [
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fmtDate"])(g(r, bindings.deadline)),
                                                        " · ",
                                                        g(r, bindings.client),
                                                        " · ",
                                                        g(r, bindings.assignee)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 943,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 941,
                                            columnNumber: 19
                                        }, this),
                                        sVal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                            val: sVal,
                                            col: statusCol
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 947,
                                            columnNumber: 28
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-[11px] font-semibold flex-shrink-0 w-20 text-right",
                                            style: {
                                                color: bucket.color
                                            },
                                            children: dLabel
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 948,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 935,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 929,
                            columnNumber: 11
                        }, this)
                    ]
                }, name, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 925,
                    columnNumber: 9
                }, this)),
            Object.values(buckets).every((b)=>b.rows.length === 0) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl p-8 text-center",
                style: {
                    background: C.bg,
                    border: `0.5px solid ${C.border}`,
                    color: C.text3
                },
                children: tx.noDeadlines
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 956,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 923,
        columnNumber: 5
    }, this);
}
// ─── Team view ────────────────────────────────────────────────────────────────
function EquipoView({ section, tx }) {
    const { bindings, records: rows } = section;
    const cols = section.schema.columns;
    if (!bindings.assignee) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl p-8 text-center",
        style: {
            background: C.bg,
            border: `0.5px solid ${C.border}`,
            color: C.text3
        },
        children: tx.noTeam
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 967,
        columnNumber: 5
    }, this);
    const byPerson = {};
    rows.forEach((r)=>{
        const p = g(r, bindings.assignee) || '—';
        if (!byPerson[p]) byPerson[p] = {
            rows: [],
            urgent: 0,
            areas: {}
        };
        byPerson[p].rows.push(r);
        if (/urgent|alta|high/i.test(g(r, bindings.priority))) byPerson[p].urgent++;
        const a = g(r, bindings.area);
        if (a) byPerson[p].areas[a] = (byPerson[p].areas[a] ?? 0) + 1;
    });
    const sorted = Object.entries(byPerson).sort((a, b)=>b[1].rows.length - a[1].rows.length);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl overflow-hidden",
        style: {
            background: C.bg,
            border: `0.5px solid ${C.border}`
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    style: {
                        borderBottom: `0.5px solid ${C.border}`,
                        background: C.bg2
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: [
                            'Member',
                            'Assigned',
                            'Urgent',
                            'Distribution'
                        ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "px-4 py-3 text-left",
                                style: {
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: C.text3,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                },
                                children: h
                            }, h, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 986,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 984,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 983,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: sorted.map(([name, s], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            style: {
                                borderBottom: `0.5px solid ${C.border}`
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-4 py-3",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Av, {
                                                name: name,
                                                size: 28
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 995,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: C.text
                                                },
                                                children: name
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 996,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 994,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 993,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-4 py-3",
                                    style: {
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: C.text
                                    },
                                    children: s.rows.length
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 999,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-4 py-3",
                                    children: s.urgent > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "rounded-full text-[10px] font-semibold px-2 py-0.5",
                                        style: {
                                            background: C.rose50,
                                            color: C.rose800
                                        },
                                        children: s.urgent
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1002,
                                        columnNumber: 21
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: C.text3
                                        },
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1003,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 1000,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "px-4 py-3",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-1 flex-wrap",
                                        children: Object.entries(s.areas).map(([a, n])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                                style: {
                                                    background: C.bg2,
                                                    color: C.text2
                                                },
                                                children: [
                                                    a,
                                                    " ",
                                                    n
                                                ]
                                            }, a, true, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 1008,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1006,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 1005,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, name, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 992,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 990,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 982,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 981,
        columnNumber: 5
    }, this);
}
// ─── Section wrapper ──────────────────────────────────────────────────────────
function SectionShell({ section, projectId, sectionIdx, search, tx }) {
    const structure = section.schema.structure ?? 'records';
    // Non-record structures: route directly to their specialised views (no nav bar)
    if (structure === 'kv_table') {
        const [editRow, setEditRow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
        const [rows, setRows] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(section.records);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "overflow-y-auto h-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StructuredViews$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KVTableView"], {
                    section: {
                        ...section,
                        records: rows
                    },
                    onEditRow: setEditRow
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1032,
                    columnNumber: 9
                }, this),
                editRow && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RowModal, {
                    title: "Edit parameter",
                    columns: section.schema.columns,
                    initial: Object.fromEntries(section.schema.columns.map((c)=>[
                            c.id,
                            String(editRow[c.id] ?? '')
                        ])),
                    rows: rows,
                    onSubmit: async (vals)=>{
                        const res = await fetch(`/api/projects/${projectId}/records/${editRow._id}?section=${sectionIdx}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(vals)
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setRows((p)=>p.map((r)=>r._id === data._id ? data : r));
                    },
                    onClose: ()=>setEditRow(null),
                    tx: tx
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1034,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 1031,
            columnNumber: 7
        }, this);
    }
    if (structure === 'financial_report') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "overflow-y-auto h-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-3 px-1",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full",
                        style: {
                            background: '#EEF2FF',
                            color: '#4F46E5'
                        },
                        children: "Read-only report"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1055,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1054,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StructuredViews$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FinancialReportView"], {
                    section: section
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1058,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 1053,
            columnNumber: 7
        }, this);
    }
    if (structure === 'timeseries') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "overflow-y-auto h-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-3 px-1",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full",
                        style: {
                            background: '#EEF2FF',
                            color: '#4F46E5'
                        },
                        children: "Forecast model"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1067,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1066,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StructuredViews$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TimeSeriesView"], {
                    section: section
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1070,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 1065,
            columnNumber: 7
        }, this);
    }
    if (structure === 'budget') {
        const [rows, setRows] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(section.records);
        const [addOpen, setAddOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
        const [editRow, setEditRow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "overflow-y-auto h-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StructuredViews$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BudgetView"], {
                    section: {
                        ...section,
                        records: rows
                    },
                    onEditRow: setEditRow,
                    onAddRow: ()=>setAddOpen(true)
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1081,
                    columnNumber: 9
                }, this),
                addOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RowModal, {
                    title: "Add budget item",
                    columns: section.schema.columns,
                    initial: Object.fromEntries(section.schema.columns.map((c)=>[
                            c.id,
                            ''
                        ])),
                    rows: rows,
                    onSubmit: async (vals)=>{
                        const res = await fetch(`/api/projects/${projectId}/records?section=${sectionIdx}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(vals)
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setRows((p)=>[
                                ...p,
                                data
                            ]);
                    },
                    onClose: ()=>setAddOpen(false),
                    tx: tx
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1084,
                    columnNumber: 11
                }, this),
                editRow && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RowModal, {
                    title: "Edit item",
                    columns: section.schema.columns,
                    initial: Object.fromEntries(section.schema.columns.map((c)=>[
                            c.id,
                            String(editRow[c.id] ?? '')
                        ])),
                    rows: rows,
                    onSubmit: async (vals)=>{
                        const res = await fetch(`/api/projects/${projectId}/records/${editRow._id}?section=${sectionIdx}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(vals)
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setRows((p)=>p.map((r)=>r._id === data._id ? data : r));
                    },
                    onDelete: async ()=>{
                        if (!confirm(tx.confirmDel)) return;
                        await fetch(`/api/projects/${projectId}/records/${editRow._id}?section=${sectionIdx}`, {
                            method: 'DELETE'
                        });
                        setRows((p)=>p.filter((r)=>r._id !== editRow._id));
                        setEditRow(null);
                    },
                    onClose: ()=>setEditRow(null),
                    tx: tx
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1098,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 1080,
            columnNumber: 7
        }, this);
    }
    // ── Records (standard table + dashboard) ───────────────────────────────────
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('dashboard');
    const [prevView, setPrevView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('dashboard');
    const [rows, setRows] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(section.records);
    const [detailRow, setDetailRow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const hasDeadline = !!section.bindings.deadline;
    const hasAssignee = !!section.bindings.assignee;
    function navTo(v) {
        if (v !== 'detail') setPrevView(v);
        setView(v);
    }
    function viewRow(r) {
        setDetailRow(r);
        navTo('detail');
    }
    const NAV = [
        {
            id: 'dashboard',
            label: tx.dashboard,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 14 14",
                fill: "none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "1",
                        y: "1",
                        width: "5",
                        height: "5",
                        rx: "1.5",
                        fill: "currentColor",
                        opacity: ".8"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1133,
                        columnNumber: 111
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "8",
                        y: "1",
                        width: "5",
                        height: "5",
                        rx: "1.5",
                        fill: "currentColor",
                        opacity: ".8"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1133,
                        columnNumber: 193
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "1",
                        y: "8",
                        width: "5",
                        height: "5",
                        rx: "1.5",
                        fill: "currentColor",
                        opacity: ".8"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1133,
                        columnNumber: 275
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "8",
                        y: "8",
                        width: "5",
                        height: "5",
                        rx: "1.5",
                        fill: "currentColor",
                        opacity: ".8"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1133,
                        columnNumber: 357
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 1133,
                columnNumber: 51
            }, this)
        },
        {
            id: 'records',
            label: tx.records,
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 14 14",
                fill: "none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                        x: "2",
                        y: "1",
                        width: "10",
                        height: "12",
                        rx: "1.5",
                        stroke: "currentColor",
                        strokeWidth: "1.3"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1134,
                        columnNumber: 107
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M4.5 5h5M4.5 7.5h5M4.5 10h3",
                        stroke: "currentColor",
                        strokeWidth: "1.2",
                        strokeLinecap: "round"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1134,
                        columnNumber: 198
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 1134,
                columnNumber: 47
            }, this)
        },
        ...hasDeadline ? [
            {
                id: 'plazos',
                label: tx.plazos,
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 14 14",
                    fill: "none",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                            cx: "7",
                            cy: "7",
                            r: "5.5",
                            stroke: "currentColor",
                            strokeWidth: "1.3"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1135,
                            columnNumber: 134
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: "M7 4v3l2 1.5",
                            stroke: "currentColor",
                            strokeWidth: "1.3",
                            strokeLinecap: "round"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1135,
                            columnNumber: 205
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1135,
                    columnNumber: 74
                }, this)
            }
        ] : [],
        ...hasAssignee ? [
            {
                id: 'equipo',
                label: tx.equipo,
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 14 14",
                    fill: "none",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                            cx: "5",
                            cy: "5",
                            r: "2.5",
                            stroke: "currentColor",
                            strokeWidth: "1.3"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1136,
                            columnNumber: 134
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                            cx: "10",
                            cy: "5",
                            r: "2",
                            stroke: "currentColor",
                            strokeWidth: "1.2"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1136,
                            columnNumber: 205
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: "M1 12c0-2 1.8-3 4-3s4 1 4 3",
                            stroke: "currentColor",
                            strokeWidth: "1.3",
                            strokeLinecap: "round"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1136,
                            columnNumber: 275
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: "M10.5 9c1.5 0 2.5.8 2.5 2",
                            stroke: "currentColor",
                            strokeWidth: "1.2",
                            strokeLinecap: "round"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1136,
                            columnNumber: 376
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1136,
                    columnNumber: 74
                }, this)
            }
        ] : []
    ];
    const activeNavId = view === 'detail' ? prevView : view;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-40 flex-shrink-0 flex flex-col gap-0.5 pt-2 pr-4",
                children: NAV.map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>navTo(n.id),
                        className: "flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-all",
                        style: n.id === activeNavId ? {
                            background: C.indigo50,
                            color: C.indigo800,
                            fontWeight: 600
                        } : {
                            color: C.text2
                        },
                        onMouseEnter: (e)=>{
                            if (n.id !== activeNavId) e.currentTarget.style.background = C.bg2;
                        },
                        onMouseLeave: (e)=>{
                            if (n.id !== activeNavId) e.currentTarget.style.background = '';
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex-shrink-0 opacity-70",
                                children: n.icon
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1149,
                                columnNumber: 13
                            }, this),
                            n.label
                        ]
                    }, n.id, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1144,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 1142,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto",
                children: [
                    view === 'dashboard' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DashboardView, {
                        section: {
                            ...section,
                            records: rows
                        },
                        onViewRow: viewRow,
                        onGoRecords: ()=>navTo('records'),
                        onGoPlazos: ()=>navTo('plazos'),
                        tx: tx
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1156,
                        columnNumber: 11
                    }, this),
                    view === 'records' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RecordsView, {
                        section: section,
                        projectId: projectId,
                        sectionIdx: sectionIdx,
                        search: search,
                        rows: rows,
                        setRows: setRows,
                        onViewRow: viewRow,
                        tx: tx
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1160,
                        columnNumber: 11
                    }, this),
                    view === 'plazos' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PlazosView, {
                        section: {
                            ...section,
                            records: rows
                        },
                        onViewRow: viewRow,
                        tx: tx
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1164,
                        columnNumber: 11
                    }, this),
                    view === 'equipo' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EquipoView, {
                        section: {
                            ...section,
                            records: rows
                        },
                        tx: tx
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1167,
                        columnNumber: 11
                    }, this),
                    view === 'detail' && detailRow && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DetailView, {
                        row: detailRow,
                        section: section,
                        projectId: projectId,
                        sectionIdx: sectionIdx,
                        allRows: rows,
                        onBack: ()=>navTo(prevView),
                        onUpdated: (u)=>{
                            setRows((p)=>p.map((r)=>r._id === u._id ? u : r));
                            setDetailRow(u);
                        },
                        onDeleted: (id)=>{
                            setRows((p)=>p.filter((r)=>r._id !== id));
                            setDetailRow(null);
                            navTo(prevView);
                        },
                        tx: tx
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1170,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 1154,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 1141,
        columnNumber: 5
    }, this);
}
function ProjectApp({ projectId }) {
    const [project, setProject] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [downloading, setDownloading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetch(`/api/projects/${projectId}`).then((r)=>r.json()).then((d)=>{
            if (d.error) throw new Error(d.error);
            setProject(d);
            setLoading(false);
        }).catch((e)=>{
            setError(String(e));
            setLoading(false);
        });
    }, [
        projectId
    ]);
    async function dl() {
        if (!project) return;
        setDownloading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/download`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (project.originalFilename.replace(/\.[^.]+$/, '') ?? 'export') + '_updated.xlsx';
            a.click();
            URL.revokeObjectURL(url);
        } finally{
            setDownloading(false);
        }
    }
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-screen flex items-center justify-center",
        style: {
            background: C.bg3
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center gap-3",
            style: {
                color: C.text3
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-7 h-7 animate-spin",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                            className: "opacity-25",
                            cx: "12",
                            cy: "12",
                            r: "10",
                            stroke: "currentColor",
                            strokeWidth: "4"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1213,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            className: "opacity-75",
                            fill: "currentColor",
                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1214,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1212,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-[13px]",
                    children: T('en').loading
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1216,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 1211,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 1210,
        columnNumber: 5
    }, this);
    if (error || !project) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-screen flex items-center justify-center",
        style: {
            background: C.bg3
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: C.rose800,
                        fontSize: 14
                    },
                    className: "mb-3",
                    children: error ?? T('en').notFound
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1224,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: "/",
                    style: {
                        color: C.indigo600,
                        fontSize: 13
                    },
                    className: "hover:underline",
                    children: "← Back"
                }, void 0, false, {
                    fileName: "[project]/components/ProjectApp.tsx",
                    lineNumber: 1225,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/ProjectApp.tsx",
            lineNumber: 1223,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 1222,
        columnNumber: 5
    }, this);
    const section = project.sections[active];
    const tx = T(section.schema.language);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-screen overflow-hidden",
        style: {
            background: C.bg3
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "w-[220px] min-w-[220px] flex flex-col",
                style: {
                    background: C.bg,
                    borderRight: `0.5px solid ${C.border}`
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-4 py-[18px]",
                        style: {
                            borderBottom: `0.5px solid ${C.border}`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                                style: {
                                    background: `linear-gradient(135deg,${C.indigo600},#7C3AED)`,
                                    boxShadow: `0 1px 3px rgba(79,70,229,0.3)`
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    viewBox: "0 0 18 18",
                                    fill: "none",
                                    className: "w-4 h-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12",
                                        stroke: "#fff",
                                        strokeWidth: "1.6",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1239,
                                        columnNumber: 70
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 1239,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1238,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[13px] font-semibold truncate",
                                style: {
                                    color: C.text
                                },
                                children: project.name
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1241,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[11px] truncate mt-0.5",
                                style: {
                                    color: C.text3
                                },
                                children: project.originalFilename
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1242,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1237,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest",
                                style: {
                                    color: C.text3
                                },
                                children: project.sections.length === 1 ? 'Sheet' : `Sheets (${project.sections.length})`
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1247,
                                columnNumber: 11
                            }, this),
                            project.sections.map((sec, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setActive(i);
                                        setSearch('');
                                    },
                                    className: "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-all",
                                    style: i === active ? {
                                        background: C.indigo50,
                                        color: C.indigo800,
                                        fontWeight: 600
                                    } : {
                                        color: C.text2
                                    },
                                    onMouseEnter: (e)=>{
                                        if (i !== active) e.currentTarget.style.background = C.bg2;
                                    },
                                    onMouseLeave: (e)=>{
                                        if (i !== active) e.currentTarget.style.background = '';
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "13",
                                            height: "13",
                                            viewBox: "0 0 13 13",
                                            fill: "none",
                                            className: "flex-shrink-0 opacity-50",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                    x: ".5",
                                                    y: ".5",
                                                    width: "12",
                                                    height: "12",
                                                    rx: "1.5",
                                                    stroke: "currentColor",
                                                    strokeWidth: "1.2"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 1257,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M.5 4.5h12M.5 8.5h12M4.5 4.5v8",
                                                    stroke: "currentColor",
                                                    strokeWidth: "1.1"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/ProjectApp.tsx",
                                                    lineNumber: 1258,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 1256,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex-1 truncate",
                                            children: sec.sheetName
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 1260,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] opacity-40 tabular-nums",
                                            children: sec.records.length
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 1261,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 1251,
                                    columnNumber: 13
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest",
                                style: {
                                    color: C.text3
                                },
                                children: tx.manage
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1265,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: dl,
                                disabled: downloading,
                                className: "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-all disabled:opacity-50",
                                style: {
                                    color: C.text2
                                },
                                onMouseEnter: (e)=>{
                                    e.currentTarget.style.background = '#f0fdf4';
                                    e.currentTarget.style.color = C.emerald800;
                                },
                                onMouseLeave: (e)=>{
                                    e.currentTarget.style.background = '';
                                    e.currentTarget.style.color = C.text2;
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "13",
                                        height: "13",
                                        viewBox: "0 0 13 13",
                                        fill: "none",
                                        className: "opacity-60",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M6.5 1v7M3.5 5.5L6.5 8.5l3-3M2 11h9",
                                            stroke: "currentColor",
                                            strokeWidth: "1.3",
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round"
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectApp.tsx",
                                            lineNumber: 1271,
                                            columnNumber: 96
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1271,
                                        columnNumber: 13
                                    }, this),
                                    downloading ? tx.downloading : tx.download
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1266,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1245,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-2 py-3",
                        style: {
                            borderTop: `0.5px solid ${C.border}`
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] transition-all",
                            style: {
                                color: C.text3,
                                textDecoration: 'none'
                            },
                            onMouseEnter: (e)=>{
                                e.currentTarget.style.background = C.bg2;
                                e.currentTarget.style.color = C.text2;
                            },
                            onMouseLeave: (e)=>{
                                e.currentTarget.style.background = '';
                                e.currentTarget.style.color = C.text3;
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "11",
                                    height: "11",
                                    viewBox: "0 0 11 11",
                                    fill: "none",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M7 1.5L3 5.5l4 4",
                                        stroke: "currentColor",
                                        strokeWidth: "1.3",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1281,
                                        columnNumber: 73
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectApp.tsx",
                                    lineNumber: 1281,
                                    columnNumber: 13
                                }, this),
                                tx.back
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1277,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1276,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 1236,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex flex-col overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-14 flex items-center px-5 gap-3 flex-shrink-0",
                        style: {
                            background: C.bg,
                            borderBottom: `0.5px solid ${C.border}`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-[15px] font-semibold flex-shrink-0",
                                style: {
                                    color: C.text
                                },
                                children: section.sheetName
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1290,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] px-2 py-0.5 rounded-full",
                                style: {
                                    color: C.text3,
                                    background: C.bg2
                                },
                                children: [
                                    section.records.length,
                                    " rows"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1291,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1"
                            }, void 0, false, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1294,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 rounded-lg px-3 py-1.5 w-52",
                                style: {
                                    background: C.bg2,
                                    border: `0.5px solid ${C.border}`
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "12",
                                        height: "12",
                                        viewBox: "0 0 12 12",
                                        fill: "none",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                cx: "5",
                                                cy: "5",
                                                r: "4",
                                                stroke: C.text3,
                                                strokeWidth: "1.2"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 1296,
                                                columnNumber: 73
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M8.5 8.5l2 2",
                                                stroke: C.text3,
                                                strokeWidth: "1.2",
                                                strokeLinecap: "round"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProjectApp.tsx",
                                                lineNumber: 1296,
                                                columnNumber: 137
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1296,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: search,
                                        onChange: (e)=>setSearch(e.target.value),
                                        placeholder: tx.search,
                                        className: "bg-transparent text-[13px] outline-none w-full",
                                        style: {
                                            color: C.text
                                        },
                                        "placeholder-style": {
                                            color: C.text3
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectApp.tsx",
                                        lineNumber: 1297,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProjectApp.tsx",
                                lineNumber: 1295,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1289,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 overflow-hidden p-5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionShell, {
                            section: section,
                            projectId: projectId,
                            sectionIdx: active,
                            search: search,
                            tx: tx
                        }, active, false, {
                            fileName: "[project]/components/ProjectApp.tsx",
                            lineNumber: 1304,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectApp.tsx",
                        lineNumber: 1303,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectApp.tsx",
                lineNumber: 1288,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectApp.tsx",
        lineNumber: 1234,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/projects/[id]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProjectPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectApp$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ProjectApp.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
function ProjectPage({ params }) {
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["use"])(params);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectApp$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProjectApp"], {
        projectId: id
    }, void 0, false, {
        fileName: "[project]/app/projects/[id]/page.tsx",
        lineNumber: 7,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=_0wvrfe~._.js.map
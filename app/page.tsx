'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProjectListItem } from '@/lib/types';
import { fmtDate, cn } from '@/lib/utils';

const DOMAIN_LABELS: Record<string, string> = {
  dev_sprint:      'Sprint',
  legal_pendings:  'Legal',
  sales_pipeline:  'Sales',
  inventory:       'Inventory',
  clinic_patients: 'Clinic',
  hr_roster:       'HR',
  generic_table:   'General',
};

const DOMAIN_COLORS: Record<string, string> = {
  dev_sprint:      'bg-indigo-50 text-indigo-700 border-indigo-100',
  legal_pendings:  'bg-violet-50 text-violet-700 border-violet-100',
  sales_pipeline:  'bg-emerald-50 text-emerald-700 border-emerald-100',
  inventory:       'bg-amber-50 text-amber-700 border-amber-100',
  clinic_patients: 'bg-sky-50 text-sky-700 border-sky-100',
  hr_roster:       'bg-rose-50 text-rose-700 border-rose-100',
  generic_table:   'bg-slate-100 text-slate-600 border-slate-200',
};

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 18 18" fill="none" className="w-5 h-5">
              <path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-slate-900">Sheetshift</span>
        </div>
        <Link href="/upload"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v8M3 6l3.5-3.5L10 6M2 11h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New project
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {!loading && projects.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No projects yet</h2>
            <p className="text-[14px] text-slate-500 mb-6 max-w-sm mx-auto">
              Upload any Excel file and Sheetshift turns it into a clean, organised internal app — ready to manage and edit.
            </p>
            <Link href="/upload"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors">
              Create your first project
            </Link>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-black/[0.06] p-5 animate-pulse h-44">
                <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && projects.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-slate-900">My projects</h1>
              <span className="text-[13px] text-slate-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {projects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="group bg-white rounded-xl border border-black/[0.06] p-5 hover:shadow-md hover:border-indigo-200 transition-all block relative">
                  <button
                    onClick={e => handleDelete(p.id, e)}
                    disabled={deleting === p.id}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1.5 9.5l8-8M9.5 9.5l-8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>

                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {p.domains.slice(0, 3).map((d, i) => (
                      <span key={i} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', DOMAIN_COLORS[d] ?? DOMAIN_COLORS.generic_table)}>
                        {DOMAIN_LABELS[d] ?? d}
                      </span>
                    ))}
                    {p.sectionCount > 3 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                        +{p.sectionCount - 3}
                      </span>
                    )}
                  </div>

                  <h3 className="text-[14px] font-semibold text-slate-900 mb-1 truncate pr-7 group-hover:text-indigo-700 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[12px] text-slate-400 truncate mb-4">{p.originalFilename}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-black/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-[18px] font-semibold text-slate-800 leading-none">{p.totalRows}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">rows</div>
                      </div>
                      <div className="w-px h-6 bg-slate-100" />
                      <div className="text-center">
                        <div className="text-[18px] font-semibold text-slate-800 leading-none">{p.sectionCount}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">sheet{p.sectionCount !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">{fmtDate(p.createdAt.slice(0, 10))}</div>
                  </div>
                </Link>
              ))}

              <Link href="/upload"
                className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-slate-400">New project</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

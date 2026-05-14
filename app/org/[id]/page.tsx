'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { fmtDate } from '@/lib/utils';
import { useLang, T } from '@/lib/useLang';
import { LangToggle } from '@/components/LangToggle';

interface Project { id: string; name: string; original_filename: string; created_at: string; }
interface OrgData {
  org: { id: string; name: string; invite_code: string; drive_folder_url?: string };
  projects: Project[]; myRole: string;
}

export default function OrgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lang] = useLang();
  const tx = T[lang];
  const [data, setData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'deleting'>('confirm');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [deleteOrgStep, setDeleteOrgStep] = useState<'confirm' | 'deleting'>('confirm');
  const [deleteOrgError, setDeleteOrgError] = useState<string | null>(null);
  const router = useRouter();
  const sb = createClient();

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetch(`/api/orgs/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setApiError(d.error); setLoading(false); return; }
        setData(d); setLoading(false);
      })
      .catch(e => { setApiError(String(e)); setLoading(false); });
  }, [id]);

  async function signOut() {
    await sb.auth.signOut();
    router.push('/auth/login');
  }

  function copyCode() {
    navigator.clipboard.writeText(data?.org.invite_code ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadProject(projectId: string, filename: string) {
    const res = await fetch(`/api/projects/${projectId}/download`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.[^.]+$/, '') + '_updated.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doDeleteOrg() {
    setDeleteOrgStep('deleting'); setDeleteOrgError(null);
    try {
      const res = await fetch(`/api/orgs/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push('/');
    } catch (e) {
      setDeleteOrgError(String(e)); setDeleteOrgStep('confirm');
    }
  }

  async function doDeleteProject(downloadFirst: boolean) {
    if (!deletingProject) return;
    setDeleteStep('deleting'); setDeleteError(null);
    try {
      if (downloadFirst) await downloadProject(deletingProject.id, deletingProject.original_filename);
      const res = await fetch(`/api/projects/${deletingProject.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setData(prev => prev ? { ...prev, projects: prev.projects.filter(p => p.id !== deletingProject.id) } : prev);
      setDeletingProject(null); setDeleteStep('confirm');
    } catch (e) {
      setDeleteError(String(e)); setDeleteStep('confirm');
    }
  }

  if (loading) return (
    <Shell user={user} onSignOut={signOut} tx={tx}>
      <div className="py-20 text-center text-slate-400">Loading…</div>
    </Shell>
  );

  if (apiError) return (
    <Shell user={user} onSignOut={signOut} tx={tx}>
      <div className="py-20 text-center">
        <p className="text-rose-500 text-[14px] font-medium mb-2">Failed to load organization</p>
        <p className="text-slate-400 text-[13px] max-w-sm mx-auto">{apiError}</p>
      </div>
    </Shell>
  );

  if (!data?.org) return (
    <Shell user={user} onSignOut={signOut} tx={tx}>
      <div className="py-20 text-center text-slate-400">Organization not found.</div>
    </Shell>
  );

  return (
    <Shell user={user} onSignOut={signOut} tx={tx}>
      {/* Delete org modal */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-rose-500">
                <path d="M11 7v5M11 15h.01M21 11a10 10 0 11-20 0 10 10 0 0120 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-[16px] font-semibold text-slate-900 text-center mb-1">Delete organization?</h2>
            <p className="text-[13px] text-slate-500 text-center mb-1">
              <span className="font-medium text-slate-700">{data?.org.name}</span>
            </p>
            <p className="text-[12px] text-slate-400 text-center mb-5">
              This will permanently delete the organization and all its projects and data. This cannot be undone.
            </p>
            {deleteOrgError && <p className="text-[12px] text-rose-500 text-center mb-3">{deleteOrgError}</p>}
            <div className="flex flex-col gap-2">
              <button onClick={doDeleteOrg} disabled={deleteOrgStep === 'deleting'}
                className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50">
                {deleteOrgStep === 'deleting' ? 'Deleting…' : 'Yes, delete organization'}
              </button>
              <button onClick={() => { setDeletingOrg(false); setDeleteOrgStep('confirm'); setDeleteOrgError(null); }}
                disabled={deleteOrgStep === 'deleting'}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete project modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-amber-500">
                <path d="M11 7v5M11 15h.01M21 11a10 10 0 11-20 0 10 10 0 0120 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-[16px] font-semibold text-slate-900 text-center mb-1">Delete project?</h2>
            <p className="text-[13px] text-slate-500 text-center mb-1">
              <span className="font-medium text-slate-700">{deletingProject.name}</span>
            </p>
            <p className="text-[12px] text-slate-400 text-center mb-5">
              Download the latest Excel first to keep a copy of any edits made in the app.
            </p>
            {deleteError && <p className="text-[12px] text-rose-500 text-center mb-3">{deleteError}</p>}
            <div className="flex flex-col gap-2">
              <button onClick={() => doDeleteProject(true)} disabled={deleteStep === 'deleting'}
                className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {deleteStep === 'deleting' ? 'Working…' : 'Download Excel, then delete'}
              </button>
              <button onClick={() => doDeleteProject(false)} disabled={deleteStep === 'deleting'}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50">
                Delete without downloading
              </button>
              <button onClick={() => { setDeletingProject(null); setDeleteStep('confirm'); setDeleteError(null); }}
                disabled={deleteStep === 'deleting'}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Org header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-[12px] text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2 w-fit">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            {tx.orgsTitle}
          </Link>
          <h1 className="text-[22px] font-semibold text-slate-900">{data.org.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] text-slate-400">{tx.inviteCodeLabel}</span>
            <button onClick={copyCode}
              className="text-[12px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors">
              {data.org.invite_code}
            </button>
            {copied && <span className="text-[11px] text-emerald-600">Copied!</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.myRole === 'owner' && (
            <button onClick={() => { setDeletingOrg(true); setDeleteOrgStep('confirm'); setDeleteOrgError(null); }}
              className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 hover:text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete org
            </button>
          )}
          <Link href={`/connect?org=${id}`}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity=".25"/>
              <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Connect sheet
          </Link>
        </div>
      </div>

      {data.projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold text-slate-800 mb-2">No projects yet</h2>
          <p className="text-[13px] text-slate-500 mb-6 max-w-sm mx-auto">Connect a Google Sheet and Sheetshift turns it into a clean, organised app.</p>
          <Link href={`/connect?org=${id}`}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors">
            Connect first sheet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data.projects.map(p => (
            <div key={p.id} className="relative group">
              <Link href={`/projects/${p.id}`}
                className="bg-white rounded-xl border border-black/[0.06] p-5 hover:shadow-md hover:border-indigo-200 transition-all block">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-[14px] font-semibold text-slate-900 mb-1 truncate pr-6 group-hover:text-indigo-700 transition-colors">{p.name}</h3>
                <p className="text-[11px] text-slate-400 truncate mb-3">{p.original_filename}</p>
                <div className="text-[11px] text-slate-400 pt-3 border-t border-black/[0.05]">{fmtDate(p.created_at.slice(0, 10))}</div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingProject(p); setDeleteStep('confirm'); setDeleteError(null); }}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
          <Link href={`/connect?org=${id}`}
            className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span className="text-[13px] font-medium text-slate-400">Connect sheet</span>
          </Link>
        </div>
      )}
    <LangToggle />
    </Shell>
  );
}

function Shell({ user, onSignOut, tx, children }: { user: any; onSignOut: () => void; tx: typeof T['en'] | typeof T['es']; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 18 18" fill="none" className="w-5 h-5">
              <path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <Link href="/" className="text-[15px] font-semibold text-slate-900 hover:text-indigo-700 transition-colors">Sheetshift</Link>
        </div>
        {user && (
          <button onClick={onSignOut} className="text-[12px] text-slate-500 hover:text-slate-800 transition-colors">
            {tx.signOut}
          </button>
        )}
      </header>
      <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
    </div>
  );
}

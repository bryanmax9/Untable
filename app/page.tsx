'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLang, T } from '@/lib/useLang';
import { LangToggle } from '@/components/LangToggle';

interface Org {
  id: string; name: string; invite_code: string;
  created_at: string; role: string;
}

export default function HomePage() {
  const [lang] = useLang();
  const tx = T[lang];
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Org | null>(null);
  const [deleteOrgStep, setDeleteOrgStep] = useState<'confirm' | 'deleting'>('confirm');
  const [deleteOrgError, setDeleteOrgError] = useState<string | null>(null);
  const router = useRouter();
  const sb = createClient();

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetch('/api/orgs')
      .then(r => r.json())
      .then(data => { setOrgs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function signOut() {
    await sb.auth.signOut();
    router.push('/auth/login');
  }

  async function doDeleteOrg() {
    if (!deletingOrg) return;
    setDeleteOrgStep('deleting'); setDeleteOrgError(null);
    try {
      const res = await fetch(`/api/orgs/${deletingOrg.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setOrgs(prev => prev.filter(o => o.id !== deletingOrg.id));
      setDeletingOrg(null); setDeleteOrgStep('confirm');
    } catch (e) {
      setDeleteOrgError(String(e)); setDeleteOrgStep('confirm');
    }
  }

  async function deleteAccount() {
    setDeletingAccount(true); setDeleteAccountError(null);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await sb.auth.signOut();
      router.push('/auth/login');
    } catch (e) {
      setDeleteAccountError(String(e));
      setDeletingAccount(false);
    }
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
        <div className="flex items-center gap-3">
          {user && <span className="text-[12px] text-slate-400 hidden sm:block">{user.email}</span>}
          <button onClick={signOut} className="text-[12px] text-slate-500 hover:text-slate-800 transition-colors">
            {tx.signOut}
          </button>
          <button onClick={() => setShowDeleteAccount(true)}
            className="text-[12px] text-rose-400 hover:text-rose-600 transition-colors">
            Delete account
          </button>
        </div>
      </header>

      {/* Delete account modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-rose-500">
                <path d="M11 7v5M11 15h.01M21 11a10 10 0 11-20 0 10 10 0 0120 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-[16px] font-semibold text-slate-900 text-center mb-1">Delete your account?</h2>
            <p className="text-[13px] text-slate-500 text-center mb-5">
              This permanently deletes your account and removes you from all organizations. This cannot be undone.
            </p>
            {deleteAccountError && (
              <p className="text-[12px] text-rose-500 text-center mb-3">{deleteAccountError}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteAccount(false); setDeleteAccountError(null); }}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={deleteAccount} disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50">
                {deletingAccount ? 'Deleting…' : 'Yes, delete it'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <span className="font-medium text-slate-700">{deletingOrg.name}</span>
            </p>
            <p className="text-[12px] text-slate-400 text-center mb-5">
              This permanently deletes the organization and all its projects and data. This cannot be undone.
            </p>
            {deleteOrgError && <p className="text-[12px] text-rose-500 text-center mb-3">{deleteOrgError}</p>}
            <div className="flex flex-col gap-2">
              <button onClick={doDeleteOrg} disabled={deleteOrgStep === 'deleting'}
                className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50">
                {deleteOrgStep === 'deleting' ? 'Deleting…' : 'Yes, delete organization'}
              </button>
              <button onClick={() => { setDeletingOrg(null); setDeleteOrgStep('confirm'); setDeleteOrgError(null); }}
                disabled={deleteOrgStep === 'deleting'}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900">{tx.orgsTitle}</h1>
            <p className="text-[13px] text-slate-500 mt-1">{tx.orgsSub}</p>
          </div>
          <Link href="/onboarding"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            {tx.newOrg}
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-black/[0.06] p-5 animate-pulse h-36">
                <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && orgs.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No organizations yet</h2>
            <p className="text-[14px] text-slate-500 mb-6 max-w-sm mx-auto">
              Create your first organization or ask a colleague to share their invite code with you.
            </p>
            <Link href="/onboarding"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        )}

        {!loading && orgs.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {orgs.map(org => (
              <div key={org.id} className="relative group">
                <Link href={`/org/${org.id}`}
                  className="bg-white rounded-xl border border-black/[0.06] p-5 hover:shadow-md hover:border-indigo-200 transition-all block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[15px] font-bold text-indigo-600">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      org.role === 'owner' ? 'bg-indigo-50 text-indigo-700' :
                      org.role === 'admin' ? 'bg-violet-50 text-violet-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {org.role === 'owner' ? 'Owner' : org.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-slate-900 mb-0.5 group-hover:text-indigo-700 transition-colors truncate">{org.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{org.invite_code}</p>
                </Link>
                {org.role === 'owner' && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingOrg(org); setDeleteOrgStep('confirm'); setDeleteOrgError(null); }}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}

            <Link href="/onboarding"
              className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-[13px] font-medium text-slate-400">{tx.newOrg}</span>
            </Link>
          </div>
        )}
      </div>

      <footer className="border-t border-black/[0.05] mt-auto py-6 px-6 flex items-center justify-center gap-6 text-[12px] text-slate-400">
        <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
        <span>·</span>
        <span>© {new Date().getFullYear()} Untable</span>
      </footer>
      <LangToggle />
    </div>
  );
}

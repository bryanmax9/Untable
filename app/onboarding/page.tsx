'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang, T } from '@/lib/useLang';

type Mode = 'choose' | 'create' | 'join';

export default function OnboardingPage() {
  const [lang] = useLang();
  const tx = T[lang];
  const [mode, setMode] = useState<Mode>('choose');
  const [orgName, setOrgName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: orgName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Error creating organization'); return; }
    router.push(`/org/${data.id}`);
  }

  async function joinOrg(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/orgs/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Invalid or not found invite code'); return; }
    router.push(`/org/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 18 18" fill="none" className="w-5 h-5">
              <path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-8 shadow-sm">
          {mode === 'choose' && (
            <>
              <h1 className="text-[20px] font-semibold text-slate-900 mb-1">{tx.setupTitle}</h1>
              <p className="text-[13px] text-slate-500 mb-8">{tx.setupSub}</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => setMode('create')}
                  className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 3v12M3 9h12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-slate-900 mb-0.5">{tx.createOrg}</div>
                    <div className="text-[12px] text-slate-500">{tx.createOrgSub}</div>
                  </div>
                </button>

                <button onClick={() => setMode('join')}
                  className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="7" cy="7" r="4" stroke="#64748b" strokeWidth="1.5"/>
                      <path d="M3 15c0-2.5 1.8-4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M13 11v6M16 14h-6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-slate-900 mb-0.5">{tx.joinOrg}</div>
                    <div className="text-[12px] text-slate-500">{tx.joinOrgSub}</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {mode === 'create' && (
            <>
              <button onClick={() => setMode('choose')} className="text-[12px] text-slate-400 hover:text-slate-600 mb-5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Back
              </button>
              <h1 className="text-[18px] font-semibold text-slate-900 mb-1">{tx.orgNameLabel}</h1>
              <p className="text-[13px] text-slate-500 mb-6">Can be your company, team, or project name.</p>
              <form onSubmit={createOrg} className="flex flex-col gap-4">
                <input type="text" required autoFocus value={orgName} onChange={e => setOrgName(e.target.value)}
                  className="auth-input" placeholder={tx.orgNamePlaceholder} />
                {error && <p className="text-[12px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="auth-btn">
                  {loading ? tx.creating2 : tx.create}
                </button>
              </form>
            </>
          )}

          {mode === 'join' && (
            <>
              <button onClick={() => setMode('choose')} className="text-[12px] text-slate-400 hover:text-slate-600 mb-5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Back
              </button>
              <h1 className="text-[18px] font-semibold text-slate-900 mb-1">{tx.inviteCode}</h1>
              <p className="text-[13px] text-slate-500 mb-6">{tx.inviteCodeSub}</p>
              <form onSubmit={joinOrg} className="flex flex-col gap-4">
                <input type="text" required autoFocus value={code} onChange={e => setCode(e.target.value)}
                  className="auth-input font-mono text-center text-[20px] tracking-widest uppercase" maxLength={8}
                  placeholder="ABCD1234" />
                {error && <p className="text-[12px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading || code.length < 4} className="auth-btn">
                  {loading ? tx.joining : tx.join}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`
        .auth-input{width:100%;padding:10px 12px;border-radius:10px;border:0.5px solid rgba(15,23,42,0.18);font-size:14px;outline:none;background:#fff;color:#0f172a;transition:border-color .15s}
        .auth-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.08)}
        .auth-btn{width:100%;padding:11px;border-radius:10px;background:#4F46E5;color:#fff;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:opacity .15s}
        .auth-btn:hover:not(:disabled){opacity:.9}
        .auth-btn:disabled{opacity:.6;cursor:default}
      `}</style>
    </div>
  );
}

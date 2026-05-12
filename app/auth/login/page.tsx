'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLang, T } from '@/lib/useLang';

export default function LoginPage() {
  const [lang] = useLang();
  const tx = T[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sb = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <AuthShell title={tx.login} sub={tx.loginSub}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={tx.email}>
          <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
            className="auth-input" placeholder="you@company.com" />
        </Field>
        <Field label={tx.password}>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="auth-input" placeholder="••••••••" />
        </Field>
        <div className="text-right -mt-1">
          <Link href="/auth/forgot-password" className="text-[12px] text-indigo-600 hover:underline">
            {tx.forgotLink}
          </Link>
        </div>
        {error && <p className="text-[12px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? tx.signingIn : tx.signIn}
        </button>
      </form>
      <p className="text-center text-[13px] text-slate-500 mt-6">
        {tx.noAccount}{' '}
        <Link href="/auth/signup" className="text-indigo-600 font-medium hover:underline">{tx.register}</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 18 18" fill="none" className="w-5 h-5">
              <path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] p-8 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900 mb-1">{title}</h1>
          <p className="text-[13px] text-slate-500 mb-6">{sub}</p>
          {children}
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

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

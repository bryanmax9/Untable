'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLang, T } from '@/lib/useLang';
import { AuthShell, Field } from '@/app/auth/login/page';

export default function ForgotPasswordPage() {
  const [lang] = useLang();
  const tx = T[lang];
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sb = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <AuthShell title={tx.forgotPw} sub={tx.forgotSub}>
      {sent ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11l5 5 9-9" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[14px] text-slate-700 font-medium mb-1">{tx.checkEmail}</p>
          <p className="text-[13px] text-slate-500">{tx.checkEmailSub(email)}</p>
          <Link href="/auth/login" className="mt-6 inline-block text-[13px] text-indigo-600 hover:underline">{tx.backToLogin}</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={tx.email}>
            <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
              className="auth-input" placeholder="you@company.com" />
          </Field>
          {error && <p className="text-[12px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? tx.sending : tx.sendLink}
          </button>
          <Link href="/auth/login" className="text-center text-[13px] text-slate-500 hover:underline">{tx.backToLogin}</Link>
        </form>
      )}
    </AuthShell>
  );
}

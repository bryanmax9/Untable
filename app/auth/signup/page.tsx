'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLang, T } from '@/lib/useLang';
import { AuthShell, Field } from '@/app/auth/login/page';

export default function SignupPage() {
  const [lang] = useLang();
  const tx = T[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sb = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    const { error: signinErr } = await sb.auth.signInWithPassword({ email, password });
    if (signinErr) { router.push('/auth/login?message=check_email'); return; }
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <AuthShell title={tx.signup} sub={tx.signupSub}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={tx.name}>
          <input type="text" required autoFocus value={name} onChange={e => setName(e.target.value)}
            className="auth-input" placeholder="Jane Smith" />
        </Field>
        <Field label={tx.email}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="auth-input" placeholder="you@company.com" />
        </Field>
        <Field label={tx.password}>
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            className="auth-input" placeholder={tx.minChars} />
        </Field>
        {error && <p className="text-[12px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? tx.creating : tx.createAccount}
        </button>
      </form>
      <p className="text-center text-[13px] text-slate-500 mt-6">
        {tx.hasAccount}{' '}
        <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">{tx.loginLink}</Link>
      </p>
    </AuthShell>
  );
}

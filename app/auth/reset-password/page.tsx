'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLang, T } from '@/lib/useLang';
import { AuthShell, Field } from '@/app/auth/login/page';

export default function ResetPasswordPage() {
  const [lang] = useLang();
  const tx = T[lang];
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sb = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError(tx.pwMismatch); return; }
    if (password.length < 8) { setError(tx.pwShort); return; }
    setLoading(true);
    const { error } = await sb.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/');
  }

  return (
    <AuthShell title={tx.resetPw} sub={tx.resetSub}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={tx.password}>
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            className="auth-input" placeholder={tx.minChars} autoFocus />
        </Field>
        <Field label={tx.confirmPw}>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            className="auth-input" placeholder="••••••••" />
        </Field>
        {error && <p className="text-[12px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? tx.saving : tx.save}
        </button>
      </form>
    </AuthShell>
  );
}

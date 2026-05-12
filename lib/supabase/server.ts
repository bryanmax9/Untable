import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(pairs) {
          try { pairs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* Server component — ignore */ }
        },
      },
    },
  );
}

export async function getUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

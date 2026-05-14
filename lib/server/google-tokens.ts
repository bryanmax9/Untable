import { createClient } from '@supabase/supabase-js';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function saveGoogleTokens(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  scopes: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  const { error } = await sb().from('user_google_tokens').upsert({
    user_id:       userId,
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_at:    expiresAt,
    scopes,
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw new Error(`Failed to save Google tokens: ${error.message}`);
}

export async function getGoogleTokens(userId: string) {
  const { data, error } = await sb()
    .from('user_google_tokens')
    .select('access_token, refresh_token, expires_at, scopes')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as {
    access_token: string;
    refresh_token: string | null;
    expires_at: string;
    scopes: string;
  } | null;
}

export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() - Date.now() < 5 * 60 * 1000; // refresh 5 min early
}

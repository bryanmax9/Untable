import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { saveGoogleTokens } from '@/lib/server/google-tokens';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(pairs) {
            pairs.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Persist Google provider tokens so Phase 2 Sheets API calls can use them
      if (data.session.provider_token) {
        try {
          await saveGoogleTokens(
            data.session.user.id,
            data.session.provider_token,
            data.session.provider_refresh_token ?? null,
            'spreadsheets drive.readonly',
          );
        } catch (e) {
          // Don't block the auth flow — tokens refresh on next sign-in
          console.error('Failed to save Google tokens:', e);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}

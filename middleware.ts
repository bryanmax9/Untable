import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/callback'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(pairs) {
          pairs.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          pairs.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Allow public auth paths always
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    // Redirect logged-in users away from auth pages
    if (user && path !== '/auth/callback') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Skip middleware for API routes and static files
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path.includes('.')) {
    return response;
  }

  // Require auth for all other routes
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

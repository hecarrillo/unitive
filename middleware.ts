import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Function to verify the request origin
function isValidOrigin(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');

  // List of allowed domains (including your Vercel deployment URLs)
  const allowedDomains = [
    'https://unitive-zeta.vercel.app',
    'localhost:3000'  // For development
  ];

  // Check if the request is coming from an allowed origin
  return allowedDomains.some(domain => 
    (referer?.includes(domain) || origin?.includes(domain))
  );
}

export async function middleware(request: NextRequest) {
  // Block requests that aren't from your allowed origins
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow local development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }

    // Check for valid origin
    if (!isValidOrigin(request)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden - Invalid origin',
          status: 403,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // If using Supabase Auth, continue with session check
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          status: 401,
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    '/api/:path*',
  ],
};
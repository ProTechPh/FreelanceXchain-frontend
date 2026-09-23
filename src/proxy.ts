import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Intercept proxy requests to backend and attach the internal secret header
  if (pathname === '/api/proxy' || pathname.startsWith('/api/proxy/')) {
    const backendPath = pathname.replace(/^\/api\/proxy/, '/api');
    const backendBase = (process.env.BACKEND_API_URL || 'https://api.freelancexchain.works').replace(/\/+$/, '');

    const targetUrl = new URL(`${backendPath}${search}`, backendBase);

    const requestHeaders = new Headers(request.headers);
    if (process.env.INTERNAL_API_SECRET) {
      requestHeaders.set('x-internal-secret', process.env.INTERNAL_API_SECRET);
    }

    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/proxy', '/api/proxy/:path*'],
};

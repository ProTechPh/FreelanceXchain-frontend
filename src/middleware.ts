import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Redirect legacy proxy requests directly to backend API instead of edge-rewriting
  if (pathname === '/api/proxy' || pathname.startsWith('/api/proxy/')) {
    const backendPath = pathname.replace(/^\/api\/proxy/, '/api');
    const backendBase = (process.env.BACKEND_API_URL || 'https://api.freelancexchain.works').replace(/\/+$/, '');

    const targetUrl = new URL(`${backendPath}${search}`, backendBase);
    return NextResponse.redirect(targetUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/proxy', '/api/proxy/:path*'],
};

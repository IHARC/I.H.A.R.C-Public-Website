import { NextResponse, type NextRequest } from 'next/server';
import { steviPortalUrl } from '@/lib/stevi-portal';

export function middleware(request: NextRequest) {
  const redirectUrl = getSteviRedirectUrl(request);
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/auth/:path*',
    '/login/:path*',
    '/register/:path*',
    '/reset-password/:path*',
    '/api/portal/:path*',
    '/ideas/:path*',
    '/plans/:path*',
    '/progress/:path*',
    '/command-center/:path*',
    '/solutions/:path*',
  ],
};

function getSteviRedirectUrl(request: NextRequest): string | null {
  const { pathname, search } = request.nextUrl;
  const targetPath = mapLegacyPath(pathname);

  if (!targetPath) {
    return null;
  }

  const searchString = search ?? '';
  return `${steviPortalUrl(targetPath)}${searchString}`;
}

function mapLegacyPath(pathname: string): string | null {
  const passthroughPrefixes = ['/portal', '/auth', '/login', '/register', '/reset-password', '/api/portal'];
  if (passthroughPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return pathname;
  }

  if (pathname === '/ideas' || pathname.startsWith('/ideas/')) {
    return `/portal${pathname}`;
  }

  if (pathname === '/plans' || pathname.startsWith('/plans/')) {
    return `/portal${pathname}`;
  }

  if (pathname === '/progress' || pathname.startsWith('/progress/')) {
    return `/portal${pathname}`;
  }

  if (pathname === '/command-center' || pathname.startsWith('/command-center/')) {
    const suffix = pathname.slice('/command-center'.length);
    return suffix ? `/portal${suffix}` : '/portal';
  }

  if (pathname === '/solutions' || pathname.startsWith('/solutions/')) {
    const suffix = pathname.slice('/solutions'.length);
    return suffix ? `/portal/ideas${suffix}` : '/portal/ideas';
  }

  return null;
}

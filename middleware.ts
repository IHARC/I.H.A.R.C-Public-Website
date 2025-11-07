import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { steviPortalUrl } from '@/lib/stevi-portal';

export async function middleware(request: NextRequest) {
  const redirectUrl = getSteviRedirectUrl(request);
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
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

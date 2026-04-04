import { NextResponse } from 'next/server';
import { portfolioAppPathname } from '@/lib/i18n/stripBasePath';
import { seoLocaleFromPathname } from '@/lib/i18n/seoLocaleFromPathname';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  const isPublicResource =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.');

  if (isPublicResource) {
    return NextResponse.next();
  }

  const appPath = portfolioAppPathname(pathname);

  if (appPath === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/u/az';
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-ev-pathname', appPath);
  const seoLocale = seoLocaleFromPathname(appPath);
  if (seoLocale) {
    requestHeaders.set('x-ev-seo-locale', seoLocale);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

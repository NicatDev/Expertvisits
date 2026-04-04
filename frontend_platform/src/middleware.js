import { NextResponse } from 'next/server';
import { seoLocaleFromPathname } from '@/lib/i18n/seoLocaleFromPathname';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    const vacancyLangRedirect = pathname.match(/^\/(en|ru)\/vacancies\/?$/);
    if (vacancyLangRedirect) {
        const url = request.nextUrl.clone();
        url.pathname = `/vacancies/${vacancyLangRedirect[1]}`;
        return NextResponse.redirect(url, 301);
    }

    const companiesLangRedirect = pathname.match(/^\/(en|ru)\/companies\/?$/);
    if (companiesLangRedirect) {
        const url = request.nextUrl.clone();
        url.pathname = `/companies/${companiesLangRedirect[1]}`;
        return NextResponse.redirect(url, 301);
    }

    // 1. Portfolio Proxy
    // If the path starts with /u/, we rewrite it to the portfolio app on port 3001
    if (pathname.startsWith('/u/')) {
        const url = request.nextUrl.clone();
        url.protocol = 'http:';
        url.host = 'localhost:3001';
        // Ensure non-ASCII characters (like 'ə') are properly handled during the rewrite bridge
        url.pathname = encodeURI(decodeURI(url.pathname));
        return NextResponse.rewrite(url);
    }

    // Redirect /u (no trailing slash) to /u/ (with trailing slash)
    // Next.js basePath: '/u' requires the trailing slash for the root path
    if (pathname === '/u') {
        const url = request.nextUrl.clone();
        url.pathname = '/u/';
        return NextResponse.redirect(url);
    }

    // 2. Resource handling
    // Prevent middleware intercepting Next.js internal requests, API, Images, or static files
    const isPublicResource = pathname.startsWith('/_next') ||
                             pathname.startsWith('/api') || 
                             pathname.startsWith('/admin') ||
                             pathname.startsWith('/sitemap') ||
                             pathname === '/robots.txt' ||
                             pathname.includes('.');

    if (isPublicResource) {
        return NextResponse.next();
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-ev-pathname', pathname);
    const seoLocale = seoLocaleFromPathname(pathname);
    if (seoLocale) {
        requestHeaders.set('x-ev-seo-locale', seoLocale);
    }

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

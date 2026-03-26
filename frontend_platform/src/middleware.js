import { NextResponse } from 'next/server';

const locales = ['az', 'en', 'ru'];
const defaultLocale = 'en';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Check if the current path already starts with a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        return NextResponse.next();
    }

    // 2. Prevent middleware intercepting Next.js internal requests, API, Images, or static files like robots/sitemap
    const isPublicResource = pathname.startsWith('/_next') ||
                             pathname.startsWith('/api') || 
                             pathname.startsWith('/admin') ||
                             pathname.startsWith('/u/') || // Portfolio links
                             pathname === '/sitemap.xml' || 
                             pathname === '/robots.txt' ||
                             pathname.includes('.'); // Static files (e.g. .png, .css)

    if (isPublicResource) {
        return NextResponse.next();
    }

    // 3. Fallback logic: Try resolving saved user preference via cookies
    const cookieLocale = request.cookies.get('i18next')?.value;
    const targetLocale = locales.includes(cookieLocale) ? cookieLocale : defaultLocale;

    // 4. Perform transparent 307 temporary redirect (SEO standard for dynamic locale fallback)
    request.nextUrl.pathname = `/${targetLocale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
}

// NextJS Router Matcher config
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - u/ (Portfolio endpoints)
         */
        '/((?!_next/static|_next/image|favicon.ico|u/).*)',
    ],
};

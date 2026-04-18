import { NextResponse } from 'next/server';
import { seoLocaleFromPathname } from '@/lib/i18n/seoLocaleFromPathname';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Portfolio proxy
  if (pathname.startsWith('/u/')) {
    const url = request.nextUrl.clone();
    url.protocol = 'http:';
    url.host = 'localhost:3001';
    url.pathname = encodeURI(decodeURI(url.pathname));
    return NextResponse.rewrite(url);
  }

  if (pathname === '/u') {
    const url = request.nextUrl.clone();
    url.pathname = '/u/';
    return NextResponse.redirect(url);
  }

  const isPublicResource =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/sitemap') ||
    pathname === '/robots.txt' ||
    pathname.includes('.');

  if (isPublicResource) {
    return NextResponse.next();
  }

  // Default locale: root → /az
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = '/az';
    return NextResponse.redirect(url, 308);
  }

  // Legacy routes without /{locale} prefix → /az/…
  const firstSeg = pathname.split('/').filter(Boolean)[0];
  const hasLocalePrefix = firstSeg === 'az' || firstSeg === 'en' || firstSeg === 'ru';
    if (!hasLocalePrefix) {
        if (
            pathname === '/profile' ||
            pathname.startsWith('/profile/') ||
            pathname === '/chat' ||
            pathname.startsWith('/chat/') ||
            pathname === '/notifications' ||
            pathname.startsWith('/notifications/') ||
            pathname.startsWith('/user/') ||
            pathname === '/companies' ||
            pathname.startsWith('/companies/')
        ) {
      const url = request.nextUrl.clone();
      url.pathname = `/az${pathname}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // Legacy unprefixed marketing URLs → /{locale}/…
  const legacyExact = [
    [/^\/experts\/?$/, '/az/experts'],
    [/^\/experts\/en\/?$/, '/en/experts'],
    [/^\/experts\/ru\/?$/, '/ru/experts'],
    [/^\/vacancies\/?$/, '/az/vacancies'],
    [/^\/vacancies\/en\/?$/, '/en/vacancies'],
    [/^\/vacancies\/ru\/?$/, '/ru/vacancies'],
    [/^\/companies\/?$/, '/az/companies'],
    [/^\/companies\/en\/?$/, '/en/companies'],
    [/^\/companies\/ru\/?$/, '/ru/companies'],
    [/^\/website-template\/?$/, '/az/website-template'],
  ];

  for (const [pattern, dest] of legacyExact) {
    if (pattern.test(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = dest;
      return NextResponse.redirect(url, 308);
    }
  }

  const articleLegacy = pathname.match(/^\/article\/([^/]+)\/?$/);
  if (articleLegacy) {
    const url = request.nextUrl.clone();
    url.pathname = `/az/article/${articleLegacy[1]}`;
    return NextResponse.redirect(url, 308);
  }

  const quizLegacy = pathname.match(/^\/quiz\/([^/]+)\/?$/);
  if (quizLegacy) {
    const url = request.nextUrl.clone();
    url.pathname = `/az/quiz/${quizLegacy[1]}`;
    return NextResponse.redirect(url, 308);
  }

  const vacancySlug = pathname.match(/^\/vacancies\/([^/]+)\/?$/);
  if (vacancySlug) {
    const seg = vacancySlug[1];
    if (seg !== 'en' && seg !== 'ru' && seg !== 'az') {
      const url = request.nextUrl.clone();
      url.pathname = `/az/vacancies/${seg}`;
      return NextResponse.redirect(url, 308);
    }
  }

  const companySlug = pathname.match(/^\/companies\/([^/]+)\/?$/);
  if (companySlug) {
    const seg = companySlug[1];
    if (seg !== 'en' && seg !== 'ru' && seg !== 'az') {
      const url = request.nextUrl.clone();
      url.pathname = `/az/companies/${seg}`;
      return NextResponse.redirect(url, 308);
    }
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

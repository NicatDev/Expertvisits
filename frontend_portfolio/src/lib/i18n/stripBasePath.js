const PORTFOLIO_BASE = '/u';

/** Next pathname (includes basePath) -> path inside app, e.g. /u/en -> /en */
export function portfolioAppPathname(pathname) {
  if (!pathname || !pathname.startsWith('/u')) {
    return pathname || '/';
  }
  if (pathname === '/u' || pathname === '/u/') {
    return '/';
  }
  if (pathname.startsWith('/u/')) {
    return pathname.slice(PORTFOLIO_BASE.length);
  }
  return pathname;
}

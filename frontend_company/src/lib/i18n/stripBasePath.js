const COMPANY_BASE = '/c';

/** Next pathname (includes basePath) -> path inside app, e.g. /c/en -> /en */
export function companyAppPathname(pathname) {
  if (!pathname || !pathname.startsWith('/c')) {
    return pathname || '/';
  }
  if (pathname === '/c' || pathname === '/c/') {
    return '/';
  }
  if (pathname.startsWith('/c/')) {
    return pathname.slice(COMPANY_BASE.length);
  }
  return pathname;
}

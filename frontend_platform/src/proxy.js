import { NextResponse } from 'next/server';

export function proxy(request) {
    const { pathname } = request.nextUrl;

    // Prevent middleware intercepting Next.js internal requests, API, Images, or static files
    const isPublicResource = pathname.startsWith('/_next') ||
                             pathname.startsWith('/api') || 
                             pathname.startsWith('/admin') ||
                             pathname.startsWith('/u/') || // Portfolio links
                             pathname === '/sitemap.xml' || 
                             pathname === '/robots.txt' ||
                             pathname.includes('.'); // Static files

    if (isPublicResource) {
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|u/).*)',
    ],
};

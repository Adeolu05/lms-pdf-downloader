import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * On Vercel, `/courses` and `/progress` suggest a working in-browser LMS flow.
 * Redirect to the download landing so students are not misled.
 */
export function middleware(request: NextRequest) {
    if (process.env.VERCEL !== '1') {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;
    if (pathname === '/courses' || pathname.startsWith('/courses/') || pathname === '/progress' || pathname.startsWith('/progress/')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('hint', 'download');
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/courses', '/courses/:path*', '/progress', '/progress/:path*'],
};

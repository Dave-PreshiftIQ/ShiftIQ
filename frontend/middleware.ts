import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute  = createRouteMatcher(['/admin(.*)']);
const isClientRoute = createRouteMatcher(['/client(.*)']);
const isVendorRoute = createRouteMatcher(['/vendor(.*)']);
const isPublicRoute = createRouteMatcher([
  '/', '/sign-in(.*)', '/sign-up(.*)', '/403', '/api/public(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url));

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

  if (isAdminRoute(req)  && role !== 'admin')  return NextResponse.redirect(new URL('/403', req.url));
  if (isClientRoute(req) && role !== 'client') return NextResponse.redirect(new URL('/403', req.url));
  if (isVendorRoute(req) && role !== 'vendor') return NextResponse.redirect(new URL('/403', req.url));
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

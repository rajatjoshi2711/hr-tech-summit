import { NextResponse, type NextRequest } from 'next/server';
import { PIN_COOKIE, getPin, pinToken, sameToken } from '@/lib/pin';

/** Everything except the PIN page, the verify route, and static assets. */
export const config = {
  matcher: ['/((?!pin|api/pin|_next|favicon.ico|logo-|robots.txt).*)'],
};

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(PIN_COOKIE)?.value;
  if (cookie && sameToken(cookie, await pinToken(getPin()))) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'locked' }, { status: 401 });
  }

  const target = request.nextUrl.clone();
  target.pathname = '/pin';
  target.search = '';
  return NextResponse.redirect(target);
}

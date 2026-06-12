import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fintrack-secret-key-should-be-very-long-and-secure-12345'
);

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  const user = token ? await verifyJWT(token) : null;

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isApiAuthRoute = pathname.startsWith('/api/auth');

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const isPrivateRoute = 
    pathname === '/' ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/savings') ||
    pathname.startsWith('/settings');

  if (isPrivateRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const isPrivateApiRoute = pathname.startsWith('/api') && !isApiAuthRoute;
  if (isPrivateApiRoute && !user) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

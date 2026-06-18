import { NextResponse } from 'next/server';

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
  return response;
}

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
  return response;
}

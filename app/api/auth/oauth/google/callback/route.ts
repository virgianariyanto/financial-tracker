import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { initializeUserCategories } from '@/lib/category-initializer';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  picture: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

  // Get state from cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const cookiePairs = cookieHeader.split(';').map(c => c.trim());
  const stateCookie = cookiePairs.find(c => c.startsWith('oauth_state='));
  const storedState = stateCookie?.split('=')[1];

  // CSRF validation
  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=oauth_state_mismatch', baseUrl));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/oauth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(new URL('/login?error=oauth_token_failed', baseUrl));
    }

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL('/login?error=oauth_userinfo_failed', baseUrl));
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    // Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.sub },
          { email: googleUser.email },
        ],
        deletedAt: null,
      },
    });

    if (user) {
      // If user exists via email but no googleId yet — link the Google account
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.sub },
        });
      }
    } else {
      // Create new user from Google data
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.sub,
          // password is null for Google users
        },
      });

      // Initialize default categories for the new Google user
      await initializeUserCategories(user.id);
    }

    // Create JWT session
    const token = await signJWT({ id: user.id, email: user.email, role: user.role });
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.redirect(new URL('/', baseUrl));

    // Clear the oauth_state cookie
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_server_error', baseUrl));
  }
}

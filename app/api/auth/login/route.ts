import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, getIpFromRequest } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  // Rate limit: max 5 percobaan login per IP per 15 menit
  const ip = getIpFromRequest(req);
  const rl = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.success) {
    const retryAfterSec = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(retryAfterSec / 60)} menit.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // User registered via Google and has no password
    if (!user.password) {
      return NextResponse.json(
        { error: 'This account uses Google Sign-In. Please use the "Continue with Google" button.' },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signJWT({ id: user.id, email: user.email, role: user.role });

    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 200 });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

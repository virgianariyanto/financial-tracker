import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  userName: z.string().min(1).max(60).optional(),
  preferredCurrency: z.string().length(3).toUpperCase().optional(),
});

// GET /api/user/profile — Ambil profil lengkap user yang sedang login
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userName: true,
        preferredCurrency: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/user/profile — Update preferensi user (userName, preferredCurrency)
export async function PATCH(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { userName, preferredCurrency } = result.data;

    const updateData: { userName?: string; preferredCurrency?: string } = {};
    if (userName !== undefined) updateData.userName = userName;
    if (preferredCurrency !== undefined) updateData.preferredCurrency = preferredCurrency;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userName: true,
        preferredCurrency: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

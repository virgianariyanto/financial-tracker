import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  icon: z.string().min(1).max(50),
  color: z.string().min(3).max(20),
  type: z.enum(['INCOME', 'EXPENSE']),
});

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const presets = await prisma.category.findMany({
      where: { userId: null },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(presets);
  } catch (error) {
    console.error('Failed to fetch category presets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    // Check for duplicate name globally
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: result.data.name,
          mode: 'insensitive',
        },
        userId: null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A preset category with this name already exists' }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        ...result.data,
        userId: null,
        isDefault: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category preset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = {};
    if (type === 'INCOME' || type === 'EXPENSE') {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where: {
        ...where,
        OR: [
          { userId: null },
          { userId },
        ],
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: result.data.name,
          mode: 'insensitive',
        },
        OR: [
          { userId: null },
          { userId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        ...result.data,
        userId,
        isDefault: false,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


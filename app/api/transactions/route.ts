import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';

const transactionSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().optional(),
  date: z.coerce.date(),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: any = { userId };

    if (type === 'INCOME' || type === 'EXPENSE') {
      where.type = type;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
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
    const result = transactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const { amount, currency, type, description, date, categoryId, tags } = result.data;

    // Verify category exists and is accessible
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [
          { userId: null },
          { userId },
        ],
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        currency,
        type,
        description,
        date,
        categoryId,
        userId,
        tags: tags || [],
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


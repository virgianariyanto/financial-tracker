import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';
import { startOfDay } from 'date-fns';

const recurringSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().optional(),
  interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  categoryId: z.string().uuid('Please select a category'),
});

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Failed to fetch recurring transactions:', error);
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
    const result = recurringSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const { amount, currency, type, description, interval, startDate, endDate, categoryId } = result.data;

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

    const schedule = await prisma.recurringTransaction.create({
      data: {
        amount,
        currency,
        type,
        description,
        interval,
        startDate: startOfDay(startDate),
        endDate: endDate ? startOfDay(endDate) : null,
        nextOccurrence: startOfDay(startDate), // kejadian pertama pada startDate
        categoryId,
        userId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Failed to create recurring transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

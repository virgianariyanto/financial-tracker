import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive('Budget amount must be positive'),
  currency: z.string().min(3).max(3).default('IDR'),
  period: z.enum(['MONTHLY', 'WEEKLY']).default('MONTHLY'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch all expense categories
    const categories = await prisma.category.findMany({
      where: { type: 'EXPENSE' },
      orderBy: { name: 'asc' },
    });

    // 2. Fetch budgets for this period
    const budgets = await prisma.budget.findMany({
      where: {
        month,
        year,
        period: 'MONTHLY',
      },
    });

    // 3. Aggregate transactions by category for this period
    const transactionsGrouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Map together
    const results = categories.map((category) => {
      const budget = budgets.find((b) => b.categoryId === category.id) || null;
      const txSum = transactionsGrouped.find((t) => t.categoryId === category.id);
      const actual = txSum?._sum.amount || 0;

      return {
        id: budget?.id || null,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        amount: budget?.amount || 0,
        currency: budget?.currency || 'IDR',
        actual,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = budgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const { categoryId, amount, currency, period, month, year } = result.data;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const budget = await prisma.budget.upsert({
      where: {
        categoryId_month_year_period: {
          categoryId,
          month,
          year,
          period,
        },
      },
      update: {
        amount,
        currency,
      },
      create: {
        categoryId,
        amount,
        currency,
        period,
        month,
        year,
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Failed to create/update budget:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

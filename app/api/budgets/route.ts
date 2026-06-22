import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';
import { getExchangeRates, convertCurrency } from '@/lib/rates';

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
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const targetCurrency = (searchParams.get('currency') || 'IDR').toUpperCase();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const rates = await getExchangeRates();

    // 1. Fetch all expense categories
    const categories = await prisma.category.findMany({
      where: {
        type: 'EXPENSE',
        OR: [
          { userId: null },
          { userId },
        ],
      },
      orderBy: { name: 'asc' },
    });

    // 2. Fetch budgets for this period and user
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month,
        year,
        period: 'MONTHLY',
      },
    });

    // 3. Fetch all expense transactions for this period and user
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Map together
    const results = categories.map((category: any) => {
      const budget = budgets.find((b: any) => b.categoryId === category.id) || null;
      
      // Calculate actual expenses for this category, converting each transaction to the target currency
      const catTransactions = transactions.filter((t: any) => t.categoryId === category.id);
      const actual = catTransactions.reduce((sum: number, tx: any) => {
        return sum + convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
      }, 0);

      // Convert the budget limit amount to the target currency
      const limitAmount = budget 
        ? convertCurrency(budget.amount, budget.currency, targetCurrency, rates)
        : 0;

      return {
        id: budget?.id || null,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        amount: limitAmount,
        currency: targetCurrency,
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
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = budgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const { categoryId, amount, currency, period, month, year } = result.data;

    // Check if category exists
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
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year_period: {
          userId,
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
        userId,
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


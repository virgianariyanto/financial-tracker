import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { getExchangeRates, convertCurrency } from '@/lib/rates';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const targetCurrency = (searchParams.get('currency') || 'IDR').toUpperCase();

    const skip = (page - 1) * limit;

    // 1. Build where filter
    const where: any = {};

    if (type === 'INCOME' || type === 'EXPENSE') {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end of day for the endDate
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 2. Fetch data in parallel
    const [transactions, total, rates, incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      getExchangeRates(),
      prisma.transaction.groupBy({
        by: ['currency'],
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['currency'],
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    // 3. Convert stats sums to targetCurrency
    const totalIncome = incomeAgg.reduce((sum, row) => {
      return sum + convertCurrency(row._sum.amount ?? 0, row.currency, targetCurrency, rates);
    }, 0);

    const totalExpense = expenseAgg.reduce((sum, row) => {
      return sum + convertCurrency(row._sum.amount ?? 0, row.currency, targetCurrency, rates);
    }, 0);

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalIncome,
        totalExpense,
        totalVolume: totalIncome + totalExpense,
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

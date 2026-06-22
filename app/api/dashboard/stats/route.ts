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

    const { searchParams } = new URL(request.url);
    const targetCurrency = (searchParams.get('currency') || 'IDR').toUpperCase();

    const rates = await getExchangeRates();

    // ─── 1. Aggregate total income & expense per currency (jauh lebih efisien) ───
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['currency'],
        where: { userId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['currency'],
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg.reduce((sum, row) => {
      return sum + convertCurrency(row._sum.amount ?? 0, row.currency, targetCurrency, rates);
    }, 0);

    const totalExpense = expenseAgg.reduce((sum, row) => {
      return sum + convertCurrency(row._sum.amount ?? 0, row.currency, targetCurrency, rates);
    }, 0);

    // ─── 2. Total savings (aggregate per currency) ───
    const savingsAgg = await prisma.savingsGoal.groupBy({
      by: ['currency'],
      where: { userId },
      _sum: { currentAmount: true },
    });

    const totalSavings = savingsAgg.reduce((sum, row) => {
      return sum + convertCurrency(row._sum.currentAmount ?? 0, row.currency, targetCurrency, rates);
    }, 0);

    // ─── 3. Category breakdown (expenses) — groupBy category ───
    const categoryExpenses = await prisma.transaction.groupBy({
      by: ['categoryId', 'currency'],
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    });

    // Ambil info kategori yang dibutuhkan saja
    const categoryIds = [...new Set(categoryExpenses.map((r) => r.categoryId))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    const breakdownMap: Record<string, { amount: number; color: string }> = {};
    categoryExpenses.forEach((row) => {
      const cat = categoryMap[row.categoryId];
      if (!cat) return;
      const converted = convertCurrency(row._sum.amount ?? 0, row.currency, targetCurrency, rates);
      if (!breakdownMap[cat.name]) {
        breakdownMap[cat.name] = { amount: 0, color: cat.color };
      }
      breakdownMap[cat.name].amount += converted;
    });

    const categoryBreakdown = Object.entries(breakdownMap).map(([name, val]) => ({
      name,
      value: val.amount,
      color: val.color,
    }));

    // ─── 4. Monthly trends (last 6 months) — ambil data bulan yang perlu saja ───
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendTransactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { amount: true, currency: true, type: true, date: true },
      orderBy: { date: 'asc' },
    });

    const monthlyTrendsMap: Record<string, { income: number; expenses: number }> = {};
    trendTransactions.forEach((tx) => {
      const monthStr = new Date(tx.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const convertedAmount = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
      if (!monthlyTrendsMap[monthStr]) {
        monthlyTrendsMap[monthStr] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'INCOME') {
        monthlyTrendsMap[monthStr].income += convertedAmount;
      } else {
        monthlyTrendsMap[monthStr].expenses += convertedAmount;
      }
    });

    const monthlyTrends = Object.entries(monthlyTrendsMap)
      .map(([name, val]) => ({ name, ...val }))
      .slice(-6);

    // ─── 5. Hanya ambil 5 transaksi terbaru dan 3 savings goals ───
    const [recentTransactions, savingsGoals] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.savingsGoal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const recentTransactionsConverted = recentTransactions.map((tx) => ({
      ...tx,
      amount: convertCurrency(tx.amount, tx.currency, targetCurrency, rates),
      currency: targetCurrency,
    }));

    const savingsGoalsConverted = savingsGoals.map((goal) => ({
      ...goal,
      currentAmount: convertCurrency(goal.currentAmount, goal.currency, targetCurrency, rates),
      targetAmount: convertCurrency(goal.targetAmount, goal.currency, targetCurrency, rates),
      currency: targetCurrency,
    }));

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        totalSavings,
      },
      categoryBreakdown,
      monthlyTrends,
      recentTransactions: recentTransactionsConverted,
      savingsGoals: savingsGoalsConverted,
    });
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

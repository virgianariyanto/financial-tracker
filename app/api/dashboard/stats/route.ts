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

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        contributions: true,
      },
    });

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });

    // Summary calculations
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx: any) => {
      const convertedAmount = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
      if (tx.type === 'INCOME') {
        totalIncome += convertedAmount;
      } else {
        totalExpense += convertedAmount;
      }
    });

    const totalSavings = savingsGoals.reduce((sum: number, goal: any) => {
      const convertedCurrent = convertCurrency(goal.currentAmount, goal.currency, targetCurrency, rates);
      return sum + convertedCurrent;
    }, 0);

    // Category breakdown (Expenses only)
    const categoryBreakdown: { [name: string]: { amount: number; color: string } } = {};
    transactions
      .filter((tx: any) => tx.type === 'EXPENSE')
      .forEach((tx: any) => {
        const catName = tx.category.name;
        const convertedAmount = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
        if (!categoryBreakdown[catName]) {
          categoryBreakdown[catName] = { amount: 0, color: tx.category.color };
        }
        categoryBreakdown[catName].amount += convertedAmount;
      });

    const categoryBreakdownArray = Object.entries(categoryBreakdown).map(([name, val]) => ({
      name,
      value: val.amount,
      color: val.color,
    }));

    // Monthly trends (Last 6 months)
    const monthlyTrendsMap: { [monthStr: string]: { income: number; expenses: number } } = {};
    transactions.forEach((tx: any) => {
      const date = new Date(tx.date);
      const monthStr = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
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
      .map(([name, val]) => ({
        name,
        income: val.income,
        expenses: val.expenses,
      }))
      .reverse()
      .slice(-6); // Only last 6 months

    // Convert recent transactions for display in target currency
    const recentTransactionsConverted = transactions.slice(0, 5).map((tx: any) => ({
      ...tx,
      amount: convertCurrency(tx.amount, tx.currency, targetCurrency, rates),
      currency: targetCurrency,
    }));

    // Convert savings goals for display in target currency
    const savingsGoalsConverted = savingsGoals.slice(0, 3).map((goal: any) => ({
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
      categoryBreakdown: categoryBreakdownArray,
      monthlyTrends,
      recentTransactions: recentTransactionsConverted,
      savingsGoals: savingsGoalsConverted,
      budgets: budgets.slice(0, 3), // Budget formatting handles conversion differently based on category
    });
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


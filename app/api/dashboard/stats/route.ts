import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const categories = await prisma.category.findMany();
    const savingsGoals = await prisma.savingsGoal.findMany({
      include: {
        contributions: true,
      },
    });

    const budgets = await prisma.budget.findMany({
      include: {
        category: true,
      },
    });

    // Summary calculations
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    });

    const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    // Category breakdown (Expenses only)
    const categoryBreakdown: { [name: string]: { amount: number; color: string } } = {};
    transactions
      .filter(tx => tx.type === 'EXPENSE')
      .forEach(tx => {
        const catName = tx.category.name;
        if (!categoryBreakdown[catName]) {
          categoryBreakdown[catName] = { amount: 0, color: tx.category.color };
        }
        categoryBreakdown[catName].amount += tx.amount;
      });

    const categoryBreakdownArray = Object.entries(categoryBreakdown).map(([name, val]) => ({
      name,
      value: val.amount,
      color: val.color,
    }));

    // Monthly trends (Last 6 months)
    const monthlyTrendsMap: { [monthStr: string]: { income: number; expenses: number } } = {};
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthStr = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyTrendsMap[monthStr]) {
        monthlyTrendsMap[monthStr] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'INCOME') {
        monthlyTrendsMap[monthStr].income += tx.amount;
      } else {
        monthlyTrendsMap[monthStr].expenses += tx.amount;
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

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        totalSavings,
      },
      categoryBreakdown: categoryBreakdownArray,
      monthlyTrends,
      recentTransactions: transactions.slice(0, 5),
      savingsGoals: savingsGoals.slice(0, 3),
      budgets: budgets.slice(0, 3),
    });
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

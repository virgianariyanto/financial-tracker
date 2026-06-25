import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all database records
    const [
      users,
      categories,
      transactions,
      budgets,
      savingsGoals,
      savingsContributions,
      recurringTransactions,
      supportTickets
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.transaction.findMany(),
      prisma.budget.findMany(),
      prisma.savingsGoal.findMany(),
      prisma.savingsContribution.findMany(),
      prisma.recurringTransaction.findMany(),
      prisma.supportTicket.findMany()
    ]);

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        categories,
        transactions,
        budgets,
        savingsGoals,
        savingsContributions,
        recurringTransactions,
        supportTickets
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `finora_backup_${dateStr}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch (error: any) {
    console.error('Backup export failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

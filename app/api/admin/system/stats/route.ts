import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import os from 'os';

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

    // 1. Fetch Database Telemetry (PostgreSQL specific)
    let dbSizeBytes = 0;
    let activeConnections = 1;
    let dbVersion = 'PostgreSQL';

    try {
      const sizeResult = await prisma.$queryRaw<any[]>`
        SELECT pg_database_size(current_database()) AS size_bytes
      `;
      if (sizeResult && sizeResult[0]) {
        dbSizeBytes = Number(sizeResult[0].size_bytes || 0);
      }
    } catch (e) {
      console.warn('Failed to fetch pg_database_size, using fallback:', e);
    }

    try {
      const connResult = await prisma.$queryRaw<any[]>`
        SELECT count(*)::int AS active_connections FROM pg_stat_activity
      `;
      if (connResult && connResult[0]) {
        activeConnections = Number(connResult[0].active_connections || 1);
      }
    } catch (e) {
      console.warn('Failed to fetch pg_stat_activity, using fallback:', e);
    }

    try {
      const versionResult = await prisma.$queryRaw<any[]>`
        SELECT version() AS db_version
      `;
      if (versionResult && versionResult[0]) {
        dbVersion = String(versionResult[0].db_version || 'PostgreSQL');
      }
    } catch (e) {
      console.warn('Failed to fetch PostgreSQL version, using fallback:', e);
    }

    // 2. Fetch Database Table Counts (Prisma)
    const [
      userCount,
      transactionCount,
      budgetCount,
      categoryCount,
      savingsGoalCount,
      supportTicketCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.budget.count(),
      prisma.category.count(),
      prisma.savingsGoal.count(),
      prisma.supportTicket.count(),
    ]);

    // 3. Fetch OS & Process Telemetry
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
    
    const cpuModel = os.cpus()[0]?.model || 'Unknown CPU';
    const cpuCores = os.cpus().length;
    const sysUptime = os.uptime();
    const processUptime = process.uptime();

    // Node.js Process Memory
    const processMemory = process.memoryUsage();

    // 4. Fetch Daily Transaction Volume (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let transactionTrends: any[] = [];
    try {
      const txTrendsRaw = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE_TRUNC('day', date) AS day,
          COUNT(id)::int AS count,
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)::float AS income,
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)::float AS expense
        FROM "Transaction"
        WHERE date >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', date)
        ORDER BY day ASC
      `;

      transactionTrends = txTrendsRaw.map((item) => ({
        date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: Number(item.count || 0),
        income: Number(item.income || 0),
        expense: Number(item.expense || 0),
      }));
    } catch (e) {
      console.error('Failed to fetch transaction trends:', e);
    }

    // 5. Fetch Daily User Growth (Last 30 Days)
    let userTrends: any[] = [];
    try {
      const userTrendsRaw = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE_TRUNC('day', "createdAt") AS day,
          COUNT(id)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `;

      userTrends = userTrendsRaw.map((item) => ({
        date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: Number(item.count || 0),
      }));
    } catch (e) {
      console.error('Failed to fetch user trends:', e);
    }

    // Return aggregated stats payload
    return NextResponse.json({
      db: {
        sizeBytes: dbSizeBytes,
        activeConnections,
        version: dbVersion,
        counts: {
          users: userCount,
          transactions: transactionCount,
          budgets: budgetCount,
          categories: categoryCount,
          savingsGoals: savingsGoalCount,
          supportTickets: supportTicketCount,
        },
      },
      system: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpu: {
          model: cpuModel,
          cores: cpuCores,
        },
        memory: {
          total: totalMem,
          free: freeMem,
          usagePercent: memUsagePercent,
        },
        process: {
          uptime: processUptime,
          memory: {
            rss: processMemory.rss,
            heapTotal: processMemory.heapTotal,
            heapUsed: processMemory.heapUsed,
            external: processMemory.external,
          },
        },
        uptime: sysUptime,
      },
      charts: {
        transactions: transactionTrends,
        users: userTrends,
      },
    });
  } catch (error) {
    console.error('Failed to retrieve system health stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

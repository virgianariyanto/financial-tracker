import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const skip = (page - 1) * limit;

    // Build filter query
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Run parallel queries
    const [tickets, total, pendingCount, resolvedCount, inProgressCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { status: 'PENDING' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    ]);

    return NextResponse.json({
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalTickets: await prisma.supportTicket.count(),
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin support tickets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

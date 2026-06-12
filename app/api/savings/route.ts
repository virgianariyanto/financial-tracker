import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';

const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().nonnegative().default(0),
  currency: z.string().min(3).max(3),
  deadline: z.string().transform(val => new Date(val)).optional().nullable(),
  icon: z.string().min(1),
  color: z.string().min(3),
});

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Failed to fetch savings goals:', error);
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
    const result = savingsGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        ...result.data,
        userId,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Failed to create savings goal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


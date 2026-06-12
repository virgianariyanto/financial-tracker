import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';

const contributionSchema = z.object({
  amount: z.number().positive('Contribution amount must be positive'),
  date: z.string().transform(val => new Date(val)),
  note: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: goalId } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await prisma.savingsGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    const contributions = await prisma.savingsContribution.findMany({
      where: { goalId },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(contributions);
  } catch (error) {
    console.error('Failed to fetch contributions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: goalId } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = contributionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const goal = await prisma.savingsGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    const [contribution] = await prisma.$transaction([
      prisma.savingsContribution.create({
        data: {
          ...result.data,
          goalId,
        },
      }),
      prisma.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: {
            increment: result.data.amount,
          },
        },
      }),
    ]);

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    console.error('Failed to create contribution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


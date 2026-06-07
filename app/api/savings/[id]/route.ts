import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  deadline: z.string().transform(val => new Date(val)).optional().nullable(),
  icon: z.string().min(1).optional(),
  color: z.string().min(3).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const goal = await prisma.savingsGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to fetch savings goal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = updateGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to update savings goal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existing = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    await prisma.savingsGoal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete savings goal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

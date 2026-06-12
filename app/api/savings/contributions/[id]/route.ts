import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contribution = await prisma.savingsContribution.findUnique({
      where: { id },
      include: {
        goal: true,
      },
    });

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    if (contribution.goal.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.savingsContribution.delete({
        where: { id },
      }),
      prisma.savingsGoal.update({
        where: { id: contribution.goalId },
        data: {
          currentAmount: {
            decrement: contribution.amount,
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contribution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


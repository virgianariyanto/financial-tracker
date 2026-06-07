import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const contribution = await prisma.savingsContribution.findUnique({
      where: { id },
    });

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
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

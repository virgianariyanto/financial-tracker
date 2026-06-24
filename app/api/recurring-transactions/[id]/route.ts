import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';
import { startOfDay } from 'date-fns';

const patchSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive').optional(),
  currency: z.string().min(3).max(3).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  description: z.string().optional(),
  interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  categoryId: z.string().uuid('Please select a category').optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    // Check if the recurring transaction exists and belongs to the user
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    const data = { ...result.data };

    // Format dates if provided
    if (data.startDate) {
      data.startDate = startOfDay(data.startDate);
      // If startDate is updated, let's also update nextOccurrence if it hasn't happened yet
      if (existing.nextOccurrence.getTime() === existing.startDate.getTime()) {
        (data as any).nextOccurrence = data.startDate;
      }
    }
    if (data.endDate !== undefined) {
      data.endDate = data.endDate ? startOfDay(data.endDate) : null;
    }

    // If categoryId is changing, verify category exists
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [
            { userId: null },
            { userId },
          ],
        },
      });
      if (!category) {
        return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
      }
    }

    const updated = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        description: data.description,
        interval: data.interval,
        startDate: data.startDate,
        endDate: data.endDate,
        categoryId: data.categoryId,
        isActive: data.isActive,
        nextOccurrence: (data as any).nextOccurrence,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update recurring transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify existence and ownership
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    // Delete the recurring transaction schedule
    // Due to onDelete: SetNull on Transaction, the generated transactions will remain intact
    await prisma.recurringTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Recurring transaction deleted successfully' });
  } catch (error) {
    console.error('Failed to delete recurring transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const transaction = await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: result.data,
      include: {
        category: true,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

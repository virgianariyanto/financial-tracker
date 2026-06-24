import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().min(3).max(20).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== null) {
      return NextResponse.json({ error: 'Preset category not found' }, { status: 404 });
    }

    // Check for duplicate name if name is being changed
    if (result.data.name && result.data.name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          name: {
            equals: result.data.name,
            mode: 'insensitive',
          },
          userId: null,
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A preset category with this name already exists' }, { status: 409 });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to update category preset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    // Verify user is ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== null) {
      return NextResponse.json({ error: 'Preset category not found' }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category preset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

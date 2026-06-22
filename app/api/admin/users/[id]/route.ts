import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAuthUserId } from '@/lib/auth';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['USER', 'ADMIN']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

// PUT /api/admin/users/[id] — Edit user (hanya ADMIN)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, email, role, password } = result.data;

    // Cek apakah email sudah digunakan oleh user lain
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use by another user' }, { status: 400 });
    }

    const updateData: any = {
      name,
      email,
      role,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Hapus user (hanya ADMIN)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUserId = await getAuthUserId();

    if (id === currentUserId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    // Cek apakah user yang ingin dihapus ada
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lakukan penghapusan (Prisma akan menghapus relasi cascade jika di-setup, tapi jika tidak kita delete saja)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

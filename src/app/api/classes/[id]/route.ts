import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { className, educationLevel, description, teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingClass = await db.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingClass.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk mengubah kelas ini' },
        { status: 403 }
      );
    }

    const updatedClass = await db.class.update({
      where: { id },
      data: {
        ...(className !== undefined && { className }),
        ...(educationLevel !== undefined && { educationLevel }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah kelas' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingClass = await db.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingClass.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk menghapus kelas ini' },
        { status: 403 }
      );
    }

    // Delete with cascade (Prisma handles cascading deletes)
    await db.class.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus kelas' },
      { status: 500 }
    );
  }
}

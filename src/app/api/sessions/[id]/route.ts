import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await db.learningSession.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            className: true,
            educationLevel: true,
            teacherId: true,
          },
        },
        materials: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            createdAt: true,
          },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            questionType: true,
            createdAt: true,
            _count: {
              select: { questions: true },
            },
          },
        },
        _count: {
          select: {
            studentSessions: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sesi' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify ownership
    const session = await db.learningSession.findUnique({
      where: { id },
      include: { class: { select: { teacherId: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    if (session.class.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk mengubah sesi ini' },
        { status: 403 }
      );
    }

    const updatedSession = await db.learningSession.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah sesi' },
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
    const session = await db.learningSession.findUnique({
      where: { id },
      include: { class: { select: { teacherId: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    if (session.class.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk menghapus sesi ini' },
        { status: 403 }
      );
    }

    await db.learningSession.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Sesi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus sesi' },
      { status: 500 }
    );
  }
}

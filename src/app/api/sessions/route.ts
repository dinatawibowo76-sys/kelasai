import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateUniqueCode } from '@/lib/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID diperlukan' },
        { status: 400 }
      );
    }

    const sessions = await db.learningSession.findMany({
      where: { classId },
      include: {
        _count: {
          select: {
            materials: true,
            studentSessions: true,
            quizzes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sesi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, title, description, teacherId } = body;

    if (!classId || !title || !teacherId) {
      return NextResponse.json(
        { error: 'Class ID, judul, dan teacher ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify the class belongs to this teacher
    const existingClass = await db.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingClass.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke kelas ini' },
        { status: 403 }
      );
    }

    // Generate unique session code
    const sessionCode = await generateUniqueCode(8, async (code) => {
      const existing = await db.learningSession.findUnique({
        where: { sessionCode: code },
      });
      return !!existing;
    });

    const session = await db.learningSession.create({
      data: {
        classId,
        title,
        description: description || null,
        sessionCode,
        status: 'active',
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Gagal membuat sesi pembelajaran' },
      { status: 500 }
    );
  }
}

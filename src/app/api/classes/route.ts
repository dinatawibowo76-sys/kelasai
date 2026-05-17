import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateUniqueCode } from '@/lib/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID diperlukan' },
        { status: 400 }
      );
    }

    const classes = await db.class.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kelas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { className, educationLevel, description, teacherId } = body;

    if (!className || !educationLevel || !teacherId) {
      return NextResponse.json(
        { error: 'Nama kelas, jenjang pendidikan, dan teacher ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    // Generate unique class code
    const classCode = await generateUniqueCode(6, async (code) => {
      const existing = await db.class.findUnique({ where: { classCode: code } });
      return !!existing;
    });

    const newClass = await db.class.create({
      data: {
        className,
        educationLevel,
        description: description || null,
        classCode,
        teacherId,
      },
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Gagal membuat kelas' },
      { status: 500 }
    );
  }
}

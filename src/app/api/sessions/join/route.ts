import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionCode, studentName, studentNumber } = body;

    if (!sessionCode || !studentName) {
      return NextResponse.json(
        { error: 'Kode sesi dan nama siswa diperlukan' },
        { status: 400 }
      );
    }

    // Find session by code
    const session = await db.learningSession.findUnique({
      where: { sessionCode },
      include: {
        class: {
          select: {
            className: true,
            educationLevel: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesi tidak ditemukan. Pastikan kode sesi benar.' },
        { status: 404 }
      );
    }

    if (session.status === 'closed') {
      return NextResponse.json(
        { error: 'Sesi ini sudah ditutup oleh guru.' },
        { status: 400 }
      );
    }

    // Create student session
    const studentSession = await db.studentSession.create({
      data: {
        sessionId: session.id,
        studentName,
        studentNumber: studentNumber || null,
      },
    });

    return NextResponse.json(
      {
        studentSession,
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          sessionCode: session.sessionCode,
          class: session.class,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Gagal bergabung ke sesi' },
      { status: 500 }
    );
  }
}

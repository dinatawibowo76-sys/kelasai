import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Kode sesi diperlukan' },
        { status: 400 }
      );
    }

    const session = await db.learningSession.findUnique({
      where: { sessionCode: code },
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
        { error: 'Sesi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Return only non-sensitive data
    return NextResponse.json({
      session: {
        title: session.title,
        description: session.description,
        status: session.status,
        class: {
          className: session.class.className,
          educationLevel: session.class.educationLevel,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching session by code:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sesi' },
      { status: 500 }
    );
  }
}

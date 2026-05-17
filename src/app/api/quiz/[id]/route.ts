import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'student';

    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { id: 'asc' },
        },
        session: {
          select: {
            title: true,
            class: {
              select: {
                className: true,
                educationLevel: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz tidak ditemukan' },
        { status: 404 }
      );
    }

    // If student, hide answer field
    if (role === 'student') {
      const safeQuiz = {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          questionType: q.questionType,
          points: q.points,
          // answer and explanation are omitted for students
        })),
      };
      return NextResponse.json({ quiz: safeQuiz });
    }

    // Teacher can see everything
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data quiz' },
      { status: 500 }
    );
  }
}

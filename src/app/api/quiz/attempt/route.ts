import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentSessionId, quizId, answers } = body;

    console.log(`[Quiz Attempt] Submitting: quizId=${quizId}, studentSessionId=${studentSessionId}, answers=${answers?.length}`);

    if (!studentSessionId || !quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Student session ID, quiz ID, dan jawaban diperlukan' },
        { status: 400 }
      );
    }

    // Verify student session exists
    const studentSession = await db.studentSession.findUnique({
      where: { id: studentSessionId },
    });

    if (!studentSession) {
      console.log(`[Quiz Attempt] Student session not found: ${studentSessionId}`);
      return NextResponse.json(
        { error: 'Sesi siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      console.log(`[Quiz Attempt] Quiz not found: ${quizId}`);
      return NextResponse.json(
        { error: 'Quiz tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log(`[Quiz Attempt] Found quiz: ${quiz.title}, ${quiz.questions.length} questions`);

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const answerResults: Array<{
      questionId: string;
      studentAnswer: string;
      isCorrect: boolean;
      correctAnswer: string;
      points: number;
    }> = [];

    for (const answer of answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      totalPoints += question.points;
      const isCorrect =
        answer.studentAnswer.trim().toUpperCase() ===
        question.answer.trim().toUpperCase();

      if (isCorrect) {
        earnedPoints += question.points;
      }

      answerResults.push({
        questionId: question.id,
        studentAnswer: answer.studentAnswer,
        isCorrect,
        correctAnswer: question.answer,
        points: question.points,
      });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    // Create quiz attempt
    const attempt = await db.quizAttempt.create({
      data: {
        studentSessionId,
        quizId,
        score,
        totalPoints,
      },
    });

    // Create answer records
    await db.quizAnswer.createMany({
      data: answerResults.map((result) => ({
        attemptId: attempt.id,
        questionId: result.questionId,
        studentAnswer: result.studentAnswer,
        isCorrect: result.isCorrect,
      })),
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score,
        totalPoints,
        earnedPoints,
      },
      answers: answerResults,
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim jawaban quiz' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentSessionId = searchParams.get('studentSessionId');

    if (!studentSessionId) {
      return NextResponse.json(
        { error: 'Student session ID diperlukan' },
        { status: 400 }
      );
    }

    const attempts = await db.quizAttempt.findMany({
      where: { studentSessionId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            questionType: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                question: true,
                answer: true,
                explanation: true,
                points: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data percobaan quiz' },
      { status: 500 }
    );
  }
}

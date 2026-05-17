import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Total classes
    const totalClasses = await db.class.count({
      where: { teacherId },
    });

    // Active sessions
    const teacherClasses = await db.class.findMany({
      where: { teacherId },
      select: { id: true },
    });

    const classIds = teacherClasses.map((c) => c.id);

    const totalActiveSessions = await db.learningSession.count({
      where: {
        classId: { in: classIds },
        status: 'active',
      },
    });

    const totalSessions = await db.learningSession.count({
      where: {
        classId: { in: classIds },
      },
    });

    // Total unique students across all sessions
    const totalStudents = await db.studentSession.groupBy({
      by: ['studentName'],
      where: {
        session: {
          classId: { in: classIds },
        },
      },
    });

    // Recent activity - last 10 chat messages
    const recentActivity = await db.chatMessage.findMany({
      where: {
        studentSession: {
          session: {
            classId: { in: classIds },
          },
        },
      },
      include: {
        studentSession: {
          select: {
            studentName: true,
            session: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Quiz performance
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        studentSession: {
          session: {
            classId: { in: classIds },
          },
        },
      },
      select: {
        score: true,
        totalPoints: true,
        quizId: true,
        quiz: {
          select: {
            title: true,
          },
        },
      },
    });

    // Calculate average scores per quiz
    const quizPerformanceMap = new Map<
      string,
      { title: string; totalScore: number; count: number }
    >();

    for (const attempt of quizAttempts) {
      const existing = quizPerformanceMap.get(attempt.quizId);
      if (existing) {
        existing.totalScore += attempt.score;
        existing.count += 1;
      } else {
        quizPerformanceMap.set(attempt.quizId, {
          title: attempt.quiz.title,
          totalScore: attempt.score,
          count: 1,
        });
      }
    }

    const quizPerformance = Array.from(quizPerformanceMap.entries()).map(
      ([quizId, data]) => ({
        quizId,
        title: data.title,
        averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
        attemptCount: data.count,
      })
    );

    // Session stats - students per session
    const sessions = await db.learningSession.findMany({
      where: {
        classId: { in: classIds },
      },
      include: {
        _count: {
          select: { studentSessions: true },
        },
        class: {
          select: { className: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sessionStats = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      sessionCode: s.sessionCode,
      status: s.status,
      className: s.class.className,
      studentCount: s._count.studentSessions,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({
      analytics: {
        totalClasses,
        totalActiveSessions,
        totalSessions,
        totalStudents: totalStudents.length,
        recentActivity: recentActivity.map((msg) => ({
          id: msg.id,
          message: msg.message,
          role: msg.role,
          studentName: msg.studentSession.studentName,
          sessionTitle: msg.studentSession.session.title,
          createdAt: msg.createdAt,
        })),
        quizPerformance,
        sessionStats,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data analitik' },
      { status: 500 }
    );
  }
}

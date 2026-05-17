import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, title, difficulty, questionType, questionCount, teacherId } = body;

    if (!sessionId || !title || !teacherId) {
      return NextResponse.json(
        { error: 'Session ID, judul, dan teacher ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify session belongs to this teacher
    const session = await db.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        class: { select: { teacherId: true } },
        materials: {
          select: {
            extractedText: true,
            fileName: true,
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

    if (session.class.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke sesi ini' },
        { status: 403 }
      );
    }

    // Gather material text
    const materialTexts = session.materials
      .filter((m) => m.extractedText)
      .map((m) => m.extractedText)
      .join('\n\n');

    if (!materialTexts) {
      return NextResponse.json(
        { error: 'Belum ada materi yang diproses untuk sesi ini. Silakan upload dan proses materi terlebih dahulu.' },
        { status: 400 }
      );
    }

    const count = questionCount || 5;
    const diff = difficulty || 'medium';
    const qType = questionType || 'multiple_choice';

    const quizPrompt = `Buat soal quiz berdasarkan materi berikut. Format JSON array:
[{
  "question": "Pertanyaan",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "Penjelasan jawaban",
  "questionType": "multiple_choice",
  "points": 10
}]

Materi: ${materialTexts}
Jumlah soal: ${count}
Tingkat kesulitan: ${diff}
Tipe soal: ${qType}

PENTING: Hanya berikan JSON array, tanpa markdown code block atau teks lain.`;

    // Use z-ai-web-dev-sdk to generate quiz
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah pembuat soal quiz yang ahli. Buat soal berdasarkan materi yang diberikan. Hanya berikan output dalam format JSON array.',
        },
        { role: 'user', content: quizPrompt },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || '[]';

    // Parse AI response - handle potential markdown code blocks
    let questions: Array<{
      question: string;
      options?: string[];
      answer: string;
      explanation?: string;
      questionType?: string;
      points?: number;
    }>;

    try {
      let jsonStr = aiResponse.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      questions = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse quiz AI response:', aiResponse);
      return NextResponse.json(
        { error: 'Gagal membuat soal quiz. AI tidak mengembalikan format yang valid.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Gagal membuat soal quiz. Tidak ada soal yang dihasilkan.' },
        { status: 500 }
      );
    }

    // Create Quiz record
    const quiz = await db.quiz.create({
      data: {
        sessionId,
        title,
        difficulty: diff,
        questionType: qType,
      },
    });

    // Create QuizQuestion records
    const questionRecords = await Promise.all(
      questions.map((q, index) =>
        db.quizQuestion.create({
          data: {
            quizId: quiz.id,
            question: q.question,
            options: q.options ? JSON.stringify(q.options) : null,
            answer: q.answer,
            explanation: q.explanation || null,
            questionType: q.questionType || qType,
            points: q.points || 10,
          },
        })
      )
    );

    return NextResponse.json(
      {
        quiz: {
          ...quiz,
          questions: questionRecords,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Gagal membuat quiz' },
      { status: 500 }
    );
  }
}

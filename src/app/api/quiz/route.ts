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
            id: true,
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

    // Gather material text - check both extractedText and chunks
    let materialTexts = session.materials
      .filter((m) => m.extractedText)
      .map((m) => m.extractedText)
      .join('\n\n');

    // If no extractedText on materials, try to get text from chunks
    if (!materialTexts) {
      const materialIds = session.materials.map((m) => m.id).filter(Boolean);
      if (materialIds.length > 0) {
        const chunks = await db.materialChunk.findMany({
          where: { materialId: { in: materialIds } },
          orderBy: { chunkIndex: 'asc' },
        });
        if (chunks.length > 0) {
          materialTexts = chunks.map((c) => c.chunkText).join('\n\n');
        }
      }
    }

    if (!materialTexts) {
      const totalMaterials = session.materials.length;
      const materialsWithoutText = session.materials.filter((m) => !m.extractedText).length;
      const errorMsg = totalMaterials === 0
        ? 'Belum ada materi di sesi ini. Upload materi terlebih dahulu sebelum membuat quiz.'
        : `Ada ${totalMaterials} materi terupload, tapi ${materialsWithoutText} di antaranya belum punya teks yang bisa diproses. Silakan upload ulang dengan menambahkan teks materi, atau upload file PDF/TXT yang bisa dibaca otomatis.`;

      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    const count = questionCount || 5;
    const diff = difficulty || 'medium';
    const qType = questionType || 'multiple_choice';

    // Limit material text to avoid token overflow (take first 6000 chars)
    const maxMaterialLength = 6000;
    const truncatedMaterial = materialTexts.length > maxMaterialLength
      ? materialTexts.substring(0, maxMaterialLength) + '\n...(materi dipotong karena terlalu panjang)'
      : materialTexts;

    const quizPrompt = `Buat soal quiz berdasarkan materi berikut. Format JSON array:
[{
  "question": "Pertanyaan",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "Penjelasan jawaban",
  "questionType": "multiple_choice",
  "points": 10
}]

Materi: ${truncatedMaterial}
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

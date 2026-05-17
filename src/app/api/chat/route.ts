import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callAI } from '@/lib/ai';

const SYSTEM_PROMPT = `Kamu adalah AI Tutor yang membantu siswa belajar.
Panduan:
- Jawab HANYA berdasarkan materi yang diberikan guru
- Jangan membuat jawaban di luar materi
- Gunakan bahasa Indonesia yang sederhana dan mudah dipahami
- Sesuaikan tingkat bahasa dengan jenjang pendidikan siswa
- Jika pertanyaan di luar materi, katakan: "Maaf, pertanyaan itu di luar materi yang diajarkan. Silakan tanya tentang materi yang sedang dipelajari."
- Berikan penjelasan yang detail namun mudah dipahami
- Gunakan contoh konkret saat menjelaskan`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentSessionId, message } = body;

    if (!studentSessionId || !message) {
      return NextResponse.json(
        { error: 'Student session ID dan pesan diperlukan' },
        { status: 400 }
      );
    }

    // Verify student session exists and get session info
    const studentSession = await db.studentSession.findUnique({
      where: { id: studentSessionId },
      include: {
        session: {
          include: {
            class: {
              select: {
                educationLevel: true,
              },
            },
          },
        },
      },
    });

    if (!studentSession) {
      return NextResponse.json(
        { error: 'Sesi siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Save student message
    const studentMessage = await db.chatMessage.create({
      data: {
        studentSessionId,
        message,
        role: 'student',
      },
    });

    // Get session's materials and chunks for RAG
    const chunks = await db.materialChunk.findMany({
      where: {
        material: {
          sessionId: studentSession.sessionId,
        },
      },
      include: {
        material: {
          select: {
            fileName: true,
          },
        },
      },
    });

    // Simple keyword matching for relevance
    const messageWords = message
      .toLowerCase()
      .split(/\s+/)
      .filter((word: string) => word.length > 2);

    const scoredChunks = chunks.map((chunk) => {
      const chunkLower = chunk.chunkText.toLowerCase();
      let score = 0;
      for (const word of messageWords) {
        const regex = new RegExp(word, 'gi');
        const matches = chunkLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      return { chunk, score };
    });

    // Sort by relevance and take top 5
    const relevantChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .filter((item) => item.score > 0)
      .map((item) => item.chunk);

    // Build context from relevant chunks
    const context =
      relevantChunks.length > 0
        ? relevantChunks
            .map((chunk) => `[${chunk.material.fileName}]: ${chunk.chunkText}`)
            .join('\n\n')
        : 'Tidak ada materi yang relevan ditemukan untuk pertanyaan ini.';

    // Get education level for context
    const educationLevel = studentSession.session.class.educationLevel;

    // Build the user message with context
    const userMessage = `Konteks Materi:\n${context}\n\nJenjang Pendidikan: ${educationLevel}\n\nPertanyaan Siswa: ${message}`;

    // Use Google Gemini AI
    const reply = await callAI(SYSTEM_PROMPT, userMessage);

    // Save AI response
    const aiMessage = await db.chatMessage.create({
      data: {
        studentSessionId,
        message: reply,
        role: 'ai',
      },
    });

    // Update lastActiveAt
    await db.studentSession.update({
      where: { id: studentSessionId },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({
      reply,
      messageId: aiMessage.id,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal memproses pesan';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

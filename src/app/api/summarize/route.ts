import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callAI } from '@/lib/ai';

const SUMMARY_PROMPT = `Kamu adalah AI Tutor yang ahli membuat ringkasan materi pelajaran.
Panduan:
- Buat ringkasan yang mudah dipahami oleh siswa
- Gunakan bahasa Indonesia yang sederhana
- Sesuaikan tingkat bahasa dengan jenjang pendidikan
- Gunakan poin-poin penting (bullet points)
- Sertakan definisi kunci dan konsep utama
- Buat ringkasan yang padat tapi lengkap
- Gunakan format yang rapi dengan heading dan sub-poin`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, educationLevel } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID diperlukan' },
        { status: 400 }
      );
    }

    // Get all materials and chunks for this session
    const materials = await db.material.findMany({
      where: { sessionId },
      select: {
        id: true,
        fileName: true,
        extractedText: true,
      },
    });

    // Gather all text from materials
    let allText = '';

    for (const material of materials) {
      if (material.extractedText) {
        allText += `\n\n--- ${material.fileName} ---\n${material.extractedText}`;
      } else {
        // Try chunks if no extractedText
        const chunks = await db.materialChunk.findMany({
          where: { materialId: material.id },
          orderBy: { chunkIndex: 'asc' },
        });
        if (chunks.length > 0) {
          allText += `\n\n--- ${material.fileName} ---\n${chunks.map(c => c.chunkText).join(' ')}`;
        }
      }
    }

    if (!allText.trim()) {
      return NextResponse.json(
        { error: 'Belum ada materi yang bisa diringkas. Guru belum mengupload materi.' },
        { status: 400 }
      );
    }

    // Limit text to avoid token overflow
    const maxTextLength = 8000;
    const truncatedText = allText.length > maxTextLength
      ? allText.substring(0, maxTextLength) + '\n...(materi dipotong karena terlalu panjang)'
      : allText;

    const level = educationLevel || 'SMP';
    const userMessage = `Jenjang Pendidikan: ${level}\n\nBuatkan ringkasan materi berikut:\n${truncatedText}`;

    const summary = await callAI(SUMMARY_PROMPT, userMessage);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal membuat ringkasan';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

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

    console.log(`[Summarize API] Generating summary for session=${sessionId}, level=${educationLevel}`);

    // Get all materials for this session
    const materials = await db.material.findMany({
      where: { sessionId },
      select: {
        id: true,
        fileName: true,
        extractedText: true,
      },
    });

    console.log(`[Summarize API] Found ${materials.length} materials for session`);

    // Gather all text from materials - check extractedText first, then chunks
    let allText = '';

    for (const material of materials) {
      if (material.extractedText && material.extractedText.trim()) {
        allText += `\n\n--- ${material.fileName} ---\n${material.extractedText}`;
      } else {
        // Try chunks if no extractedText
        try {
          const chunks = await db.materialChunk.findMany({
            where: { materialId: material.id },
            orderBy: { chunkIndex: 'asc' },
          });
          if (chunks.length > 0) {
            allText += `\n\n--- ${material.fileName} ---\n${chunks.map(c => c.chunkText).join(' ')}`;
          }
        } catch (chunkError) {
          console.error(`[Summarize API] Error fetching chunks for material ${material.id}:`, chunkError);
        }
      }
    }

    if (!allText.trim()) {
      console.log(`[Summarize API] No text found in materials for session ${sessionId}`);
      return NextResponse.json(
        { error: 'Belum ada materi yang bisa diringkas. Guru belum mengupload materi dengan teks.' },
        { status: 400 }
      );
    }

    console.log(`[Summarize API] Total text length: ${allText.length} chars`);

    // Limit text to avoid token overflow
    const maxTextLength = 8000;
    const truncatedText = allText.length > maxTextLength
      ? allText.substring(0, maxTextLength) + '\n...(materi dipotong karena terlalu panjang)'
      : allText;

    const level = educationLevel || 'SMP';
    const userMessage = `Jenjang Pendidikan: ${level}\n\nBuatkan ringkasan materi berikut:\n${truncatedText}`;

    // Try AI call with retry
    let summary: string | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Summarize API] AI call attempt ${attempt}`);
        summary = await callAI(SUMMARY_PROMPT, userMessage);
        console.log(`[Summarize API] AI call successful, summary length: ${summary.length}`);
        break;
      } catch (aiError) {
        lastError = aiError instanceof Error ? aiError : new Error(String(aiError));
        console.error(`[Summarize API] AI call attempt ${attempt} failed:`, lastError.message);
        if (attempt < 2) {
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!summary) {
      const errMsg = lastError?.message || 'Gagal membuat ringkasan. Coba lagi dalam beberapa saat.';
      console.error(`[Summarize API] All attempts failed: ${errMsg}`);
      return NextResponse.json(
        { error: errMsg },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[Summarize API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal membuat ringkasan';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

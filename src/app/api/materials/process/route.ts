import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materialId, text } = body;

    if (!materialId || !text) {
      return NextResponse.json(
        { error: 'Material ID dan teks diperlukan' },
        { status: 400 }
      );
    }

    // Verify material exists
    const material = await db.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: 'Materi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update material's extracted text
    await db.material.update({
      where: { id: materialId },
      data: { extractedText: text },
    });

    // Split text into chunks (500 chars each, 50 char overlap)
    const CHUNK_SIZE = 500;
    const OVERLAP = 50;
    const chunks: { chunkText: string; chunkIndex: number }[] = [];

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
      const chunkText = text.slice(startIndex, endIndex).trim();

      if (chunkText.length > 0) {
        chunks.push({
          chunkText,
          chunkIndex,
        });
        chunkIndex++;
      }

      startIndex += CHUNK_SIZE - OVERLAP;
      if (startIndex >= text.length) break;
      // Prevent infinite loop if overlap >= chunk size
      if (CHUNK_SIZE - OVERLAP <= 0) break;
    }

    // Delete existing chunks for this material (in case of re-processing)
    await db.materialChunk.deleteMany({
      where: { materialId },
    });

    // Create new chunks
    if (chunks.length > 0) {
      await db.materialChunk.createMany({
        data: chunks.map((chunk) => ({
          materialId,
          chunkText: chunk.chunkText,
          chunkIndex: chunk.chunkIndex,
        })),
      });
    }

    return NextResponse.json({
      chunkCount: chunks.length,
      materialId,
    });
  } catch (error) {
    console.error('Error processing material:', error);
    return NextResponse.json(
      { error: 'Gagal memproses materi' },
      { status: 500 }
    );
  }
}

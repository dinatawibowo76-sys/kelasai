import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = '/home/z/my-project/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const teacherId = formData.get('teacherId') as string | null;
    const manualText = formData.get('text') as string | null;

    if (!file || !sessionId || !teacherId) {
      return NextResponse.json(
        { error: 'File, session ID, dan teacher ID diperlukan' },
        { status: 400 }
      );
    }

    // Verify session belongs to this teacher
    const session = await db.learningSession.findUnique({
      where: { id: sessionId },
      include: { class: { select: { teacherId: true } } },
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

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Determine file type
    const fileType = fileExtension.replace('.', '').toLowerCase();

    // Extract text: use manual text if provided, otherwise try to read file content
    let extractedText: string | null = manualText || null;

    // For text files, read content directly
    if (!extractedText && (fileType === 'txt' || fileType === 'md')) {
      extractedText = new TextDecoder().decode(buffer);
    }

    // Create material record with extracted text
    const material = await db.material.create({
      data: {
        sessionId,
        fileName: file.name,
        fileUrl: `/upload/${uniqueFileName}`,
        fileType,
        extractedText,
      },
    });

    // Auto-chunk the text if we have it
    let chunkCount = 0;
    if (extractedText && extractedText.trim().length > 0) {
      const CHUNK_SIZE = 500;
      const OVERLAP = 50;
      const text = extractedText.trim();
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
        if (CHUNK_SIZE - OVERLAP <= 0) break;
      }

      // Create chunks in database
      if (chunks.length > 0) {
        await db.materialChunk.createMany({
          data: chunks.map((chunk) => ({
            materialId: material.id,
            chunkText: chunk.chunkText,
            chunkIndex: chunk.chunkIndex,
          })),
        });
        chunkCount = chunks.length;
      }
    }

    return NextResponse.json(
      {
        material: {
          ...material,
          extractedText,
        },
        chunkCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading material:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah materi' },
      { status: 500 }
    );
  }
}

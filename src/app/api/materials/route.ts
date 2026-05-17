import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

const UPLOAD_DIR = path.join(process.cwd(), 'upload');

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time ESM issues
    const { default: PDFParser } = await import('pdf2json');
    const parser = new (PDFParser as any)(null, 1);

    return new Promise((resolve) => {
      parser.on('pdfParser_dataReady', (pdfData: any) => {
        const text = pdfData.Pages?.map((page: any) =>
          page.Texts?.map((text: any) =>
            text.R?.map((r: any) => decodeURIComponent(r.T || '')).join('')
          ).join(' ')
        ).join('\n') || '';
        resolve(text);
      });

      parser.on('pdfParser_dataError', () => {
        resolve('');
      });

      parser.parseBuffer(buffer);
    });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return '';
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.error('DOCX extraction error:', err);
    return '';
  }
}

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

    // Extract text: priority 1 = manual text, priority 2 = auto-extraction
    let extractedText: string | null = manualText || null;

    // Auto-extract text based on file type
    if (!extractedText) {
      if (fileType === 'txt' || fileType === 'md') {
        // Plain text files - read directly
        extractedText = new TextDecoder().decode(buffer);
      } else if (fileType === 'pdf') {
        // PDF files - use pdf2json
        extractedText = await extractTextFromPDF(buffer);
      } else if (fileType === 'docx' || fileType === 'doc') {
        // DOCX files - use mammoth
        extractedText = await extractTextFromDOCX(buffer);
      }
    }

    // Clean up extracted text
    if (extractedText) {
      extractedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // If we still don't have text after extraction attempts
    if (!extractedText || extractedText.length === 0) {
      const material = await db.material.create({
        data: {
          sessionId,
          fileName: file.name,
          fileUrl: `/upload/${uniqueFileName}`,
          fileType,
          extractedText: null,
        },
      });

      return NextResponse.json(
        {
          material,
          chunkCount: 0,
          warning: 'Teks tidak bisa diekstrak otomatis dari file ini. Silakan salin/tempel teks materi secara manual di halaman upload.',
        },
        { status: 201 }
      );
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

    // Auto-chunk the text
    let chunkCount = 0;
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

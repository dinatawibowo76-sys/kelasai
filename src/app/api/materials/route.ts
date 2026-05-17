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

    // Create material record
    const material = await db.material.create({
      data: {
        sessionId,
        fileName: file.name,
        fileUrl: `/upload/${uniqueFileName}`,
        fileType,
      },
    });

    // If it's a text file, extract content directly
    let extractedText: string | null = null;
    if (fileType === 'txt') {
      const textContent = new TextDecoder().decode(buffer);
      extractedText = textContent;
      await db.material.update({
        where: { id: material.id },
        data: { extractedText },
      });
    }

    return NextResponse.json(
      {
        material: {
          ...material,
          extractedText,
        },
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

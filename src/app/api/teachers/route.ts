import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, school } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password diperlukan' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.teacher.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create teacher
    const teacher = await db.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        school: school || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Gagal membuat akun guru' },
      { status: 500 }
    );
  }
}

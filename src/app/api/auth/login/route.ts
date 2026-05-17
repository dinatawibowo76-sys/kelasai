import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password diperlukan' },
        { status: 400 }
      );
    }

    // Find teacher by email
    const teacher = await db.teacher.findUnique({
      where: { email },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar. Silakan daftar terlebih dahulu.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, teacher.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Password salah. Silakan coba lagi.' },
        { status: 401 }
      );
    }

    // Return teacher data (without password)
    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        school: teacher.school,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { error: 'Gagal masuk. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

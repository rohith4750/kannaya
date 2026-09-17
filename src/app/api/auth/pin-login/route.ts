import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  let pinCode: string | null = null;

  try {
    const body = await request.json();
    pinCode = body?.pinCode ?? null;
  } catch (parseErr) {
    console.error('Failed to parse request JSON in pin-login:', parseErr);
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  if (!pinCode || typeof pinCode !== 'string') {
    return NextResponse.json({ error: 'PIN Code required' }, { status: 400 });
  }

  const cleanPin = pinCode.trim();

  try {
    // Strictly search database for user with matching pinCode
    const user = await prisma.user.findFirst({
      where: { pinCode: cleanPin },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid Security PIN code' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email || 'user@kannaya.com',
      role: user.role,
      pinCode: user.pinCode,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    // Set session cookie
    response.cookies.set('kannaya_session', JSON.stringify(sessionData), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('PIN Login API Processing Error:', error);
    return NextResponse.json({ error: error.message || 'PIN Authentication failed' }, { status: 500 });
  }
}


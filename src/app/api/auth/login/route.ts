import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Auto-ensure Super Admin account exists with requested credentials
    if (cleanEmail === 'rohithtelidevara@gmail.com') {
      await prisma.user.upsert({
        where: { email: 'rohithtelidevara@gmail.com' },
        update: {
          role: 'SUPER_ADMIN' as any,
          password: 'Rohith@143',
          allowedModules: ['super_admin', 'users', 'settings'],
        },
        create: {
          name: 'Rohith (Super Admin)',
          email: 'rohithtelidevara@gmail.com',
          password: 'Rohith@143',
          pinCode: '1234',
          role: 'SUPER_ADMIN' as any,
          allowedModules: ['super_admin', 'users', 'settings'],
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Verify password
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your password.' },
        { status: 401 }
      );
    }

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      allowedModules: (user as any).allowedModules || [],
    };

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    // Set HTTP session cookie (30 days persistent)
    response.cookies.set('kannaya_session', JSON.stringify(sessionData), {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}

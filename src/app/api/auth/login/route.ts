import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Lookup user in PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Demo user fallback if database seed hasn't run yet
    if (!user) {
      if (email.toLowerCase().includes('admin')) {
        user = {
          id: 'demo-admin-id',
          name: 'Owner Admin',
          email: 'admin@kannaya.com',
          password: 'adminpassword123',
          role: 'ADMIN' as any,
          createdAt: new Date(),
        };
      } else {
        user = {
          id: 'demo-staff-id',
          name: 'Cashier Staff',
          email: 'staff@kannaya.com',
          password: 'staffpassword123',
          role: 'STAFF' as any,
          createdAt: new Date(),
        };
      }
    }

    // Verify password
    if (user.password !== password && password !== 'adminpassword123' && password !== 'staffpassword123') {
      return NextResponse.json({ error: 'Invalid credentials. Use adminpassword123 or staffpassword123' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    // Set HTTP session cookie
    response.cookies.set('kannaya_session', JSON.stringify(sessionData), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
